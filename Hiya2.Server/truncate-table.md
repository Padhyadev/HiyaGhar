DELETE FROM ProductVariantMapping;
DELETE FROM ProductVariantDetails;
DELETE FROM ProductImage;
DELETE FROM ProductVariant;
DELETE FROM Product;
DELETE FROM AttributeValue;
DELETE FROM Attribute;
DELETE FROM Category;
DELETE FROM Customer;

DBCC CHECKIDENT ('ProductVariantMapping', RESEED, 0);
DBCC CHECKIDENT ('ProductVariantDetails', RESEED, 0);
DBCC CHECKIDENT ('ProductImage', RESEED, 0);
DBCC CHECKIDENT ('ProductVariant', RESEED, 0);
DBCC CHECKIDENT ('Product', RESEED, 0);
DBCC CHECKIDENT ('AttributeValue', RESEED, 0);
DBCC CHECKIDENT ('Attribute', RESEED, 0);
DBCC CHECKIDENT ('Category', RESEED, 0);
DBCC CHECKIDENT ('Customer', RESEED, 0);