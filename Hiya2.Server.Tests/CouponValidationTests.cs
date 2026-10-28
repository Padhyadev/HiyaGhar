using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Services;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Tests;

public class CouponValidationTests
{
    private static DataContext NewContext()
    {
        var options = new DbContextOptionsBuilder<DataContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new DataContext(options);
    }

    private static Coupon CreateTestCoupon(
        string code = "SAVE10",
        CouponDiscountType type = CouponDiscountType.Percent,
        decimal value = 10m,
        decimal minOrder = 0m,
        decimal? maxDiscount = null) => new()
    {
        Code = code,
        DiscountType = type,
        DiscountValue = value,
        MinOrderAmount = minOrder,
        MaxDiscountAmount = maxDiscount,
        StartDate = DateTime.Now.AddDays(-1),
        EndDate = DateTime.Now.AddDays(30),
        IsActive = true
    };

    [Fact]
    public async Task Validate_ValidPercentCoupon_CalculatesDiscountCorrectly()
    {
        using var context = NewContext();
        context.Coupons.Add(CreateTestCoupon("SAVE10", CouponDiscountType.Percent, 10m));
        await context.SaveChangesAsync();

        var service = new CouponService(context);
        var result = await service.ValidateAsync("SAVE10", customerId: 1, cartSubtotal: 500m);

        Assert.True(result.IsValid);
        Assert.Equal(50m, result.DiscountAmount);
    }

    [Fact]
    public async Task Validate_PercentCouponWithMaxDiscount_CapsAtMaxLimit()
    {
        using var context = NewContext();
        context.Coupons.Add(CreateTestCoupon("BIG20", CouponDiscountType.Percent, 20m, maxDiscount: 100m));
        await context.SaveChangesAsync();

        var service = new CouponService(context);
        // 20% of 1000 is 200, but capped at 100
        var result = await service.ValidateAsync("BIG20", customerId: 1, cartSubtotal: 1000m);

        Assert.True(result.IsValid);
        Assert.Equal(100m, result.DiscountAmount);
    }

    [Fact]
    public async Task Validate_FlatCoupon_CalculatesFlatDiscount()
    {
        using var context = NewContext();
        context.Coupons.Add(CreateTestCoupon("FLAT50", CouponDiscountType.Flat, 50m));
        await context.SaveChangesAsync();

        var service = new CouponService(context);
        var result = await service.ValidateAsync("FLAT50", customerId: 1, cartSubtotal: 300m);

        Assert.True(result.IsValid);
        Assert.Equal(50m, result.DiscountAmount);
    }

    [Fact]
    public async Task Validate_DiscountExceedsSubtotal_CapsAtSubtotal()
    {
        using var context = NewContext();
        context.Coupons.Add(CreateTestCoupon("FLAT100", CouponDiscountType.Flat, 100m));
        await context.SaveChangesAsync();

        var service = new CouponService(context);
        // Cart total is only 40, so discount cannot exceed 40
        var result = await service.ValidateAsync("FLAT100", customerId: 1, cartSubtotal: 40m);

        Assert.True(result.IsValid);
        Assert.Equal(40m, result.DiscountAmount);
    }

    [Fact]
    public async Task Validate_CartBelowMinOrderAmount_FailsWithCleanMessage()
    {
        using var context = NewContext();
        context.Coupons.Add(CreateTestCoupon("MIN500", minOrder: 500m));
        await context.SaveChangesAsync();

        var service = new CouponService(context);
        var result = await service.ValidateAsync("MIN500", customerId: 1, cartSubtotal: 350m);

        Assert.False(result.IsValid);
        Assert.Contains("Minimum order amount", result.Message);
        Assert.Equal(0m, result.DiscountAmount);
    }

    [Fact]
    public async Task Validate_ExpiredOrInactive_Fails()
    {
        using var context = NewContext();
        var expired = CreateTestCoupon("EXPIRED");
        expired.EndDate = DateTime.Now.AddDays(-2);

        var inactive = CreateTestCoupon("INACTIVE");
        inactive.IsActive = false;

        context.Coupons.AddRange(expired, inactive);
        await context.SaveChangesAsync();

        var service = new CouponService(context);

        var resExpired = await service.ValidateAsync("EXPIRED", 1, 500m);
        var resInactive = await service.ValidateAsync("INACTIVE", 1, 500m);

        Assert.False(resExpired.IsValid);
        Assert.False(resInactive.IsValid);
    }

    [Fact]
    public async Task Validate_MaxUsageExceeded_Fails()
    {
        using var context = NewContext();
        var coupon = CreateTestCoupon("LIMITED");
        coupon.MaxUsage = 1;
        context.Coupons.Add(coupon);
        await context.SaveChangesAsync();

        // 1 usage already recorded
        context.CouponUsages.Add(new CouponUsage { CouponId = coupon.Id, CustomerId = 99, DiscountAmount = 10 });
        await context.SaveChangesAsync();

        var service = new CouponService(context);
        var result = await service.ValidateAsync("LIMITED", customerId: 1, cartSubtotal: 500m);

        Assert.False(result.IsValid);
        Assert.Contains("usage limit", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Validate_PerCustomerUsage_BlocksSecondAttemptEvenBySameGuestPhone()
    {
        using var context = NewContext();
        var coupon = CreateTestCoupon("ONCEPERUSER");
        coupon.PerCustomerUsage = 1;
        context.Coupons.Add(coupon);

        // First guest checkout session
        var customer1 = new Customer { CustomerId = 10, Email = "guest@hiyaghar.com", MobileNo = "9876543210" };
        // Second guest checkout session with different CustomerId but same mobile
        var customer2 = new Customer { CustomerId = 11, Email = "other@hiyaghar.com", MobileNo = "9876543210" };
        context.Customers.AddRange(customer1, customer2);

        // Record customer1 used it
        context.CouponUsages.Add(new CouponUsage { CouponId = coupon.Id, CustomerId = 10, DiscountAmount = 10 });
        await context.SaveChangesAsync();

        var service = new CouponService(context);
        // Customer 11 attempts to use it
        var result = await service.ValidateAsync("ONCEPERUSER", customerId: 11, cartSubtotal: 500m);

        Assert.False(result.IsValid);
        Assert.Contains("already used this coupon", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Validate_FirstOrderOnly_BlocksCustomerWithPriorOrder()
    {
        using var context = NewContext();
        var coupon = CreateTestCoupon("WELCOMEFIRST");
        coupon.IsFirstOrderOnly = true;
        context.Coupons.Add(coupon);

        context.Customers.Add(new Customer { CustomerId = 5, Email = "shopper@test.com" });
        context.Orders.Add(new Order { CustomerId = 5, OrderNumber = "ORD-EXISTING-1" });
        await context.SaveChangesAsync();

        var service = new CouponService(context);
        var result = await service.ValidateAsync("WELCOMEFIRST", customerId: 5, cartSubtotal: 500m);

        Assert.False(result.IsValid);
        Assert.Contains("first-time orders only", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Validate_CaseInsensitiveAndTrimsWhitespace()
    {
        using var context = NewContext();
        context.Coupons.Add(CreateTestCoupon("FESTIVE15", CouponDiscountType.Percent, 15m));
        await context.SaveChangesAsync();

        var service = new CouponService(context);
        var result = await service.ValidateAsync("  festive15  ", customerId: 1, cartSubtotal: 200m);

        Assert.True(result.IsValid);
        Assert.Equal(30m, result.DiscountAmount);
    }
}

