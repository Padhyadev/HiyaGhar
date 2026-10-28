using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Services;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Tests;

public class AutoOfferTests
{
    private static DataContext NewContext()
    {
        var options = new DbContextOptionsBuilder<DataContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new DataContext(options);
    }

    private static Coupon Offer(string code, decimal minOrder, decimal value, CouponDiscountType type = CouponDiscountType.Percent) => new()
    {
        Code = code,
        DiscountType = type,
        DiscountValue = value,
        MinOrderAmount = minOrder,
        StartDate = DateTime.Now.AddDays(-1),
        EndDate = DateTime.Now.AddDays(30),
        IsActive = true
    };

    private static async Task<CouponService> ServiceWith(params Coupon[] coupons) => await ServiceWith(false, coupons);

    private static async Task<CouponService> ServiceWith(bool hasPriorOrder, params Coupon[] coupons)
    {
        var context = NewContext();
        context.Customers.Add(new Customer { CustomerId = 1, Email = "a@b.com", MobileNo = "9999999999" });
        context.Coupons.AddRange(coupons);
        if (hasPriorOrder)
        {
            context.Orders.Add(new Order { CustomerId = 1, OrderNumber = "ORD-1" });
        }
        await context.SaveChangesAsync();
        return new CouponService(context);
    }

    [Fact]
    public async Task BelowMinimum_NothingApplied_AndShowsAmountNeeded()
    {
        var service = await ServiceWith(Offer("OFFER300", 300, 10));

        var result = await service.GetAutoOfferAsync(1, 200);

        Assert.Null(result.Applied);
        Assert.NotNull(result.Next);
        Assert.Equal(100m, result.Next!.AmountNeeded);
        Assert.Equal(30m, result.Next.DiscountAmount);
    }

    [Fact]
    public async Task AtOrAboveMinimum_AppliesAutomatically_WithoutCode()
    {
        var service = await ServiceWith(Offer("OFFER300", 300, 10));

        var result = await service.ResolveDiscountAsync(null, 1, 450);

        Assert.True(result.IsValid);
        Assert.Equal(45m, result.DiscountAmount);
        Assert.Equal("OFFER300", result.Coupon?.Code);
    }

    [Fact]
    public async Task PicksBiggestDiscount_AndNudgesToNextTier()
    {
        var service = await ServiceWith(
            Offer("OFFER300", 300, 10),
            Offer("OFFER1000", 1000, 15),
            Offer("FLAT20", 0, 20, CouponDiscountType.Flat));

        var result = await service.GetAutoOfferAsync(1, 500);

        Assert.Equal("OFFER300", result.Applied?.Coupon?.Code); // 10% of 500 = 50 beats flat 20
        Assert.Equal(50m, result.Applied!.DiscountAmount);
        Assert.Equal("OFFER1000", result.Next?.Coupon.Code);
        Assert.Equal(500m, result.Next!.AmountNeeded);
    }

    [Fact]
    public async Task SamePercentAtHigherMinimum_IsNotShownAsNextOffer()
    {
        var service = await ServiceWith(Offer("ALWAYS10", 0, 10), Offer("OFFER300", 300, 10));

        var result = await service.GetAutoOfferAsync(1, 200);

        Assert.Equal(20m, result.Applied?.DiscountAmount);
        Assert.Null(result.Next);
    }

    [Fact]
    public async Task InactiveOrExpiredOffers_AreIgnored()
    {
        var inactive = Offer("OFF1", 100, 10);
        inactive.IsActive = false;
        var expired = Offer("OFF2", 100, 10);
        expired.EndDate = DateTime.Now.AddDays(-1);
        var service = await ServiceWith(inactive, expired);

        var result = await service.GetAutoOfferAsync(1, 500);

        Assert.Null(result.Applied);
        Assert.Null(result.Next);
    }

    [Fact]
    public async Task FirstOrderOnlyOffer_SkippedForReturningCustomer()
    {
        var firstOrder = Offer("FIRST", 300, 10);
        firstOrder.IsFirstOrderOnly = true;
        var service = await ServiceWith(hasPriorOrder: true, firstOrder);

        var result = await service.GetAutoOfferAsync(1, 500);

        Assert.Null(result.Applied);
    }
}
