/* =====================================================================
   HiyaGhar - Database cleanup (2026-11-06)
   ---------------------------------------------------------------------
   1. Orders      : delete ALL orders + items + status history + coupon usage + reward txns
   2. Customers   : delete ALL customers (+ cart, wishlist, address, reservations, OTPs, reviews)
   3. Products    : delete every product that is not active (IsActive=0 or IsDeleted=1)
   4. Variants    : delete every variant that is not active
   5. Images      : delete soft-deleted image rows + images of deleted products/variants
   6. Stock       : delete ALL stock history, ReservedStock = 0,
                    insert one "StockIn" row per variant dated TODAY (qty = current AvailableStock)
   7. Users       : delete ALL admin users, create single admin  (Email: admin@hiyaghar.com / Password: admin)
   8. Reviews     : create 3 reviewer customers (CustomerId 1,2,3) + static reviews,
                    recalculate Product.Rating / ReviewCount
   Identity counters are reset so new data starts from 1.

   SAFETY: @Commit = 0 -> dry run (everything is rolled back, only counts are printed)
           @Commit = 1 -> changes are saved
   ===================================================================== */
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Commit BIT = 0;   -- <<< change to 1 to really apply

BEGIN TRAN;

PRINT '--- BEFORE ---';
SELECT 'Product' t, COUNT(*) c FROM Product UNION ALL SELECT 'ProductVariant', COUNT(*) FROM ProductVariant
UNION ALL SELECT 'ProductImage', COUNT(*) FROM ProductImage UNION ALL SELECT 'Customer', COUNT(*) FROM Customer
UNION ALL SELECT 'Order', COUNT(*) FROM [Order] UNION ALL SELECT 'Review', COUNT(*) FROM Review
UNION ALL SELECT 'StockHistory', COUNT(*) FROM ProductStockHistory UNION ALL SELECT 'User', COUNT(*) FROM [User];

/* ---------- 1. Orders ---------- */
DELETE FROM CouponUsage;
DELETE FROM RewardTransaction;
DELETE FROM OrderStatusHistory;
DELETE FROM OrderItem;
DELETE FROM [Order];

/* ---------- 2. Customers ---------- */
DELETE FROM StockReservation;
DELETE FROM CartItem;
DELETE FROM WishlistCustomer;
DELETE FROM Review;
DELETE FROM PasswordResetOtp;
DELETE FROM CustomerAddress;
DELETE FROM Customer;

/* ---------- 6a. Stock history (all) ---------- */
DELETE FROM ProductStockHistory;

/* ---------- 3/4/5. Inactive products, variants, images ---------- */
DECLARE @DeadProducts TABLE (Id INT PRIMARY KEY);
INSERT INTO @DeadProducts SELECT Id FROM Product WHERE NOT (IsActive = 1 AND IsDeleted = 0);

DECLARE @DeadVariants TABLE (Id INT PRIMARY KEY);
INSERT INTO @DeadVariants
SELECT v.Id FROM ProductVariant v
WHERE NOT (v.IsActive = 1 AND v.IsDeleted = 0)
   OR v.ProductId IN (SELECT Id FROM @DeadProducts);

DELETE FROM ProductImage
WHERE IsDeleted = 1
   OR ProductId IN (SELECT Id FROM @DeadProducts)
   OR VariantId IN (SELECT Id FROM @DeadVariants);

DELETE FROM GiftHamperOccasionProduct WHERE ProductId IN (SELECT Id FROM @DeadProducts);
DELETE FROM ProductVariantMapping     WHERE ProductId IN (SELECT Id FROM @DeadProducts);
DELETE FROM ProductVariant            WHERE Id        IN (SELECT Id FROM @DeadVariants);
DELETE FROM Product                   WHERE Id        IN (SELECT Id FROM @DeadProducts);

-- Home page "Product" strip pointed at products 1 and 5 (inactive) -> keep only live ids
UPDATE HomePageComponentItem SET RefId = '8,11,7,6' WHERE RefType = 'Product' AND RefId = '8,11,7,1,5,6';

/* ---------- 6b. Fresh stock entry dated today ---------- */
UPDATE ProductVariant SET ReservedStock = 0, IsInStock = CASE WHEN AvailableStock > 0 THEN 1 ELSE 0 END;

DBCC CHECKIDENT ('ProductStockHistory', RESEED, 0) WITH NO_INFOMSGS;
INSERT INTO ProductStockHistory (ProductId, VariantId, ChangeType, QuantityChanged, PreviousStock, NewStock,
                                 ReferenceId, ReferenceType, Remarks, ChangedBy, ChangedDate)
SELECT v.ProductId, v.Id, 'StockIn', v.AvailableStock, 0, v.AvailableStock,
       NULL, 'Manual', 'Opening stock', 1, GETDATE()
FROM ProductVariant v
ORDER BY v.ProductId, v.Id;

/* ---------- 7. Users: single admin ---------- */
DELETE FROM UserRole;
DELETE FROM [User];
DBCC CHECKIDENT ('[User]', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('UserRole', RESEED, 0) WITH NO_INFOMSGS;

-- Plain "admin" is accepted by PasswordHasherService (legacy fallback) and is
-- automatically re-hashed on the first successful login.
INSERT INTO [User] (FirstName, LastName, Email, MobileNo, PasswordHash, Username, IsActive, IsDeleted, CreatedDate)
VALUES ('Admin', 'HiyaGhar', 'admin@hiyaghar.com', '9510212154', 'admin', 'admin', 1, 0, GETDATE());

INSERT INTO UserRole (UserId, RoleId, AssignedDate)
SELECT u.UserId, r.RoleId, GETDATE() FROM [User] u CROSS JOIN Role r
WHERE u.Email = 'admin@hiyaghar.com' AND r.RoleCode = 'SUPER_ADMIN';

/* ---------- 1/2b. Reset identity counters ---------- */
DBCC CHECKIDENT ('[Order]', RESEED, 0)          WITH NO_INFOMSGS;
DBCC CHECKIDENT ('OrderItem', RESEED, 0)        WITH NO_INFOMSGS;
DBCC CHECKIDENT ('OrderStatusHistory', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('CouponUsage', RESEED, 0)      WITH NO_INFOMSGS;
DBCC CHECKIDENT ('RewardTransaction', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('StockReservation', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('CartItem', RESEED, 0)         WITH NO_INFOMSGS;
DBCC CHECKIDENT ('WishlistCustomer', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('PasswordResetOtp', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('CustomerAddress', RESEED, 0)  WITH NO_INFOMSGS;
DBCC CHECKIDENT ('Customer', RESEED, 0)         WITH NO_INFOMSGS;
DBCC CHECKIDENT ('Review', RESEED, 0)           WITH NO_INFOMSGS;

/* ---------- 8. Reviewer customers 1,2,3 (reviews only) ---------- */
INSERT INTO Customer (FirstName, LastName, Email, MobileNo, PasswordHash, IsGuest, IsActive, IsDeleted, RewardCoins, CreatedDate)
VALUES ('Priya', 'Shah',  'priya.shah@hiyaghar-review.in',  '9000000001', CONVERT(VARCHAR(36), NEWID()), 0, 1, 0, 0, GETDATE()),
       ('Rahul', 'Patel', 'rahul.patel@hiyaghar-review.in', '9000000002', CONVERT(VARCHAR(36), NEWID()), 0, 1, 0, 0, GETDATE()),
       ('Neha',  'Joshi', 'neha.joshi@hiyaghar-review.in',  '9000000003', CONVERT(VARCHAR(36), NEWID()), 0, 1, 0, 0, GETDATE());
-- Random GUID as password = these accounts cannot be logged into.

DECLARE @R TABLE (CustomerId BIGINT, ProductId INT, Rating INT, Txt NVARCHAR(500), DaysAgo INT);
INSERT INTO @R VALUES
 (1,    2, 5, N'Glow Craft Detan soap really works. My skin feels clean and the tan from summer has reduced a lot.', 20),
 (2,    2, 4, N'Nice natural fragrance and lathers well. Good value for a handmade soap.', 12),
 (3,    4, 5, N'Neem Aloe Fresh is very gentle on skin. Perfect for daily use in this weather.', 18),
 (1,    4, 4, N'Feels refreshing after a bath and does not dry out the skin.', 7),
 (2,    6, 5, N'Keshvedaam oil has reduced my hair fall within a month. Light and not too sticky.', 25),
 (3,    6, 5, N'Lovely herbal smell. My mother uses it for head massage every week.', 9),
 (1,    7, 5, N'Best tea masala I have tried! Adds perfect aroma to morning chai.', 22),
 (3,    7, 5, N'Just a pinch makes the tea so flavourful. Already ordered again.', 4),
 (2,    8, 5, N'Choco Masti is a hit with kids. Sweet, chocolatey mukhwas after dinner.', 15),
 (1,    9, 4, N'Jamnagari Zaika has a nice tangy taste. Reminds me of Jamnagar.', 11),
 (3,   10, 5, N'Digestive Mix really helps after heavy meals. Fresh and well packed.', 16),
 (2,   11, 5, N'Dil Bahaar is very refreshing. Guests always ask where we got it.', 8),
 (1,   12, 4, N'Dil Ranjan has a lovely mild sweetness. Good quality ingredients.', 19),
 (3,   13, 5, N'Drakshawati is soft and tasty. Kids and elders both love it.', 6),
 (2,   14, 5, N'Shahi Kharek is premium quality. Perfect for festive gifting.', 21),
 (1,   19, 5, N'Paan Pop tastes exactly like fresh paan. Excellent!', 10),
 (3,   20, 4, N'Kalkatti Pan flavour is authentic. Packaging is also good.', 14),
 (2,   21, 5, N'Jamun Pop is unique and delicious. Sweet and tangy at the same time.', 5),
 (1,   22, 5, N'Hing Hajma is great for digestion. Strong hing flavour, just how I like it.', 17),
 (3,   23, 4, N'Ambodia Tadka is chatpata and fresh. Good for after-meal cravings.', 13),
 (2,   24, 5, N'Til Alsi Mix is healthy and tasty. I eat a spoon daily after lunch.', 23),
 (1,   25, 5, N'Amla Madhur is sweet and good for health. My family loves it.', 3),
 (3,   26, 4, N'Mango Slice tastes like real aam papad. Very yummy.', 9),
 (2,   27, 5, N'Shahi Paan is rich and royal in taste. Must try.', 12),
 (1,   28, 5, N'Til Crunch is crunchy and not too sweet. Perfect snack.', 8),
 (3,   29, 4, N'Namkeen Gotli is salty and crunchy. Nice traditional taste.', 15),
 (2,   30, 5, N'Anar Punch is fruity and refreshing. Kids keep asking for more.', 6),
 (1,   31, 5, N'Imli Pop is tangy and sweet. Childhood memories!', 11),
 (3,   32, 5, N'Imli Laddu is just perfect. Good balance of khatta and meetha.', 2),
 (1, 1033, 5, N'Great combo pack. Both soaps are good and the price is very reasonable.', 14),
 (2, 1034, 4, N'Good value combo. Neem Aloe is my favourite.', 10),
 (3, 1035, 5, N'Stocked up with this 3-pack. Detan soap works wonderfully.', 7),
 (1, 1036, 5, N'Neem Aloe 3-pack lasts long for the whole family.', 5),
 (2, 1037, 5, N'Daily Refresh Combo is a smart pick - tea masala plus soaps, all great quality.', 4),
 (3, 1038, 5, N'Lovely combo for gifting. Tea masala smells amazing.', 3);

INSERT INTO Review (CustomerId, ProductId, Rating, ReviewText, IsActive, IsDeleted, CreatedBy, CreatedDate)
SELECT r.CustomerId, r.ProductId, r.Rating, r.Txt, 1, 0, r.CustomerId, DATEADD(DAY, -r.DaysAgo, GETDATE())
FROM @R r
WHERE EXISTS (SELECT 1 FROM Product p WHERE p.Id = r.ProductId)
ORDER BY DATEADD(DAY, -r.DaysAgo, GETDATE());

-- Recalculate rating / review count on every product
UPDATE p SET
    ReviewCount = ISNULL(x.Cnt, 0),
    Rating      = ISNULL(x.Avg1, 5.0)
FROM Product p
LEFT JOIN (SELECT ProductId, COUNT(*) Cnt, CAST(ROUND(AVG(CAST(Rating AS DECIMAL(5,2))), 1) AS DECIMAL(5,1)) Avg1
           FROM Review WHERE IsActive = 1 AND IsDeleted = 0 GROUP BY ProductId) x ON x.ProductId = p.Id;

PRINT '--- AFTER ---';
SELECT 'Product' t, COUNT(*) c FROM Product UNION ALL SELECT 'ProductVariant', COUNT(*) FROM ProductVariant
UNION ALL SELECT 'ProductImage', COUNT(*) FROM ProductImage UNION ALL SELECT 'Customer', COUNT(*) FROM Customer
UNION ALL SELECT 'Order', COUNT(*) FROM [Order] UNION ALL SELECT 'Review', COUNT(*) FROM Review
UNION ALL SELECT 'StockHistory', COUNT(*) FROM ProductStockHistory UNION ALL SELECT 'User', COUNT(*) FROM [User];
SELECT CustomerId, FirstName, LastName FROM Customer;
SELECT u.UserId, u.Email, r.RoleCode FROM [User] u JOIN UserRole ur ON ur.UserId = u.UserId JOIN Role r ON r.RoleId = ur.RoleId;

IF @Commit = 1 BEGIN COMMIT TRAN; PRINT '*** COMMITTED ***'; END
ELSE           BEGIN ROLLBACK TRAN; PRINT '*** DRY RUN - rolled back, nothing changed ***'; END
