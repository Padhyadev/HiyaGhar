-- Closes the known migration-drift gap documented in
-- Hiya2.Server/Migrations/20260827085221_AddCommerceTables.cs:
-- CustomerAddress, Attribute, AttributeValue were created out-of-band on the
-- local dev DB and were never captured in any migration, so any DB
-- provisioned purely from `dotnet ef database update` (like this one) is
-- missing them even though __EFMigrationsHistory claims everything is applied.
-- DDL below was reverse-engineered column-for-column from the local dev DB
-- (DESKTOP-KC38INU\SQLEXPRESS / hiyaghar) so the two schemas match exactly.

SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('dbo.CustomerAddress', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[CustomerAddress] (
        [Id] bigint NOT NULL IDENTITY(1,1) CONSTRAINT [PK_CustomerAddress] PRIMARY KEY,
        [CustomerId] bigint NOT NULL,
        [CustomerName] nvarchar(100) NULL,
        [MobileNo] varchar(15) NULL,
        [AlternativeMobileNo] varchar(15) NULL,
        [AddressLine1] nvarchar(200) NOT NULL,
        [AddressLine2] nvarchar(200) NULL,
        [City] nvarchar(100) NOT NULL,
        [State] nvarchar(100) NOT NULL,
        [PostalCode] nvarchar(20) NOT NULL,
        [Country] nvarchar(100) NOT NULL DEFAULT ('India'),
        [CountryId] bigint NULL,
        [StateId] bigint NULL,
        [AddressType] nvarchar(50) NULL DEFAULT ('SHIPPING'),
        [IsDefault] bit NOT NULL DEFAULT ((0)),
        [IsActive] bit NOT NULL DEFAULT ((1)),
        [IsDeleted] bit NOT NULL DEFAULT ((0)),
        [CreatedBy] bigint NULL,
        [CreatedDate] datetime NOT NULL DEFAULT (getdate()),
        [LastModifiedBy] bigint NULL,
        [LastModifiedDate] datetime NULL
    );
END

IF OBJECT_ID('dbo.Attribute', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Attribute] (
        [Id] int NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [Name] nvarchar(150) NOT NULL,
        [DisplayName] nvarchar(150) NULL,
        [IsActive] bit NULL DEFAULT ((1)),
        [IsDeleted] bit NULL DEFAULT ((0)),
        [CreatedBy] int NULL,
        [CreatedDate] datetime NULL DEFAULT (getdate()),
        [LastModifiedBy] int NULL,
        [LastModifiedDate] datetime NULL
    );
END

IF OBJECT_ID('dbo.AttributeValue', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AttributeValue] (
        [Id] int NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [AttributeId] int NOT NULL,
        [Value] nvarchar(200) NOT NULL,
        [IsActive] bit NULL DEFAULT ((1)),
        [IsDeleted] bit NULL DEFAULT ((0)),
        [CreatedBy] int NULL,
        [CreatedDate] datetime NULL DEFAULT (getdate()),
        [LastModifiedBy] int NULL,
        [LastModifiedDate] datetime NULL,
        CONSTRAINT [FK_AttributeValue_Attribute] FOREIGN KEY ([AttributeId]) REFERENCES [dbo].[Attribute]([Id])
    );
END

COMMIT TRANSACTION;
