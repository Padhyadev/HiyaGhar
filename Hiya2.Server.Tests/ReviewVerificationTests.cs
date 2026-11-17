using System.Text.Json;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Seo;
using Hiya2.Server.Services;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Tests;

/// <summary>Only customers who received a product may review it, and only their reviews go to Google.</summary>
public class ReviewVerificationTests
{
    private static DataContext NewDb()
    {
        var db = new DataContext(new DbContextOptionsBuilder<DataContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        // Registered customer 1, and guest-checkout row 2 for the same person (same email); stranger 3.
        db.Customers.AddRange(
            new Customer { CustomerId = 1, FirstName = "Neha", LastName = "Joshi", Email = "neha@example.com", MobileNo = "9000000001" },
            new Customer { CustomerId = 2, FirstName = "Neha", LastName = "Joshi", Email = "NEHA@example.com", MobileNo = "", IsGuest = true },
            new Customer { CustomerId = 3, FirstName = "Ravi", LastName = "Shah", Email = "ravi@example.com", MobileNo = "9000000003" });
        // Delivered guest order with product 5; a shipped (not yet delivered) order with product 6.
        db.Orders.Add(new Order { Id = 10, CustomerId = 2, OrderNumber = "ORD-1", OrderStatus = OrderStatus.Delivered, Items = { new OrderItem { Id = 100, ProductId = 5, ProductName = "Choco Masti" } } });
        db.Orders.Add(new Order { Id = 11, CustomerId = 1, OrderNumber = "ORD-2", OrderStatus = OrderStatus.Shipped, Items = { new OrderItem { Id = 101, ProductId = 6, ProductName = "Jamun Pop" } } });
        db.SaveChanges();
        return db;
    }

    [Fact]
    public async Task Guest_order_with_the_same_email_counts_and_only_delivered_orders_count()
    {
        await using var db = NewDb();
        var linked = await ReviewVerification.LinkedCustomerIdsAsync(db, 1);

        Assert.Equal(new long[] { 1, 2 }, linked.OrderBy(x => x));
        Assert.True(await ReviewVerification.HasDeliveredOrderAsync(db, linked, 5));   // guest order, delivered
        Assert.False(await ReviewVerification.HasDeliveredOrderAsync(db, linked, 6));  // only shipped
        Assert.False(await ReviewVerification.HasDeliveredOrderAsync(db, await ReviewVerification.LinkedCustomerIdsAsync(db, 3), 5)); // stranger
    }

    [Fact]
    public async Task Only_reviews_by_buyers_are_verified_and_a_second_review_is_detected()
    {
        await using var db = NewDb();
        var buyer = new Review { Id = 1, CustomerId = 1, ProductId = 5, Rating = 5, ReviewText = "Lovely" };
        var stranger = new Review { Id = 2, CustomerId = 3, ProductId = 5, Rating = 1, ReviewText = "Never bought it" };
        db.Reviews.AddRange(buyer, stranger);
        await db.SaveChangesAsync();

        var verified = await ReviewVerification.VerifiedReviewIdsAsync(db, new[] { buyer, stranger });
        Assert.Equal(new long[] { 1 }, verified);
        // The guest row of the same person has already reviewed through the registered row.
        Assert.True(await ReviewVerification.HasReviewedAsync(db, await ReviewVerification.LinkedCustomerIdsAsync(db, 2), 5));
    }

    [Fact]
    public void Product_rating_is_only_added_when_there_are_verified_reviews()
    {
        var c = new SeoConfig { SiteUrl = "https://hiyaghar.com", SiteName = "HIYAGHAR" };
        var p = new Product { Id = 5, ProductName = "Choco Masti", BasePrice = 70 };
        p.Variants.Add(new ProductVariant { Id = 1, VariantName = "150 g", SKU = "SKU-1", Price = 70, AvailableStock = 5, IsActive = true });

        JsonElement Node(IReadOnlyList<SeoMarkup.ProductReview>? reviews) =>
            JsonDocument.Parse(SeoMarkup.SerializeJsonLd(new[] { SeoMarkup.ProductNode(c, p, "d", new List<string> { "/i.webp" }, "/product/choco-masti", reviews) }))
                .RootElement.GetProperty("@graph")[0];

        var none = Node(new List<SeoMarkup.ProductReview>());
        Assert.False(none.TryGetProperty("aggregateRating", out _));
        Assert.False(none.TryGetProperty("review", out _));

        var reviews = Enumerable.Range(1, 6).Select(i => new SeoMarkup.ProductReview($"Buyer {i}", i % 2 == 0 ? 5 : 4, "Good", new DateTime(2026, 11, i))).ToList();
        var some = Node(reviews);
        Assert.Equal(4.5, some.GetProperty("aggregateRating").GetProperty("ratingValue").GetDouble());
        Assert.Equal(6, some.GetProperty("aggregateRating").GetProperty("reviewCount").GetInt32());
        Assert.Equal(5, some.GetProperty("review").GetArrayLength()); // at most 5 reviews
        Assert.Equal("Buyer 1", some.GetProperty("review")[0].GetProperty("author").GetProperty("name").GetString());
    }
}
