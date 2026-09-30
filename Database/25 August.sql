USE [hiyaghar]
GO
ALTER TABLE [dbo].[UserRole] DROP CONSTRAINT [FK__UserRole__UserId__3587F3E0]
GO
ALTER TABLE [dbo].[UserRole] DROP CONSTRAINT [FK__UserRole__RoleId__367C1819]
GO
ALTER TABLE [dbo].[RoleMenuPermission] DROP CONSTRAINT [FK_RoleMenuPermission_Menus]
GO
ALTER TABLE [dbo].[RoleMenuPermission] DROP CONSTRAINT [FK__RoleMenuP__RoleI__44CA3770]
GO
ALTER TABLE [dbo].[ProductVariantMapping] DROP CONSTRAINT [FK_ProductVariantMapping_Product]
GO
ALTER TABLE [dbo].[ProductVariantDetails] DROP CONSTRAINT [FK_PVD_VariantMapping]
GO
ALTER TABLE [dbo].[ProductVariantDetails] DROP CONSTRAINT [FK_PVD_AttributeValue]
GO
ALTER TABLE [dbo].[ProductVariantDetails] DROP CONSTRAINT [FK_PVD_Attribute]
GO
ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT [FK_ProductVariant_Product]
GO
ALTER TABLE [dbo].[ProductImage] DROP CONSTRAINT [FK_ProductImage_Product]
GO
ALTER TABLE [dbo].[Product] DROP CONSTRAINT [FK_Product_Category]
GO
ALTER TABLE [dbo].[AttributeValue] DROP CONSTRAINT [FK_AttributeValue_Attribute]
GO
ALTER TABLE [dbo].[UserRole] DROP CONSTRAINT [DF__UserRole__Assign__37703C52]
GO
ALTER TABLE [dbo].[User] DROP CONSTRAINT [DF__User__CreatedDat__2BFE89A6]
GO
ALTER TABLE [dbo].[User] DROP CONSTRAINT [DF__User__IsDeleted__2B0A656D]
GO
ALTER TABLE [dbo].[User] DROP CONSTRAINT [DF__User__IsActive__2A164134]
GO
ALTER TABLE [dbo].[RoleMenuPermission] DROP CONSTRAINT [DF__RoleMenuP__Creat__4B7734FF]
GO
ALTER TABLE [dbo].[RoleMenuPermission] DROP CONSTRAINT [DF__RoleMenuP__CanEx__4A8310C6]
GO
ALTER TABLE [dbo].[RoleMenuPermission] DROP CONSTRAINT [DF__RoleMenuP__CanDe__498EEC8D]
GO
ALTER TABLE [dbo].[RoleMenuPermission] DROP CONSTRAINT [DF__RoleMenuP__CanEd__489AC854]
GO
ALTER TABLE [dbo].[RoleMenuPermission] DROP CONSTRAINT [DF__RoleMenuP__CanAd__47A6A41B]
GO
ALTER TABLE [dbo].[RoleMenuPermission] DROP CONSTRAINT [DF__RoleMenuP__CanVi__46B27FE2]
GO
ALTER TABLE [dbo].[Role] DROP CONSTRAINT [DF__Role__CreatedDat__32AB8735]
GO
ALTER TABLE [dbo].[Role] DROP CONSTRAINT [DF__Role__IsDeleted__31B762FC]
GO
ALTER TABLE [dbo].[Role] DROP CONSTRAINT [DF__Role__IsActive__30C33EC3]
GO
ALTER TABLE [dbo].[Role] DROP CONSTRAINT [DF__Role__IsSystemRo__2FCF1A8A]
GO
ALTER TABLE [dbo].[ProductVariantMapping] DROP CONSTRAINT [DF__ProductVa__IsPer__6166761E]
GO
ALTER TABLE [dbo].[ProductVariantMapping] DROP CONSTRAINT [DF__ProductVa__Disco__607251E5]
GO
ALTER TABLE [dbo].[ProductVariantMapping] DROP CONSTRAINT [DF__ProductVa__Creat__5F7E2DAC]
GO
ALTER TABLE [dbo].[ProductVariantMapping] DROP CONSTRAINT [DF__ProductVa__IsDel__5E8A0973]
GO
ALTER TABLE [dbo].[ProductVariantMapping] DROP CONSTRAINT [DF__ProductVa__IsAct__5D95E53A]
GO
ALTER TABLE [dbo].[ProductVariantMapping] DROP CONSTRAINT [DF__ProductVa__Stock__5CA1C101]
GO
ALTER TABLE [dbo].[ProductVariantDetails] DROP CONSTRAINT [DF__ProductVa__Creat__671F4F74]
GO
ALTER TABLE [dbo].[ProductVariantDetails] DROP CONSTRAINT [DF__ProductVa__IsDel__662B2B3B]
GO
ALTER TABLE [dbo].[ProductVariantDetails] DROP CONSTRAINT [DF__ProductVa__IsAct__65370702]
GO
ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT [DF__ProductVa__Creat__7F2BE32F]
GO
ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT [DF__ProductVa__Creat__7E37BEF6]
GO
ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT [DF__ProductVa__IsDel__7D439ABD]
GO
ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT [DF__ProductVa__IsAct__7C4F7684]
GO
ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT [DF__ProductVa__IsDef__7B5B524B]
GO
ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT [DF__ProductVa__IsInS__7A672E12]
GO
ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT [DF__ProductVa__Stock__797309D9]
GO
ALTER TABLE [dbo].[ProductImage] DROP CONSTRAINT [DF__ProductIm__Creat__06CD04F7]
GO
ALTER TABLE [dbo].[ProductImage] DROP CONSTRAINT [DF__ProductIm__IsDel__05D8E0BE]
GO
ALTER TABLE [dbo].[ProductImage] DROP CONSTRAINT [DF__ProductIm__IsAct__04E4BC85]
GO
ALTER TABLE [dbo].[ProductImage] DROP CONSTRAINT [DF__ProductIm__IsPri__03F0984C]
GO
ALTER TABLE [dbo].[ProductImage] DROP CONSTRAINT [DF__ProductIm__Displ__02FC7413]
GO
ALTER TABLE [dbo].[Product] DROP CONSTRAINT [DF__Product__Created__75A278F5]
GO
ALTER TABLE [dbo].[Product] DROP CONSTRAINT [DF__Product__Created__74AE54BC]
GO
ALTER TABLE [dbo].[Product] DROP CONSTRAINT [DF__Product__IsDelet__73BA3083]
GO
ALTER TABLE [dbo].[Product] DROP CONSTRAINT [DF__Product__IsActiv__72C60C4A]
GO
ALTER TABLE [dbo].[Product] DROP CONSTRAINT [DF__Product__IsFeatu__71D1E811]
GO
ALTER TABLE [dbo].[Product] DROP CONSTRAINT [DF__Product__ReviewC__70DDC3D8]
GO
ALTER TABLE [dbo].[Product] DROP CONSTRAINT [DF__Product__Rating__6FE99F9F]
GO
ALTER TABLE [dbo].[Customer] DROP CONSTRAINT [DF__Customer__IsDele__4AB81AF0]
GO
ALTER TABLE [dbo].[Customer] DROP CONSTRAINT [DF__Customer__IsActi__49C3F6B7]
GO
ALTER TABLE [dbo].[Category] DROP CONSTRAINT [DF__Category__Create__60A75C0F]
GO
ALTER TABLE [dbo].[Category] DROP CONSTRAINT [DF__Category__Create__5FB337D6]
GO
ALTER TABLE [dbo].[Category] DROP CONSTRAINT [DF__Category__IsDele__5EBF139D]
GO
ALTER TABLE [dbo].[Category] DROP CONSTRAINT [DF__Category__IsActi__5DCAEF64]
GO
ALTER TABLE [dbo].[Category] DROP CONSTRAINT [DF__Category__Parent__5CD6CB2B]
GO
ALTER TABLE [dbo].[AttributeValue] DROP CONSTRAINT [DF__Attribute__Creat__58D1301D]
GO
ALTER TABLE [dbo].[AttributeValue] DROP CONSTRAINT [DF__Attribute__IsDel__57DD0BE4]
GO
ALTER TABLE [dbo].[AttributeValue] DROP CONSTRAINT [DF__Attribute__IsAct__56E8E7AB]
GO
ALTER TABLE [dbo].[Attribute] DROP CONSTRAINT [DF__Attribute__Creat__540C7B00]
GO
ALTER TABLE [dbo].[Attribute] DROP CONSTRAINT [DF__Attribute__IsDel__531856C7]
GO
ALTER TABLE [dbo].[Attribute] DROP CONSTRAINT [DF__Attribute__IsAct__5224328E]
GO
/****** Object:  Index [UQ__User__A9D10534800151D4]    Script Date: 25-Aug-26 7:08:16 PM ******/
ALTER TABLE [dbo].[User] DROP CONSTRAINT [UQ__User__A9D10534800151D4]
GO
/****** Object:  Index [UQ__Role__D62CB59C09888C87]    Script Date: 25-Aug-26 7:08:16 PM ******/
ALTER TABLE [dbo].[Role] DROP CONSTRAINT [UQ__Role__D62CB59C09888C87]
GO
/****** Object:  Table [dbo].[UserRole]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserRole]') AND type in (N'U'))
DROP TABLE [dbo].[UserRole]
GO
/****** Object:  Table [dbo].[User]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[User]') AND type in (N'U'))
DROP TABLE [dbo].[User]
GO
/****** Object:  Table [dbo].[RoleMenuPermission]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RoleMenuPermission]') AND type in (N'U'))
DROP TABLE [dbo].[RoleMenuPermission]
GO
/****** Object:  Table [dbo].[Role]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Role]') AND type in (N'U'))
DROP TABLE [dbo].[Role]
GO
/****** Object:  Table [dbo].[ProductVariantMapping]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductVariantMapping]') AND type in (N'U'))
DROP TABLE [dbo].[ProductVariantMapping]
GO
/****** Object:  Table [dbo].[ProductVariantDetails]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductVariantDetails]') AND type in (N'U'))
DROP TABLE [dbo].[ProductVariantDetails]
GO
/****** Object:  Table [dbo].[ProductVariant]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductVariant]') AND type in (N'U'))
DROP TABLE [dbo].[ProductVariant]
GO
/****** Object:  Table [dbo].[ProductImage]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductImage]') AND type in (N'U'))
DROP TABLE [dbo].[ProductImage]
GO
/****** Object:  Table [dbo].[Product]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Product]') AND type in (N'U'))
DROP TABLE [dbo].[Product]
GO
/****** Object:  Table [dbo].[Menus]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Menus]') AND type in (N'U'))
DROP TABLE [dbo].[Menus]
GO
/****** Object:  Table [dbo].[HomePageComponentItem]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[HomePageComponentItem]') AND type in (N'U'))
DROP TABLE [dbo].[HomePageComponentItem]
GO
/****** Object:  Table [dbo].[HomePageComponent]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[HomePageComponent]') AND type in (N'U'))
DROP TABLE [dbo].[HomePageComponent]
GO
/****** Object:  Table [dbo].[Customer]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Customer]') AND type in (N'U'))
DROP TABLE [dbo].[Customer]
GO
/****** Object:  Table [dbo].[Category]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Category]') AND type in (N'U'))
DROP TABLE [dbo].[Category]
GO
/****** Object:  Table [dbo].[AttributeValue]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AttributeValue]') AND type in (N'U'))
DROP TABLE [dbo].[AttributeValue]
GO
/****** Object:  Table [dbo].[Attribute]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Attribute]') AND type in (N'U'))
DROP TABLE [dbo].[Attribute]
GO
/****** Object:  Table [dbo].[__EFMigrationsHistory]    Script Date: 25-Aug-26 7:08:16 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[__EFMigrationsHistory]') AND type in (N'U'))
DROP TABLE [dbo].[__EFMigrationsHistory]
GO
/****** Object:  Table [dbo].[__EFMigrationsHistory]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[__EFMigrationsHistory](
	[MigrationId] [nvarchar](150) NOT NULL,
	[ProductVersion] [nvarchar](32) NOT NULL,
 CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY CLUSTERED 
(
	[MigrationId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Attribute]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Attribute](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](150) NOT NULL,
	[DisplayName] [nvarchar](150) NULL,
	[IsActive] [bit] NULL,
	[IsDeleted] [bit] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[LastModifiedBy] [int] NULL,
	[LastModifiedDate] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AttributeValue]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AttributeValue](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AttributeId] [int] NOT NULL,
	[Value] [nvarchar](200) NOT NULL,
	[IsActive] [bit] NULL,
	[IsDeleted] [bit] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[LastModifiedBy] [int] NULL,
	[LastModifiedDate] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Category]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Category](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[CategoryName] [nvarchar](150) NOT NULL,
	[ParentCategoryId] [int] NOT NULL,
	[ImagePath] [nvarchar](500) NULL,
	[SKU] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[CreatedBy] [int] NOT NULL,
	[CreatedDate] [datetime] NOT NULL,
	[LastModifiedBy] [int] NULL,
	[LastModifiedDate] [datetime] NULL,
	[Description] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Customer]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Customer](
	[CustomerId] [bigint] IDENTITY(1,1) NOT NULL,
	[FirstName] [nvarchar](100) NOT NULL,
	[LastName] [nvarchar](100) NOT NULL,
	[Email] [nvarchar](255) NOT NULL,
	[MobileNo] [nvarchar](20) NOT NULL,
	[PasswordHash] [nvarchar](500) NOT NULL,
	[IsActive] [bit] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[CreatedBy] [bigint] NULL,
	[CreatedDate] [datetime2](7) NULL,
	[LastModifiedBy] [bigint] NULL,
	[LastModifiedDate] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[CustomerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HomePageComponent]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HomePageComponent](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Key] [varchar](100) NOT NULL,
	[Name] [varchar](100) NOT NULL,
	[Type] [varchar](50) NOT NULL,
	[DisplayOrder] [int] NOT NULL,
	[IsActive] [bit] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[CreatedBy] [int] NOT NULL,
	[CreatedDate] [datetime] NOT NULL,
	[LastModifiedBy] [int] NULL,
	[LastModifiedDate] [datetime] NULL,
 CONSTRAINT [PK__HomePage__3214EC07CB66197D] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HomePageComponentItem]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HomePageComponentItem](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ComponentId] [int] NULL,
	[Title] [varchar](200) NULL,
	[Subtitle] [varchar](200) NULL,
	[Description] [varchar](max) NULL,
	[RefId] [varchar](500) NULL,
	[RefType] [varchar](50) NULL,
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[CreatedBy] [int] NOT NULL,
	[CreatedDate] [datetime] NOT NULL,
	[LastModifiedBy] [int] NULL,
	[LastModifiedDate] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Menus]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Menus](
	[MenuId] [int] IDENTITY(1,1) NOT NULL,
	[ParentId] [int] NOT NULL,
	[Controller] [nvarchar](100) NULL,
	[Name] [nvarchar](150) NULL,
	[Icon] [nvarchar](150) NULL,
	[DisplayOrder] [int] NULL,
	[SuperAdmin] [bit] NULL,
	[IsActive] [bit] NULL,
	[IsDeleted] [bit] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[LastModifiedBy] [int] NULL,
	[LastModifiedDate] [datetime] NULL,
 CONSTRAINT [PK_Menus] PRIMARY KEY CLUSTERED 
(
	[MenuId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Product]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Product](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[CategoryId] [int] NOT NULL,
	[ProductName] [nvarchar](200) NOT NULL,
	[ShortDescription] [nvarchar](500) NULL,
	[FullDescription] [nvarchar](max) NULL,
	[MainImagePath] [nvarchar](500) NULL,
	[BasePrice] [decimal](18, 2) NOT NULL,
	[DiscountPrice] [decimal](18, 2) NULL,
	[Rating] [decimal](3, 2) NOT NULL,
	[ReviewCount] [int] NOT NULL,
	[IsFeatured] [bit] NOT NULL,
	[IsActive] [bit] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[CreatedBy] [int] NOT NULL,
	[CreatedDate] [datetime] NOT NULL,
	[LastModifiedBy] [int] NULL,
	[LastModifiedDate] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductImage]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductImage](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ProductId] [int] NOT NULL,
	[ImagePath] [nvarchar](500) NOT NULL,
	[DisplayOrder] [int] NOT NULL,
	[IsPrimary] [bit] NOT NULL,
	[IsActive] [bit] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[CreatedDate] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductVariant]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductVariant](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ProductId] [int] NOT NULL,
	[VariantName] [nvarchar](100) NOT NULL,
	[SKU] [nvarchar](100) NOT NULL,
	[Price] [decimal](18, 2) NOT NULL,
	[OriginalPrice] [decimal](18, 2) NULL,
	[StockQuantity] [int] NOT NULL,
	[IsInStock] [bit] NOT NULL,
	[IsDefault] [bit] NOT NULL,
	[IsActive] [bit] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[CreatedBy] [int] NOT NULL,
	[CreatedDate] [datetime] NOT NULL,
	[LastModifiedBy] [int] NULL,
	[LastModifiedDate] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductVariantDetails]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductVariantDetails](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[VariantId] [int] NOT NULL,
	[AttributeId] [int] NOT NULL,
	[AttributeValueId] [int] NOT NULL,
	[IsActive] [bit] NULL,
	[IsDeleted] [bit] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[LastModifiedBy] [int] NULL,
	[LastModifiedDate] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductVariantMapping]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductVariantMapping](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ProductId] [int] NOT NULL,
	[SKU] [nvarchar](100) NULL,
	[Price] [decimal](18, 2) NOT NULL,
	[StockQuantity] [int] NOT NULL,
	[IsActive] [bit] NULL,
	[IsDeleted] [bit] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[LastModifiedBy] [int] NULL,
	[LastModifiedDate] [datetime] NULL,
	[DiscountPercent] [decimal](18, 2) NULL,
	[SellPrice] [decimal](18, 2) NOT NULL,
	[IsPercentagePricing] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Role]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Role](
	[RoleId] [int] IDENTITY(1,1) NOT NULL,
	[RoleName] [nvarchar](100) NOT NULL,
	[RoleCode] [nvarchar](50) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[IsSystemRole] [bit] NOT NULL,
	[IsActive] [bit] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[CreatedBy] [bigint] NULL,
	[CreatedDate] [datetime2](7) NULL,
	[LastModifiedBy] [bigint] NULL,
	[LastModifiedDate] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RoleMenuPermission]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RoleMenuPermission](
	[PermissionId] [bigint] IDENTITY(1,1) NOT NULL,
	[RoleId] [int] NOT NULL,
	[MenuId] [int] NOT NULL,
	[CanView] [bit] NOT NULL,
	[CanAdd] [bit] NOT NULL,
	[CanEdit] [bit] NOT NULL,
	[CanDelete] [bit] NOT NULL,
	[CanExport] [bit] NOT NULL,
	[CreatedBy] [bigint] NULL,
	[CreatedDate] [datetime2](7) NULL,
	[LastModifiedBy] [bigint] NULL,
	[LastModifiedDate] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[PermissionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[User]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[User](
	[UserId] [bigint] IDENTITY(1,1) NOT NULL,
	[FirstName] [nvarchar](100) NOT NULL,
	[LastName] [nvarchar](100) NOT NULL,
	[Email] [nvarchar](150) NOT NULL,
	[MobileNo] [nvarchar](20) NOT NULL,
	[PasswordHash] [nvarchar](max) NOT NULL,
	[ProfileImagePath] [nvarchar](max) NULL,
	[IsActive] [bit] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[CreatedBy] [bigint] NULL,
	[CreatedDate] [datetime2](7) NULL,
	[LastModifiedBy] [bigint] NULL,
	[LastModifiedDate] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserRole]    Script Date: 25-Aug-26 7:08:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserRole](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[UserId] [bigint] NOT NULL,
	[RoleId] [int] NOT NULL,
	[AssignedDate] [datetime2](7) NOT NULL,
	[AssignedBy] [bigint] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260824062706_AddCustomerTable', N'8.0.13')
GO
SET IDENTITY_INSERT [dbo].[HomePageComponent] ON 
GO
INSERT [dbo].[HomePageComponent] ([Id], [Key], [Name], [Type], [DisplayOrder], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, N'Category', N'Category Section', N'Category', 1, 1, 0, 1, CAST(N'2026-08-24T14:25:17.053' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[HomePageComponent] ([Id], [Key], [Name], [Type], [DisplayOrder], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, N'Bestsellers', N'Best Sellers Carousel', N'Bestsellers', 2, 1, 0, 1, CAST(N'2026-08-24T14:25:17.100' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[HomePageComponent] OFF
GO
SET IDENTITY_INSERT [dbo].[HomePageComponentItem] ON 
GO
INSERT [dbo].[HomePageComponentItem] ([Id], [ComponentId], [Title], [Subtitle], [Description], [RefId], [RefType], [DisplayOrder], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, 1, N'EXPLORE CATEGORIES', N'Squeeze in Some Goodness', N'Explore Category Section', N'1,2,3,4,5,6', N'Category', 1, 1, 0, 1, CAST(N'2026-08-24T14:25:17.070' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[HomePageComponentItem] ([Id], [ComponentId], [Title], [Subtitle], [Description], [RefId], [RefType], [DisplayOrder], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, 2, N'BESTSELLERS', N'Our Most Popular Products', N'Bestseller Carousel Section', N'3-5,4-8,5-10,6-11,7-12,13-15,16-17,19-20,22-22', N'Bestsellers', 1, 1, 0, 1, CAST(N'2026-08-24T14:25:17.103' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[HomePageComponentItem] OFF
GO
SET IDENTITY_INSERT [dbo].[Menus] ON 
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, 0, N'User', N'User', N'fa-solid fa-user', 1, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.210' AS DateTime), NULL, CAST(N'2026-08-25T13:10:55.800' AS DateTime))
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, 0, N'Role', N'Role', N'fa-solid fa-user-shield', 2, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.233' AS DateTime), NULL, CAST(N'2026-08-25T13:11:03.317' AS DateTime))
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, 0, N'Product', N'Product', N'fa-solid fa-box', 3, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.240' AS DateTime), NULL, CAST(N'2026-08-25T13:11:12.617' AS DateTime))
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (4, 0, N'Menu', N'Menu', N'fa-solid fa-bars', 4, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.250' AS DateTime), NULL, CAST(N'2026-08-25T13:11:21.280' AS DateTime))
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (5, 0, N'Customer', N'Customer', N'fa-solid fa-users', 5, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.257' AS DateTime), NULL, CAST(N'2026-08-25T13:11:30.060' AS DateTime))
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (6, 0, N'Category', N'Category', N'fa-solid fa-tags', 6, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.267' AS DateTime), NULL, CAST(N'2026-08-25T13:11:39.120' AS DateTime))
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (7, 0, N'Attribute', N'Attribute', N'fa-solid fa-sliders', 7, 1, 1, 0, NULL, CAST(N'2026-08-24T17:13:16.920' AS DateTime), NULL, CAST(N'2026-08-25T13:11:47.420' AS DateTime))
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (8, 0, N'HomePageComponent', N'HomePageComponent', N'fa-solid fa-puzzle-piece', 8, 1, 1, 0, NULL, CAST(N'2026-08-25T11:55:36.667' AS DateTime), NULL, CAST(N'2026-08-25T13:11:57.257' AS DateTime))
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (9, 0, N'TestMenu', N'TestMenu', N'fa-solid fa-puzzle-piece', 9, 1, 1, 1, NULL, CAST(N'2026-08-25T12:13:42.637' AS DateTime), NULL, CAST(N'2026-08-25T13:46:49.117' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Menus] OFF
GO
SET IDENTITY_INSERT [dbo].[Role] ON 
GO
INSERT [dbo].[Role] ([RoleId], [RoleName], [RoleCode], [Description], [IsSystemRole], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, N'Super Admin', N'SUPER_ADMIN', N'Full access system administrator', 1, 1, 0, NULL, CAST(N'2026-08-24T15:59:54.3985095' AS DateTime2), NULL, CAST(N'2026-08-25T13:07:23.2131360' AS DateTime2))
GO
INSERT [dbo].[Role] ([RoleId], [RoleName], [RoleCode], [Description], [IsSystemRole], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, N'Testing demo', N'DEMO', N'not At 2', 0, 1, 1, NULL, CAST(N'2026-08-25T11:37:22.7832071' AS DateTime2), NULL, CAST(N'2026-08-25T11:59:11.7889283' AS DateTime2))
GO
INSERT [dbo].[Role] ([RoleId], [RoleName], [RoleCode], [Description], [IsSystemRole], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, N'Vishal_Role', N'VR', N'Testing', 0, 1, 0, NULL, CAST(N'2026-08-25T13:56:20.2829060' AS DateTime2), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Role] OFF
GO
SET IDENTITY_INSERT [dbo].[RoleMenuPermission] ON 
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (48, 2, 1, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T11:58:22.6626840' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (49, 2, 2, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T11:58:22.6626842' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (50, 2, 3, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T11:58:22.6626844' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (51, 2, 4, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T11:58:22.6626845' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (52, 2, 5, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T11:58:22.6626847' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (53, 2, 6, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T11:58:22.6626848' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (54, 2, 7, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T11:58:22.6626849' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (55, 2, 8, 0, 0, 0, 0, 0, NULL, CAST(N'2026-08-25T11:58:22.6626899' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (141, 1, 1, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:07:23.4602126' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (142, 1, 2, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:07:23.4602391' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (143, 1, 3, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:07:23.4602393' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (144, 1, 4, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:07:23.4602397' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (145, 1, 5, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:07:23.4602398' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (146, 1, 6, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:07:23.4602399' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (147, 1, 7, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:07:23.4602400' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (148, 1, 8, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:07:23.4602401' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (149, 1, 9, 0, 0, 0, 0, 0, NULL, CAST(N'2026-08-25T13:07:23.4602929' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (150, 3, 1, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:56:20.3788456' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (151, 3, 2, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:56:20.3788458' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (152, 3, 3, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:56:20.3788460' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (153, 3, 4, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:56:20.3788460' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (154, 3, 5, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:56:20.3788461' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (155, 3, 6, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:56:20.3788462' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (156, 3, 7, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-25T13:56:20.3788463' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (157, 3, 8, 0, 0, 0, 0, 0, NULL, CAST(N'2026-08-25T13:56:20.3788465' AS DateTime2), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[RoleMenuPermission] OFF
GO
SET IDENTITY_INSERT [dbo].[User] ON 
GO
INSERT [dbo].[User] ([UserId], [FirstName], [LastName], [Email], [MobileNo], [PasswordHash], [ProfileImagePath], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, N'Vishal', N'Gami', N'vmgami33333@gmail.com', N'9876543210', N'admin123', NULL, 1, 0, NULL, CAST(N'2026-08-24T15:59:54.7320448' AS DateTime2), NULL, CAST(N'2026-08-25T11:42:10.0990959' AS DateTime2))
GO
INSERT [dbo].[User] ([UserId], [FirstName], [LastName], [Email], [MobileNo], [PasswordHash], [ProfileImagePath], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, N'gami', N'VISHAL', N'vmgami2001@gmail.com', N'9510212154', N'admin@123', NULL, 1, 0, NULL, CAST(N'2026-08-25T13:57:06.6392051' AS DateTime2), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[User] OFF
GO
SET IDENTITY_INSERT [dbo].[UserRole] ON 
GO
INSERT [dbo].[UserRole] ([Id], [UserId], [RoleId], [AssignedDate], [AssignedBy]) VALUES (3, 1, 1, CAST(N'2026-08-25T11:42:10.1151641' AS DateTime2), NULL)
GO
INSERT [dbo].[UserRole] ([Id], [UserId], [RoleId], [AssignedDate], [AssignedBy]) VALUES (4, 2, 3, CAST(N'2026-08-25T13:57:06.6610028' AS DateTime2), NULL)
GO
SET IDENTITY_INSERT [dbo].[UserRole] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Role__D62CB59C09888C87]    Script Date: 25-Aug-26 7:08:16 PM ******/
ALTER TABLE [dbo].[Role] ADD UNIQUE NONCLUSTERED 
(
	[RoleCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__User__A9D10534800151D4]    Script Date: 25-Aug-26 7:08:16 PM ******/
ALTER TABLE [dbo].[User] ADD UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Attribute] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Attribute] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[Attribute] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[AttributeValue] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[AttributeValue] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[AttributeValue] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[Category] ADD  DEFAULT ((0)) FOR [ParentCategoryId]
GO
ALTER TABLE [dbo].[Category] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Category] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[Category] ADD  DEFAULT ((1)) FOR [CreatedBy]
GO
ALTER TABLE [dbo].[Category] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[Customer] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Customer] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[Product] ADD  DEFAULT ((5.0)) FOR [Rating]
GO
ALTER TABLE [dbo].[Product] ADD  DEFAULT ((0)) FOR [ReviewCount]
GO
ALTER TABLE [dbo].[Product] ADD  DEFAULT ((0)) FOR [IsFeatured]
GO
ALTER TABLE [dbo].[Product] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Product] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[Product] ADD  DEFAULT ((1)) FOR [CreatedBy]
GO
ALTER TABLE [dbo].[Product] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[ProductImage] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO
ALTER TABLE [dbo].[ProductImage] ADD  DEFAULT ((0)) FOR [IsPrimary]
GO
ALTER TABLE [dbo].[ProductImage] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[ProductImage] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[ProductImage] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[ProductVariant] ADD  DEFAULT ((0)) FOR [StockQuantity]
GO
ALTER TABLE [dbo].[ProductVariant] ADD  DEFAULT ((1)) FOR [IsInStock]
GO
ALTER TABLE [dbo].[ProductVariant] ADD  DEFAULT ((0)) FOR [IsDefault]
GO
ALTER TABLE [dbo].[ProductVariant] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[ProductVariant] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[ProductVariant] ADD  DEFAULT ((1)) FOR [CreatedBy]
GO
ALTER TABLE [dbo].[ProductVariant] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[ProductVariantDetails] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[ProductVariantDetails] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[ProductVariantDetails] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[ProductVariantMapping] ADD  DEFAULT ((0)) FOR [StockQuantity]
GO
ALTER TABLE [dbo].[ProductVariantMapping] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[ProductVariantMapping] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[ProductVariantMapping] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[ProductVariantMapping] ADD  DEFAULT ((0)) FOR [DiscountPercent]
GO
ALTER TABLE [dbo].[ProductVariantMapping] ADD  DEFAULT ((0)) FOR [IsPercentagePricing]
GO
ALTER TABLE [dbo].[Role] ADD  DEFAULT ((0)) FOR [IsSystemRole]
GO
ALTER TABLE [dbo].[Role] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Role] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[Role] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[RoleMenuPermission] ADD  DEFAULT ((0)) FOR [CanView]
GO
ALTER TABLE [dbo].[RoleMenuPermission] ADD  DEFAULT ((0)) FOR [CanAdd]
GO
ALTER TABLE [dbo].[RoleMenuPermission] ADD  DEFAULT ((0)) FOR [CanEdit]
GO
ALTER TABLE [dbo].[RoleMenuPermission] ADD  DEFAULT ((0)) FOR [CanDelete]
GO
ALTER TABLE [dbo].[RoleMenuPermission] ADD  DEFAULT ((0)) FOR [CanExport]
GO
ALTER TABLE [dbo].[RoleMenuPermission] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[User] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[User] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[User] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [dbo].[UserRole] ADD  DEFAULT (getdate()) FOR [AssignedDate]
GO
ALTER TABLE [dbo].[AttributeValue]  WITH CHECK ADD  CONSTRAINT [FK_AttributeValue_Attribute] FOREIGN KEY([AttributeId])
REFERENCES [dbo].[Attribute] ([Id])
GO
ALTER TABLE [dbo].[AttributeValue] CHECK CONSTRAINT [FK_AttributeValue_Attribute]
GO
ALTER TABLE [dbo].[Product]  WITH CHECK ADD  CONSTRAINT [FK_Product_Category] FOREIGN KEY([CategoryId])
REFERENCES [dbo].[Category] ([Id])
GO
ALTER TABLE [dbo].[Product] CHECK CONSTRAINT [FK_Product_Category]
GO
ALTER TABLE [dbo].[ProductImage]  WITH CHECK ADD  CONSTRAINT [FK_ProductImage_Product] FOREIGN KEY([ProductId])
REFERENCES [dbo].[Product] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ProductImage] CHECK CONSTRAINT [FK_ProductImage_Product]
GO
ALTER TABLE [dbo].[ProductVariant]  WITH CHECK ADD  CONSTRAINT [FK_ProductVariant_Product] FOREIGN KEY([ProductId])
REFERENCES [dbo].[Product] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ProductVariant] CHECK CONSTRAINT [FK_ProductVariant_Product]
GO
ALTER TABLE [dbo].[ProductVariantDetails]  WITH CHECK ADD  CONSTRAINT [FK_PVD_Attribute] FOREIGN KEY([AttributeId])
REFERENCES [dbo].[Attribute] ([Id])
GO
ALTER TABLE [dbo].[ProductVariantDetails] CHECK CONSTRAINT [FK_PVD_Attribute]
GO
ALTER TABLE [dbo].[ProductVariantDetails]  WITH CHECK ADD  CONSTRAINT [FK_PVD_AttributeValue] FOREIGN KEY([AttributeValueId])
REFERENCES [dbo].[AttributeValue] ([Id])
GO
ALTER TABLE [dbo].[ProductVariantDetails] CHECK CONSTRAINT [FK_PVD_AttributeValue]
GO
ALTER TABLE [dbo].[ProductVariantDetails]  WITH CHECK ADD  CONSTRAINT [FK_PVD_VariantMapping] FOREIGN KEY([VariantId])
REFERENCES [dbo].[ProductVariantMapping] ([Id])
GO
ALTER TABLE [dbo].[ProductVariantDetails] CHECK CONSTRAINT [FK_PVD_VariantMapping]
GO
ALTER TABLE [dbo].[ProductVariantMapping]  WITH CHECK ADD  CONSTRAINT [FK_ProductVariantMapping_Product] FOREIGN KEY([ProductId])
REFERENCES [dbo].[Product] ([Id])
GO
ALTER TABLE [dbo].[ProductVariantMapping] CHECK CONSTRAINT [FK_ProductVariantMapping_Product]
GO
ALTER TABLE [dbo].[RoleMenuPermission]  WITH CHECK ADD FOREIGN KEY([RoleId])
REFERENCES [dbo].[Role] ([RoleId])
GO
ALTER TABLE [dbo].[RoleMenuPermission]  WITH CHECK ADD  CONSTRAINT [FK_RoleMenuPermission_Menus] FOREIGN KEY([MenuId])
REFERENCES [dbo].[Menus] ([MenuId])
GO
ALTER TABLE [dbo].[RoleMenuPermission] CHECK CONSTRAINT [FK_RoleMenuPermission_Menus]
GO
ALTER TABLE [dbo].[UserRole]  WITH CHECK ADD FOREIGN KEY([RoleId])
REFERENCES [dbo].[Role] ([RoleId])
GO
ALTER TABLE [dbo].[UserRole]  WITH CHECK ADD FOREIGN KEY([UserId])
REFERENCES [dbo].[User] ([UserId])
GO
