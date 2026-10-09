using System.Text;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using HIyaghar.Infra;
using Hiya2.Server.Repositories.Customer;
using Hiya2.Server.Repositories.Category;
using Hiya2.Server.Repositories.Product;
using Hiya2.Server.Repositories.HomePageComponent;
using Hiya2.Server.Repositories.Cart;
using Hiya2.Server.Repositories.Wishlist;
using Hiya2.Server.Repositories.GiftHamper;
using Hiya2.Server.Repositories.Review;
using Hiya2.Server.Repositories.Stock;
using Hiya2.Server.Services;
using Hiya2.Server.Authorization;

using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "image/svg+xml",
        "text/html",
        "text/css",
        "application/javascript",
        "application/x-javascript",
        "font/woff2",
        "font/woff"
    });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.AddOutputCache(options =>
{
    options.AddPolicy("CatalogCache", p => p.Expire(TimeSpan.FromMinutes(5)).Tag("catalog"));
    options.AddPolicy("HomeCache", p => p.Expire(TimeSpan.FromMinutes(5)).Tag("home"));
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<DataContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? "HIYAGHAR_SUPER_SECRET_SECURITY_KEY_2026_PRODUCTION_GRADE_SECRET_KEY!";

builder.Services.AddSingleton<IUserSessionTracker, UserSessionTracker>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "HIYAGHAR.Server",
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"] ?? "HIYAGHAR.Client",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    // No OnTokenValidated session enforcement — multiple devices/browsers can be logged in simultaneously
});

builder.Services.AddSingleton<IAuthorizationPolicyProvider, DynamicPermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ICustomerAuthService, CustomerAuthService>();

builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IHomePageComponentRepository, HomePageComponentRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddHostedService<Hiya2.Server.Services.ReservationExpiryService>();
builder.Services.AddScoped<IGiftHamperRepository, GiftHamperRepository>();

// Server-side SEO: per-route head tags, JSON-LD and <noscript> content injected into index.html
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<Hiya2.Server.Seo.SeoContentStore>();
builder.Services.AddScoped<Hiya2.Server.Seo.SeoPageRenderer>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<IRewardService, RewardService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IEmailService, EmailService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<DataContext>();
        context.Database.Migrate();

        context.Database.ExecuteSqlRaw(@"
            IF OBJECT_ID('dbo.[Order]', 'U') IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'CourierName')
                    ALTER TABLE dbo.[Order] ADD [CourierName] NVARCHAR(255) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'TrackingNumber')
                    ALTER TABLE dbo.[Order] ADD [TrackingNumber] NVARCHAR(255) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'TrackingUrl')
                    ALTER TABLE dbo.[Order] ADD [TrackingUrl] NVARCHAR(1000) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'RazorpayOrderId')
                    ALTER TABLE dbo.[Order] ADD [RazorpayOrderId] NVARCHAR(100) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'RazorpayPaymentId')
                    ALTER TABLE dbo.[Order] ADD [RazorpayPaymentId] NVARCHAR(100) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'RazorpaySignature')
                    ALTER TABLE dbo.[Order] ADD [RazorpaySignature] NVARCHAR(255) NULL;
            END

            IF OBJECT_ID('dbo.[NewsletterSubscriber]', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.[NewsletterSubscriber] (
                    [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [Email] NVARCHAR(255) NOT NULL,
                    [IsActive] BIT NOT NULL DEFAULT 1,
                    [SubscribedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
                    [Source] NVARCHAR(50) NOT NULL DEFAULT 'HOMEPAGE_RETENTION',
                    [IpAddress] NVARCHAR(50) NULL
                );
                CREATE INDEX [IX_NewsletterSubscriber_Email] ON dbo.[NewsletterSubscriber] ([Email]);
            END

            IF OBJECT_ID('dbo.[ContactQuery]', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.[ContactQuery] (
                    [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [FullName] NVARCHAR(150) NOT NULL,
                    [Email] NVARCHAR(255) NOT NULL,
                    [Phone] NVARCHAR(50) NULL,
                    [Subject] NVARCHAR(100) NOT NULL DEFAULT 'General Inquiry',
                    [Message] NVARCHAR(MAX) NOT NULL,
                    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
                    [AdminNotes] NVARCHAR(MAX) NULL,
                    [IsActive] BIT NOT NULL DEFAULT 1,
                    [IsDeleted] BIT NOT NULL DEFAULT 0,
                    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
                    [ResolvedBy] BIGINT NULL,
                    [ResolvedDate] DATETIME2 NULL
                );
                CREATE INDEX [IX_ContactQuery_CreatedDate] ON dbo.[ContactQuery] ([CreatedDate] DESC);
                CREATE INDEX [IX_ContactQuery_Status] ON dbo.[ContactQuery] ([Status]);
            END

            IF OBJECT_ID('dbo.[ShippingSetting]', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.[ShippingSetting] (
                    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [FreeShippingThreshold] DECIMAL(18,2) NOT NULL DEFAULT 500,
                    [StandardShippingPrice] DECIMAL(18,2) NOT NULL DEFAULT 49,
                    [ExpressShippingPrice] DECIMAL(18,2) NOT NULL DEFAULT 99,
                    [EnableExpressDelivery] BIT NOT NULL DEFAULT 1,
                    [EnableFreeShipping] BIT NOT NULL DEFAULT 1,
                    [OnlyAhmedabadDelivery] BIT NOT NULL DEFAULT 1,
                    [StandardDeliveryDays] NVARCHAR(100) NOT NULL DEFAULT N'3–5 business days',
                    [ExpressDeliveryDays] NVARCHAR(100) NOT NULL DEFAULT N'1–2 business days',
                    [EnableGstDisplay] BIT NOT NULL DEFAULT 1,
                    [GstPercent] DECIMAL(5,2) NOT NULL DEFAULT 5,
                    [GstLabel] NVARCHAR(100) NOT NULL DEFAULT N'Estimated GST (5% Included)',
                    [FssaiLicenseNumber] NVARCHAR(50) NOT NULL DEFAULT N'10723026001148',
                    [EnableFssaiDisplay] BIT NOT NULL DEFAULT 1,
                    [ContactEmail] NVARCHAR(150) NOT NULL DEFAULT N'support@hiyaghar.com',
                    [ContactPhone] NVARCHAR(50) NOT NULL DEFAULT N'+91 92744 43617',
                    [ContactAddress] NVARCHAR(200) NOT NULL DEFAULT N'Ahmedabad, Gujarat, India',
                    [IsActive] BIT NOT NULL DEFAULT 1,
                    [LastModifiedBy] BIGINT NULL,
                    [LastModifiedDate] DATETIME2 NULL
                );
                -- Insert default row so GET always returns data
                INSERT INTO dbo.[ShippingSetting]
                    ([FreeShippingThreshold],[StandardShippingPrice],[ExpressShippingPrice],
                     [EnableExpressDelivery],[EnableFreeShipping],[OnlyAhmedabadDelivery],
                     [StandardDeliveryDays],[ExpressDeliveryDays],
                     [EnableGstDisplay],[GstPercent],[GstLabel],[FssaiLicenseNumber],[EnableFssaiDisplay],[ContactEmail],[ContactPhone],[ContactAddress],[IsActive])
                VALUES (500, 49, 99, 1, 1, 1,
                        N'3–5 business days', N'1–2 business days',
                        1, 5, N'Estimated GST (5% Included)', N'10723026001148', 1, N'support@hiyaghar.com', N'+91 92744 43617', N'Ahmedabad, Gujarat, India', 1);
            END

            IF OBJECT_ID('dbo.[ShippingSetting]', 'U') IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[ShippingSetting]') AND name = 'FssaiLicenseNumber')
                    EXEC(N'ALTER TABLE dbo.[ShippingSetting] ADD [FssaiLicenseNumber] NVARCHAR(50) NOT NULL DEFAULT N''10723026001148''');

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[ShippingSetting]') AND name = 'EnableFssaiDisplay')
                    EXEC(N'ALTER TABLE dbo.[ShippingSetting] ADD [EnableFssaiDisplay] BIT NOT NULL DEFAULT 1');

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[ShippingSetting]') AND name = 'ContactEmail')
                    EXEC(N'ALTER TABLE dbo.[ShippingSetting] ADD [ContactEmail] NVARCHAR(150) NOT NULL DEFAULT N''support@hiyaghar.com''');

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[ShippingSetting]') AND name = 'ContactPhone')
                    EXEC(N'ALTER TABLE dbo.[ShippingSetting] ADD [ContactPhone] NVARCHAR(50) NOT NULL DEFAULT N''+91 92744 43617''');

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[ShippingSetting]') AND name = 'ContactAddress')
                    EXEC(N'ALTER TABLE dbo.[ShippingSetting] ADD [ContactAddress] NVARCHAR(200) NOT NULL DEFAULT N''Ahmedabad, Gujarat, India''');
            END

            IF OBJECT_ID('dbo.[Coupon]', 'U') IS NOT NULL
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM sys.columns c
                    JOIN sys.types t ON c.user_type_id = t.user_type_id
                    WHERE c.object_id = OBJECT_ID('dbo.[Coupon]')
                      AND c.name = 'DiscountType'
                      AND t.name = 'int'
                )
                BEGIN
                    ALTER TABLE dbo.[Coupon] ALTER COLUMN [DiscountType] NVARCHAR(50) NOT NULL;
                END
            END

            -- Ensure required LOV columns exist for system masters
            IF OBJECT_ID('dbo.[LovCategory]', 'U') IS NOT NULL AND OBJECT_ID('dbo.[LovMaster]', 'U') IS NOT NULL
            BEGIN
                -- 1. OrderStatus
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'OrderStatus')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('OrderStatus', 'Order Status', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'OrderStatus')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('OrderStatus', 'Placed', 'Order Placed', 1, 1, 0, GETDATE()),
                    ('OrderStatus', 'Confirmed', 'Order Confirmed', 2, 1, 0, GETDATE()),
                    ('OrderStatus', 'Processing', 'Processing / Packed', 3, 1, 0, GETDATE()),
                    ('OrderStatus', 'Shipped', 'Shipped', 4, 1, 0, GETDATE()),
                    ('OrderStatus', 'Delivered', 'Delivered', 5, 1, 0, GETDATE()),
                    ('OrderStatus', 'Cancelled', 'Cancelled', 6, 1, 0, GETDATE());
                END

                -- 2. PaymentStatus
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'PaymentStatus')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('PaymentStatus', 'Payment Status', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'PaymentStatus')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('PaymentStatus', 'Pending', 'Payment Pending', 1, 1, 0, GETDATE()),
                    ('PaymentStatus', 'Paid', 'Paid / Captured', 2, 1, 0, GETDATE()),
                    ('PaymentStatus', 'Failed', 'Payment Failed', 3, 1, 0, GETDATE()),
                    ('PaymentStatus', 'Refunded', 'Refunded', 4, 1, 0, GETDATE());
                END

                -- 3. PaymentMode
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'PaymentMode')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('PaymentMode', 'Payment Modes', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'PaymentMode')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('PaymentMode', 'online', 'Online Payment (Razorpay / UPI / Card)', 1, 1, 0, GETDATE()),
                    ('PaymentMode', 'cod', 'Cash on Delivery (COD)', 2, 1, 0, GETDATE());
                END

                -- 4. Gender
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'Gender')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('Gender', 'Gender Options', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'Gender')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('Gender', 'Male', 'Male', 1, 1, 0, GETDATE()),
                    ('Gender', 'Female', 'Female', 2, 1, 0, GETDATE()),
                    ('Gender', 'Other', 'Other', 3, 1, 0, GETDATE());
                END

                -- 5. AddressType
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'AddressType')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('AddressType', 'Address Type', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'AddressType')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('AddressType', 'Home', 'Home', 1, 1, 0, GETDATE()),
                    ('AddressType', 'Work', 'Work / Office', 2, 1, 0, GETDATE()),
                    ('AddressType', 'Other', 'Other', 3, 1, 0, GETDATE());
                END

                -- 6. CourierPartner
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'CourierPartner')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('CourierPartner', 'Courier Delivery Partners', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'CourierPartner')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('CourierPartner', 'DTDC', 'DTDC Express', 1, 1, 0, GETDATE()),
                    ('CourierPartner', 'DELHIVERY', 'Delhivery', 2, 1, 0, GETDATE()),
                    ('CourierPartner', 'BLUEDART', 'Blue Dart', 3, 1, 0, GETDATE()),
                    ('CourierPartner', 'EKART', 'Ekart Logistics', 4, 1, 0, GETDATE()),
                    ('CourierPartner', 'SPEEDPOST', 'India Post (Speed Post)', 5, 1, 0, GETDATE()),
                    ('CourierPartner', 'SHADOWFAX', 'Shadowfax', 6, 1, 0, GETDATE()),
                    ('CourierPartner', 'XPRESSBEES', 'Xpressbees', 7, 1, 0, GETDATE()),
                    ('CourierPartner', 'LOCAL', 'Self Pickup / Local Delivery', 8, 1, 0, GETDATE());
                END

                -- 7. ProductSort
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'ProductSort')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('ProductSort', 'Product Sorting Options', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'ProductSort')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('ProductSort', 'featured', 'Featured / Recommended', 1, 1, 0, GETDATE()),
                    ('ProductSort', 'price-low', 'Price: Low to High', 2, 1, 0, GETDATE()),
                    ('ProductSort', 'price-high', 'Price: High to Low', 3, 1, 0, GETDATE()),
                    ('ProductSort', 'rating', 'Customer Rating', 4, 1, 0, GETDATE()),
                    ('ProductSort', 'newest', 'Newest Arrivals', 5, 1, 0, GETDATE());
                END
            END

            -- Ensure Contact Inquiries Menu exists in DB
            IF OBJECT_ID('dbo.[Menus]', 'U') IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM dbo.[Menus] WHERE [Name] = 'Contact Inquiries' OR [Controller] = 'CONTACT_QUERY' OR [Controller] = 'ContactQuery')
                BEGIN
                    INSERT INTO dbo.[Menus] ([Name], [Controller], [Icon], [DisplayOrder], [IsActive], [IsDeleted], [SuperAdmin], [CreatedDate])
                    VALUES ('Contact Inquiries', 'CONTACT_QUERY', 'fa-solid fa-envelope-open-text', 14, 1, 0, 0, GETDATE());
                END

                -- Grant Super Admin permission to Contact Inquiries
                DECLARE @ContactMenuId INT = (SELECT TOP 1 [MenuId] FROM dbo.[Menus] WHERE [Name] = 'Contact Inquiries' OR [Controller] = 'CONTACT_QUERY');
                DECLARE @SuperAdminRoleId INT = (SELECT TOP 1 [RoleId] FROM dbo.[Role] WHERE [RoleCode] = 'SUPER_ADMIN' OR [RoleName] = 'Super Admin');

                IF @ContactMenuId IS NOT NULL AND @SuperAdminRoleId IS NOT NULL
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM dbo.[RoleMenuPermission] WHERE [RoleId] = @SuperAdminRoleId AND [MenuId] = @ContactMenuId)
                    BEGIN
                        INSERT INTO dbo.[RoleMenuPermission] ([RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedDate])
                        VALUES (@SuperAdminRoleId, @ContactMenuId, 1, 1, 1, 1, 1, GETDATE());
                    END
                    ELSE
                    BEGIN
                        UPDATE dbo.[RoleMenuPermission]
                        SET [CanView] = 1, [CanAdd] = 1, [CanEdit] = 1, [CanDelete] = 1, [CanExport] = 1
                        WHERE [RoleId] = @SuperAdminRoleId AND [MenuId] = @ContactMenuId;
                    END
                END
            END

            -- Ensure Faq Table Exists and Seed Defaults
            IF OBJECT_ID('dbo.[Faq]', 'U') IS NULL
            BEGIN
                    CREATE TABLE dbo.[Faq] (
                        [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
                        [Category] NVARCHAR(100) NOT NULL DEFAULT 'general',
                        [Question] NVARCHAR(500) NOT NULL,
                        [Answer] NVARCHAR(MAX) NOT NULL,
                        [DisplayOrder] INT NOT NULL DEFAULT 0,
                        [IsActive] BIT NOT NULL DEFAULT 1,
                        [IsDeleted] BIT NOT NULL DEFAULT 0,
                        [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
                        [UpdatedDate] DATETIME2 NULL
                    );

                    INSERT INTO dbo.[Faq] ([Category], [Question], [Answer], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES
                    ('general', 'What is HIYAGHAR all about?', 'HIYAGHAR is a premium Indian heritage & wellness lifestyle brand founded with the philosophy ''From Our Ghar, With Heart.'' We craft 100% natural, artisanal mukhwas, traditional tea masalas, cold-processed herbal soaps, Ayurvedic hair oils, and curated festive hampers in small batches using time-tested recipes.', 1, 1, 0, GETDATE()),
                    ('general', 'Are HIYAGHAR products 100% natural and preservative-free?', 'Yes, absolutely. All our mukhwas and spice blends contain zero artificial colors, synthetic flavors, or chemical preservatives. Our skincare and hair wellness range is crafted using pure botanical extracts, cold-pressed oils, and natural herbs.', 2, 1, 0, GETDATE()),
                    ('products', 'How should I store HIYAGHAR Mukhwas and Tea Masala?', 'Store your mukhwas and tea masala in a cool, dry place away from direct sunlight. Always keep the container tightly sealed to preserve the rich aroma, crunch, and authentic essential oils.', 3, 1, 0, GETDATE()),
                    ('products', 'What is the shelf life of your digestive mukhwas and soaps?', 'Our artisanal mukhwas typically have a shelf life of 6 to 9 months from the date of manufacture. Our cold-processed soaps and herbal hair oils have a shelf life of 12 to 24 months.', 4, 1, 0, GETDATE()),
                    ('products', 'Are your handmade soaps suitable for sensitive skin?', 'Yes! Our soaps are made through traditional cold-process saponification without SLS, parabens, or harsh sulfates. They retain natural glycerin that deeply moisturizes even sensitive skin types.', 5, 1, 0, GETDATE()),
                    ('orders', 'How long will it take to receive my order?', 'Orders are usually packed and dispatched within 24–48 hours. Delivery across major metro cities takes 2–4 business days, and 4–7 business days for other locations across India.', 6, 1, 0, GETDATE()),
                    ('orders', 'How can I track my shipment?', 'Once your package is shipped, you will receive an SMS and email notification with your tracking details. You can also visit our dedicated ''Track Order'' page and enter your Order ID anytime.', 7, 1, 0, GETDATE()),
                    ('orders', 'What payment methods do you accept?', 'We accept all major UPI apps (Google Pay, PhonePe, Paytm), Credit & Debit Cards, Net Banking, and Cash on Delivery (COD) across eligible pin codes.', 8, 1, 0, GETDATE()),
                    ('gifting', 'Can I customize a combo or gift hamper for weddings/festivals?', 'Yes! You can use our interactive ''Customize Combo'' builder online, or contact us directly via WhatsApp / Contact Us page for bulk wedding favors, corporate gifting, and bespoke luxury gift hampers.', 9, 1, 0, GETDATE()),
                    ('gifting', 'Do you provide personalized gift notes inside the box?', 'Yes, you can add a personalized gift message during checkout, and our team will hand-inscribe your thoughtful greeting card inside the premium gift hamper.', 10, 1, 0, GETDATE());
                END

                -- Ensure FAQ Menu exists in DB
                IF OBJECT_ID('dbo.[Menus]', 'U') IS NOT NULL
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM dbo.[Menus] WHERE [Name] = 'FAQ Management' OR [Controller] = 'FAQ' OR [Controller] = 'Faq')
                    BEGIN
                        INSERT INTO dbo.[Menus] ([Name], [Controller], [Icon], [DisplayOrder], [IsActive], [IsDeleted], [SuperAdmin], [CreatedDate])
                        VALUES ('FAQ Management', 'FAQ', 'fa-solid fa-circle-question', 15, 1, 0, 0, GETDATE());
                    END

                    DECLARE @FaqMenuId INT = (SELECT TOP 1 [MenuId] FROM dbo.[Menus] WHERE [Name] = 'FAQ Management' OR [Controller] = 'FAQ');
                    DECLARE @SuperAdminRoleIdForFaq INT = (SELECT TOP 1 [RoleId] FROM dbo.[Role] WHERE [RoleCode] = 'SUPER_ADMIN' OR [RoleName] = 'Super Admin');

                    IF @FaqMenuId IS NOT NULL AND @SuperAdminRoleIdForFaq IS NOT NULL
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM dbo.[RoleMenuPermission] WHERE [RoleId] = @SuperAdminRoleIdForFaq AND [MenuId] = @FaqMenuId)
                        BEGIN
                            INSERT INTO dbo.[RoleMenuPermission] ([RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedDate])
                            VALUES (@SuperAdminRoleIdForFaq, @FaqMenuId, 1, 1, 1, 1, 1, GETDATE());
                        END
                        ELSE
                        BEGIN
                            UPDATE dbo.[RoleMenuPermission]
                            SET [CanView] = 1, [CanAdd] = 1, [CanEdit] = 1, [CanDelete] = 1, [CanExport] = 1
                            WHERE [RoleId] = @SuperAdminRoleIdForFaq AND [MenuId] = @FaqMenuId;
                        END
                    END
                END
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization note: {ex.Message}");
    }
}

app.UseResponseCompression();

// SEO redirects: old alias URLs and trailing slashes get a single 301 to the canonical path
// (canonical URLs have no trailing slash). Runs before static files and the SPA fallback.
var routeAliases = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
{
    ["/combo"] = "/combos",
    ["/customize-combo"] = "/combos",
    ["/ourstory"] = "/our-story",
    ["/about"] = "/our-story",
    ["/about-us"] = "/our-story",
    ["/gifting"] = "/gift-hampers",
    ["/home-made-soap"] = "/handmade-soap",
    ["/hand-made-soap"] = "/handmade-soap",
    ["/soap"] = "/handmade-soap",
    ["/hair-oils"] = "/hair-oil",
    ["/hairoil"] = "/hair-oil",
    ["/privacy"] = "/privacy-policy",
    ["/terms"] = "/terms-conditions",
    ["/terms-and-conditions"] = "/terms-conditions",
    ["/refund"] = "/refund-policy",
    ["/cancellation"] = "/refund-policy",
    ["/shipping"] = "/shipping-policy",
    ["/contact"] = "/contact-us",
    ["/faqs"] = "/faq",
};

app.Use(async (context, next) =>
{
    var request = context.Request;
    var path = request.Path.Value ?? "/";
    var isApiOrSwagger = path.StartsWith("/api", StringComparison.OrdinalIgnoreCase)
        || path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase);

    if ((HttpMethods.IsGet(request.Method) || HttpMethods.IsHead(request.Method)) && !isApiOrSwagger)
    {
        var trimmed = path.Length > 1 ? path.TrimEnd('/') : path;
        if (trimmed.Length == 0) trimmed = "/";

        string? target = routeAliases.TryGetValue(trimmed, out var alias) ? alias
            : trimmed != path ? trimmed
            : null;

        if (target != null)
        {
            context.Response.StatusCode = StatusCodes.Status301MovedPermanently;
            context.Response.Headers.Location = target + request.QueryString;
            return;
        }
    }

    await next();
});

// No UseDefaultFiles(): "/" must go through the SEO fallback below instead of the raw index.html.
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var reqPath = ctx.Context.Request.Path;
        var fileName = ctx.File.Name.ToLower();
        if (reqPath.StartsWithSegments("/assets"))
        {
            // Hashed asset names — safe to cache for 1 year
            ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=31536000,immutable");
        }
        else if (reqPath.StartsWithSegments("/image") || reqPath.StartsWithSegments("/uploads"))
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000"); // 30 days
        }
        else if (fileName.EndsWith(".html"))
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "no-cache,no-store,must-revalidate");
        }
        else if (fileName.EndsWith(".woff2") || fileName.EndsWith(".woff") || fileName.EndsWith(".ttf"))
        {
            // Fonts at non-hashed paths (e.g. /fonts/) get 7-day cache
            ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=604800");
        }
    }
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Security Headers Middleware
app.Use(async (context, next) =>
{
    context.Response.Headers.Remove("X-Powered-By");
    context.Response.Headers.Remove("Server");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "SAMEORIGIN");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (context.Request.IsHttps)
    {
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    await next();
});

app.UseOutputCache();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SPA fallback with real status codes and server-side SEO (Seo/SeoPageRenderer.cs): routes listed in
// wwwroot/seo/routes.json (the same file the React app uses) and active products get 200, anything
// else gets 404 with the SPA shell so the React 404 view still renders. Paths that look like files
// keep the default 404 (":nonfile").
app.MapFallback(async context =>
{
    var path = context.Request.Path.Value ?? "/";

    // Unknown API paths: plain 404, not the SPA shell.
    if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    var renderer = context.RequestServices.GetRequiredService<Hiya2.Server.Seo.SeoPageRenderer>();
    var result = await renderer.RenderAsync(path);

    context.Response.StatusCode = result.StatusCode;
    context.Response.ContentType = "text/html; charset=utf-8";
    context.Response.Headers.CacheControl = "no-cache";
    if (result.Html != null && !HttpMethods.IsHead(context.Request.Method))
    {
        await context.Response.WriteAsync(result.Html);
    }
});

app.Run();


