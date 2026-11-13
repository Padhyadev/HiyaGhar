using Microsoft.EntityFrameworkCore;
using Hiya2.Server.Models;

namespace HIyaghar.Infra
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options)
            : base(options)
        {
        }

        public DbSet<Customer> Customers { get; set; }
        public DbSet<CustomerAddress> CustomerAddresses { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Menu> Menus { get; set; }
        public DbSet<RoleMenuPermission> RoleMenuPermissions { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductVariant> ProductVariants { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<HomePageComponent> HomePageComponents { get; set; }
        public DbSet<HomePageComponentItem> HomePageComponentItems { get; set; }
        public DbSet<AttributeEntity> Attributes { get; set; }
        public DbSet<AttributeValue> AttributeValues { get; set; }

        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<CouponUsage> CouponUsages { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }
        public DbSet<RewardSetting> RewardSettings { get; set; }
        public DbSet<OrderRewardSlab> OrderRewardSlabs { get; set; }
        public DbSet<RewardTransaction> RewardTransactions { get; set; }
        public DbSet<WishlistCustomer> WishlistCustomers { get; set; }
        public DbSet<GiftBox> GiftBoxes { get; set; }
        public DbSet<OrderGift> OrderGifts { get; set; }
        public DbSet<PasswordResetOtp> PasswordResetOtps { get; set; }
        public DbSet<LovMaster> LovMasters { get; set; }
        public DbSet<LovCategory> LovCategories { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<ProductStockHistory> ProductStockHistories { get; set; }
        public DbSet<StockReservation> StockReservations { get; set; }
        public DbSet<StockSetting> StockSettings { get; set; }
        public DbSet<ShippingSetting> ShippingSettings { get; set; }
        public DbSet<NewsletterSubscriber> NewsletterSubscribers { get; set; }
        public DbSet<ContactQuery> ContactQueries { get; set; }
        public DbSet<Faq> Faqs { get; set; }
        public DbSet<DeliveryPincode> DeliveryPincodes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Role>()
                .HasIndex(r => r.RoleCode)
                .IsUnique();

            modelBuilder.Entity<Menu>()
                .HasIndex(m => m.Name);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<CartItem>()
                .HasIndex(c => new { c.CustomerId, c.ProductId, c.VariantId, c.PackingType })
                .IsUnique();

            modelBuilder.Entity<WishlistCustomer>()
                .HasIndex(w => new { w.CustomerId, w.ProductId, w.VariantId, w.PackingType })
                .IsUnique();

            // One gift record per gifted order.
            modelBuilder.Entity<OrderGift>()
                .HasOne(g => g.Order)
                .WithOne(o => o.Gift)
                .HasForeignKey<OrderGift>(g => g.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderGift>()
                .HasIndex(g => g.OrderId)
                .IsUnique();

            // Starting box sizes - placeholders until the real boxes are confirmed; admin edits
            // them in Store Settings. Units: small mukhwas bottle / soap = 1, big bottle = 2.
            var giftBoxSeedDate = new DateTime(2026, 11, 13);
            modelBuilder.Entity<GiftBox>().HasData(
                new GiftBox { Id = 1, Name = "Small Box", Capacity = 2, DisplayOrder = 1, IsActive = true, CreatedDate = giftBoxSeedDate },
                new GiftBox { Id = 2, Name = "Medium Box", Capacity = 4, DisplayOrder = 2, IsActive = true, CreatedDate = giftBoxSeedDate },
                new GiftBox { Id = 3, Name = "Large Box", Capacity = 6, DisplayOrder = 3, IsActive = true, CreatedDate = giftBoxSeedDate });

            modelBuilder.Entity<Coupon>()
                .HasIndex(c => c.Code)
                .IsUnique();

            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.ReferralCode)
                .IsUnique()
                .HasFilter("[ReferralCode] IS NOT NULL");

            modelBuilder.Entity<LovMaster>()
                .HasIndex(l => new { l.LovColumn, l.LovCode })
                .IsUnique();

            modelBuilder.Entity<LovCategory>()
                .HasIndex(c => c.LovColumn)
                .IsUnique();

            modelBuilder.Entity<Order>()
                .HasIndex(o => o.OrderNumber)
                .IsUnique();

            modelBuilder.Entity<Order>()
                .Property(o => o.OrderStatus)
                .HasConversion<string>();

            modelBuilder.Entity<Order>()
                .Property(o => o.PaymentStatus)
                .HasConversion<string>();

            modelBuilder.Entity<OrderStatusHistory>()
                .Property(h => h.OldStatus)
                .HasConversion<string>();

            modelBuilder.Entity<OrderStatusHistory>()
                .Property(h => h.NewStatus)
                .HasConversion<string>();

            modelBuilder.Entity<Coupon>()
                .Property(c => c.DiscountType)
                .HasConversion<string>();

            modelBuilder.Entity<RewardTransaction>()
                .Property(r => r.Type)
                .HasConversion<string>();

            modelBuilder.Entity<ProductStockHistory>()
                .Property(h => h.ChangeType)
                .HasConversion<string>();

            // Product already cascades into ProductVariant; a second cascade path straight
            // into these history/reservation tables would create a multiple-cascade-paths
            // error in SQL Server, so the direct Product FK is Restrict instead.
            modelBuilder.Entity<ProductStockHistory>()
                .HasOne(h => h.Product)
                .WithMany()
                .HasForeignKey(h => h.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<StockReservation>()
                .HasOne(r => r.Product)
                .WithMany()
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Same multiple-cascade-paths issue: Product already cascades into both
            // ProductImage and ProductVariant, so the variant link must not cascade too.
            modelBuilder.Entity<ProductImage>()
                .HasOne(i => i.Variant)
                .WithMany(v => v.Images)
                .HasForeignKey(i => i.VariantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProductImage>()
                .HasIndex(i => new { i.ProductId, i.VariantId });

            modelBuilder.Entity<ProductStockHistory>()
                .HasIndex(h => new { h.ProductId, h.VariantId, h.ChangedDate });

            modelBuilder.Entity<ProductStockHistory>()
                .HasIndex(h => new { h.ReferenceType, h.ReferenceId });

            modelBuilder.Entity<StockReservation>()
                .Property(r => r.Status)
                .HasConversion<string>();

            modelBuilder.Entity<StockReservation>()
                .HasIndex(r => new { r.CustomerId, r.ProductId, r.VariantId, r.Status });

            modelBuilder.Entity<StockReservation>()
                .HasIndex(r => new { r.Status, r.ExpiresAt });

            modelBuilder.Entity<StockReservation>()
                .HasIndex(r => r.OrderId);

            // Explicit decimal precision on new money/percentage columns
            foreach (var (entity, property) in new (Type, string)[]
            {
                (typeof(Coupon), nameof(Coupon.DiscountValue)),
                (typeof(Coupon), nameof(Coupon.MaxDiscountAmount)),
                (typeof(Coupon), nameof(Coupon.MinOrderAmount)),
                (typeof(CouponUsage), nameof(CouponUsage.DiscountAmount)),
                (typeof(Order), nameof(Order.Subtotal)),
                (typeof(Order), nameof(Order.DiscountAmount)),
                (typeof(Order), nameof(Order.CoinDiscountAmount)),
                (typeof(Order), nameof(Order.DeliveryFee)),
                (typeof(Order), nameof(Order.TotalAmount)),
                (typeof(OrderItem), nameof(OrderItem.UnitPrice)),
                (typeof(OrderItem), nameof(OrderItem.TotalPrice)),
                (typeof(RewardSetting), nameof(RewardSetting.CoinToRupeeRate)),
                (typeof(RewardSetting), nameof(RewardSetting.MaxCoinUsagePercent)),
                (typeof(OrderRewardSlab), nameof(OrderRewardSlab.MinOrderAmount)),
                (typeof(OrderRewardSlab), nameof(OrderRewardSlab.MaxOrderAmount)),
            })
            {
                modelBuilder.Entity(entity).Property(property).HasColumnType("decimal(18,2)");
            }
        }
    }
}
