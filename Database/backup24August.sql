USE [hiyaghar]
GO
/****** Object:  Table [dbo].[__EFMigrationsHistory]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[Attribute]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[AttributeValue]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[Category]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[Customer]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[HomePageComponent]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[HomePageComponentItem]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[Menus]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[Product]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[ProductImage]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[ProductVariant]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[ProductVariantDetails]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[ProductVariantMapping]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[Role]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[RoleMenuPermission]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[User]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
/****** Object:  Table [dbo].[UserRole]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
SET IDENTITY_INSERT [dbo].[Attribute] ON 
GO
INSERT [dbo].[Attribute] ([Id], [Name], [DisplayName], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, N'Weight', N'Product Weight / Pack Size', 1, 0, NULL, CAST(N'2026-08-24T17:13:12.900' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Attribute] ([Id], [Name], [DisplayName], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, N'Packaging', N'Packaging Container', 1, 0, NULL, CAST(N'2026-08-24T17:13:12.923' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Attribute] OFF
GO
SET IDENTITY_INSERT [dbo].[AttributeValue] ON 
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, 1, N'100g', 1, 0, NULL, CAST(N'2026-08-24T17:13:12.907' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, 1, N'200g', 1, 0, NULL, CAST(N'2026-08-24T17:13:12.907' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, 1, N'300g', 1, 0, NULL, CAST(N'2026-08-24T17:13:12.907' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (4, 1, N'500g', 1, 0, NULL, CAST(N'2026-08-24T17:13:12.907' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (5, 1, N'1kg', 1, 0, NULL, CAST(N'2026-08-24T17:13:12.907' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (6, 2, N'Stand-Up Pouch', 1, 0, NULL, CAST(N'2026-08-24T17:13:12.923' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (7, 2, N'Glass Jar', 1, 0, NULL, CAST(N'2026-08-24T17:13:12.923' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (8, 2, N'PET Bottle', 1, 0, NULL, CAST(N'2026-08-24T17:13:12.923' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[AttributeValue] OFF
GO
SET IDENTITY_INSERT [dbo].[Category] ON 
GO
INSERT [dbo].[Category] ([Id], [CategoryName], [ParentCategoryId], [ImagePath], [SKU], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate], [Description]) VALUES (1, N'Mukhwas', 0, N'/image/ImageforMukhwash/Shahi Pan.webp', N'CAT-MUK-001', 1, 0, 1, CAST(N'2026-08-24T12:34:00.627' AS DateTime), NULL, NULL, NULL)
GO
INSERT [dbo].[Category] ([Id], [CategoryName], [ParentCategoryId], [ImagePath], [SKU], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate], [Description]) VALUES (2, N'Tea Masala', 0, N'/image/jamunbottole_clean.webp', N'CAT-TEA-002', 1, 0, 1, CAST(N'2026-08-24T12:34:00.633' AS DateTime), NULL, NULL, NULL)
GO
INSERT [dbo].[Category] ([Id], [CategoryName], [ParentCategoryId], [ImagePath], [SKU], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate], [Description]) VALUES (3, N'Handmade Soap', 0, N'/image/jamunbottole_clean.webp', N'CAT-SOP-003', 1, 0, 1, CAST(N'2026-08-24T13:47:37.497' AS DateTime), NULL, NULL, NULL)
GO
INSERT [dbo].[Category] ([Id], [CategoryName], [ParentCategoryId], [ImagePath], [SKU], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate], [Description]) VALUES (4, N'Hair Oil', 0, N'/image/jamunbottole_clean.webp', N'CAT-OIL-004', 1, 0, 1, CAST(N'2026-08-24T13:47:37.500' AS DateTime), NULL, NULL, NULL)
GO
INSERT [dbo].[Category] ([Id], [CategoryName], [ParentCategoryId], [ImagePath], [SKU], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate], [Description]) VALUES (5, N'Gift Hampers', 0, N'/image/jamunbottole_clean.webp', N'CAT-GFT-005', 1, 0, 1, CAST(N'2026-08-24T13:47:37.500' AS DateTime), NULL, NULL, NULL)
GO
INSERT [dbo].[Category] ([Id], [CategoryName], [ParentCategoryId], [ImagePath], [SKU], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate], [Description]) VALUES (6, N'Combos', 0, N'/image/jamunbottole_clean.webp', N'CAT-CMB-006', 1, 0, 1, CAST(N'2026-08-24T13:47:37.500' AS DateTime), NULL, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Category] OFF
GO
SET IDENTITY_INSERT [dbo].[Customer] ON 
GO
INSERT [dbo].[Customer] ([CustomerId], [FirstName], [LastName], [Email], [MobileNo], [PasswordHash], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, N'Vishal', N'Gami', N'vmgami333@gmail.com', N'9510212154', N'admin@123', 1, 0, 0, CAST(N'2026-08-24T06:37:57.1640379' AS DateTime2), 0, CAST(N'2026-08-24T06:37:22.3390000' AS DateTime2))
GO
INSERT [dbo].[Customer] ([CustomerId], [FirstName], [LastName], [Email], [MobileNo], [PasswordHash], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, N'Vishal', N'Gami', N'vishal.gami@example.com', N'9876543210', N'hashed_pass_123', 1, 0, NULL, CAST(N'2026-08-24T06:44:19.9180726' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[Customer] ([CustomerId], [FirstName], [LastName], [Email], [MobileNo], [PasswordHash], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, N'Hiya', N'Ghar', N'info@hiyaghar.com', N'9123456789', N'hashed_pass_456', 1, 0, NULL, CAST(N'2026-08-24T06:44:20.1705906' AS DateTime2), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Customer] OFF
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
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, 0, N'User', N'User', N'Users', 1, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.210' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, 0, N'Role', N'Role', N'ShieldCheck', 2, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.233' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, 0, N'Product', N'Product', N'Package', 3, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.240' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (4, 0, N'Menu', N'Menu', N'Layers', 4, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.250' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (5, 0, N'Customer', N'Customer', N'UserCheck', 5, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.257' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (6, 0, N'Category', N'Category', N'FolderTree', 6, 1, 1, 0, 1, CAST(N'2026-08-24T16:04:34.267' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (7, 0, N'Attribute', N'Attribute', N'Tags', 7, 1, 1, 0, NULL, CAST(N'2026-08-24T17:13:16.920' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Menus] OFF
GO
SET IDENTITY_INSERT [dbo].[Product] ON 
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, 1, N'Shahi Paan Mukhwas', N'Rich betel leaf digestive mouth freshener', N'Premium quality digestive made with natural betel leaves, dry dates, and aromatic spices.', N'/image/ImageforMukhwash/Shahi Pan.webp', CAST(199.00 AS Decimal(18, 2)), CAST(249.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 42, 1, 1, 0, 1, CAST(N'2026-08-24T14:03:12.200' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, 1, N'Jamun Digest', N'Pure herbal Jamun digestive tonic blend', N'Herbal formulation enriched with Jamun seeds and natural digestive spices.', N'/image/jamunbottole_clean.webp', CAST(299.00 AS Decimal(18, 2)), CAST(349.00 AS Decimal(18, 2)), CAST(4.80 AS Decimal(3, 2)), 28, 1, 1, 0, 1, CAST(N'2026-08-24T14:03:12.203' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, 1, N'Kalkatti Pan Mukhwas', N'Authentic Kalkatti betel leaf crunch with sun-dried Gulkand & silver pearls.', N'Indulge in authentic Banarasi paan goodness. Hand-crafted using sun-dried Kalkatti betel leaves, rose petal Gulkand, silver pearls, and sweet coconut flakes. 100% natural, tobacco-free, and delightfully cooling.', N'/image/ImageforMukhwash/Kalkatti-Pan 1.webp', CAST(349.00 AS Decimal(18, 2)), CAST(399.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 220, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.257' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (4, 1, N'Amla Madhur Mukhwas', N'Vitamin C rich dried amla candied with organic jaggery & digestive spices.', N'Sun-dried Indian gooseberries candied with organic cane jaggery and seasoned with roasted cumin and pink rock salt.', N'/image/ImageforMukhwash/Amla Madhur.webp', CAST(249.00 AS Decimal(18, 2)), CAST(285.00 AS Decimal(18, 2)), CAST(4.80 AS Decimal(3, 2)), 112, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.290' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (5, 1, N'Shahi Kharek Mukhwas', N'Slivered Arabian dry dates seasoned with black salt & roasted coriander.', N'Thinly sliced Arabian dry dates (Kharek) seasoned with a secret blend of black salt, amchur, roasted coriander dal, and digestive spices.', N'/image/ImageforMukhwash/Shahi Kharek.webp', CAST(279.00 AS Decimal(18, 2)), CAST(320.00 AS Decimal(18, 2)), CAST(4.80 AS Decimal(3, 2)), 142, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.303' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (6, 1, N'Jamun Pop Mukhwas', N'Antioxidant-rich black plum fruit pearls with roasted flaxseeds.', N'Crafted from pure antioxidant-dense Indian Jamun pulp combined with roasted flaxseeds and mint pearls.', N'/image/ImageforMukhwash/Jamun Pop.webp', CAST(319.00 AS Decimal(18, 2)), CAST(369.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 132, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.313' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (7, 1, N'Dil Raja Mukhwas', N'Royal 9-ingredient Kathiawadi luxury digestive with silver cardamom.', N'The king of traditional mukhwas! A heritage Kathiawadi recipe featuring white sesame, dill seeds, coriander dal, and silver-coated cardamom.', N'/image/ImageforMukhwash/Dil RAJA.webp', CAST(299.00 AS Decimal(18, 2)), CAST(349.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 178, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.327' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (8, 1, N'Choco Masti Mukhwas', N'Rich chocolate-coated fennel seeds & crunchy colorful sugar pearls.', N'A delightful modern fusion of rich dark cocoa and aromatic roasted fennel seeds, blended with sweet Tutti-Frutti and silver pearls.', N'/image/ImageforMukhwash/Choco Masti.webp', CAST(269.00 AS Decimal(18, 2)), CAST(310.00 AS Decimal(18, 2)), CAST(4.70 AS Decimal(3, 2)), 88, 0, 1, 0, 1, CAST(N'2026-08-24T14:08:05.343' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (9, 1, N'Digest Ease Mukhwas', N'Ayurvedic digestive seed mix crafted to soothe acidity & indigestion.', N'An authentic Ayurvedic digestive mix of roasted coriander seeds (Dhana Dal), dill seeds (Suva), ajwain, black salt, and dry ginger.', N'/image/ImageforMukhwash/Digest Ease.webp', CAST(229.00 AS Decimal(18, 2)), CAST(260.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 145, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.350' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (10, 1, N'Dil Bahaar Mukhwas', N'Aromatic rose gulkand bits, colorful saunf & sweet melon seeds.', N'A fragrant, colorful, and soul-soothing mouth freshener featuring crisp sugar-coated fennel seeds and dried Tutti-Frutti.', N'/image/ImageforMukhwash/Dil Bahaar.webp', CAST(259.00 AS Decimal(18, 2)), CAST(299.00 AS Decimal(18, 2)), CAST(4.80 AS Decimal(3, 2)), 96, 0, 1, 0, 1, CAST(N'2026-08-24T14:08:05.363' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (11, 1, N'Hing Hajma Mukhwas', N'Bandhani asafoetida & black salt digestive pearls for instant gas relief.', N'Authentic Ayurvedic digestive drops made with Bandhani Asafoetida, roasted Cumin, Dry Ginger, and Kala Namak.', N'/image/ImageforMukhwash/Hing Hajma.webp', CAST(219.00 AS Decimal(18, 2)), CAST(250.00 AS Decimal(18, 2)), CAST(4.70 AS Decimal(3, 2)), 104, 0, 1, 0, 1, CAST(N'2026-08-24T14:08:05.377' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (12, 1, N'Paan Gulkand Mukhwas', N'Sweet & cooling rose gulkand with betel leaf infusion.', N'A rich blend of sweet rose Gulkand, slivered betel nuts, coconut, and cooling menthol.', N'/image/ImageforMukhwash/Shahi Pan.webp', CAST(329.00 AS Decimal(18, 2)), CAST(379.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 160, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.387' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (13, 2, N'Royal Rajwadi Tea Masala', N'Aromatic blend of green cardamom, cloves, cinnamon & dry ginger.', N'Traditional Kathiawadi Rajwadi Chai Masala crafted from A-grade whole spices.', N'/image/Tea Masala/TEA MASALA.webp', CAST(199.00 AS Decimal(18, 2)), CAST(249.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 85, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.070' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (14, 2, N'Kesar Elaichi Tea Masala', N'Infused with Kashmiri saffron threads and green cardamom.', N'Luxurious saffron tea masala blend for rich royal morning tea.', N'/image/jamunbottole_clean.webp', CAST(249.00 AS Decimal(18, 2)), CAST(299.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 92, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.107' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (15, 2, N'Kadak Ginger Cinnamon Chai Masala', N'Punchy Sun-dried ginger and Ceylon cinnamon spice boost.', N'Immunity-boosting tea masala perfect for monsoon and winter mornings.', N'/image/jamunbottole_clean.webp', CAST(179.00 AS Decimal(18, 2)), CAST(220.00 AS Decimal(18, 2)), CAST(4.80 AS Decimal(3, 2)), 64, 0, 1, 0, 1, CAST(N'2026-08-24T14:11:16.120' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (16, 3, N'Neem Tulsi Healing Herbal Soap', N'Cold-processed antibacterial soap infused with pure Neem oil & Tulsi.', N'Organic cold-processed soap bar enriched with essential oils to soothe acne and sensitive skin.', N'/image/Soap/neem.webp', CAST(149.00 AS Decimal(18, 2)), CAST(180.00 AS Decimal(18, 2)), CAST(4.80 AS Decimal(3, 2)), 110, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.130' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (17, 3, N'Charcoal Detox Clarifying Soap', N'Activated bamboo charcoal & tea tree oil deep cleansing bar.', N'Pore-cleansing detoxifying natural bar that draws out dirt, excess oil, and impurities.', N'/image/jamunbottole_clean.webp', CAST(169.00 AS Decimal(18, 2)), CAST(199.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 95, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.150' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (18, 3, N'Rose Petal Cream Moisturizing Soap', N'Luxurious wild rose extract and raw shea butter bath bar.', N'Hydrating handmade soap infused with damask rose water and virgin coconut oil.', N'/image/jamunbottole_clean.webp', CAST(159.00 AS Decimal(18, 2)), CAST(189.00 AS Decimal(18, 2)), CAST(4.70 AS Decimal(3, 2)), 78, 0, 1, 0, 1, CAST(N'2026-08-24T14:11:16.163' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (19, 4, N'Bhringraj Ayurvedic Scalp Therapy Oil', N'Kshirapak ayurvedic oil infused with 16 potent herbs for hair growth.', N'Traditional slow-boiled Kshirapak hair oil formulated with Bhringraj, Amla, Brahmi, and sesame oil.', N'/image/Hair Oil/hair oil.webp', CAST(399.00 AS Decimal(18, 2)), CAST(499.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 210, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.173' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (20, 4, N'Onion Seed & Rosemary Hair Elixir', N'Cold-pressed Red Onion seed oil with pure French Rosemary essential oil.', N'Hair growth booster formulated with sulfur-rich red onion extract and pure rosemary oil.', N'/image/jamunbottole_clean.webp', CAST(449.00 AS Decimal(18, 2)), CAST(549.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 175, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.190' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (21, 4, N'Virgin Coconut & Amla Hair Oil', N'100% Cold-pressed coconut oil infused with fresh organic Amla.', N'Deep conditioning root revitalizing hair oil enriched with Vitamin C and natural antioxidants.', N'/image/jamunbottole_clean.webp', CAST(299.00 AS Decimal(18, 2)), CAST(350.00 AS Decimal(18, 2)), CAST(4.80 AS Decimal(3, 2)), 130, 0, 1, 0, 1, CAST(N'2026-08-24T14:11:16.210' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (22, 5, N'Royal Kathiawadi Festivities Box', N'Curated gift set of 4 premium Mukhwas jars & Saffron Rajwadi Tea Masala.', N'Luxury handcrafted wooden gift box containing Kalkatti Pan, Dil Raja, Shahi Kharek, Amla Madhur Mukhwas, and Kesar Tea Masala.', N'/image/jamunbottole_clean.webp', CAST(1299.00 AS Decimal(18, 2)), CAST(1599.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 145, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.223' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (23, 5, N'Herbal Bath & Body Pamper Set', N'Handcrafted 3-soap bar set & Bhringraj Scalp Therapy Oil hamper.', N'Complete holistic spa package featuring Neem, Charcoal, Rose soaps, and Bhringraj hair oil in eco-friendly jute bag packaging.', N'/image/jamunbottole_clean.webp', CAST(999.00 AS Decimal(18, 2)), CAST(1249.00 AS Decimal(18, 2)), CAST(4.90 AS Decimal(3, 2)), 88, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.237' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Product] OFF
GO
SET IDENTITY_INSERT [dbo].[ProductImage] ON 
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (1, 1, N'/image/ImageforMukhwash/Shahi Pan.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:03:12.203' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (2, 2, N'/image/jamunbottole_clean.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:03:12.203' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (3, 3, N'/image/ImageforMukhwash/Kalkatti-Pan 1.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:08:05.283' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (4, 4, N'/image/ImageforMukhwash/Amla Madhur.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:08:05.297' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (5, 5, N'/image/ImageforMukhwash/Shahi Kharek.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:08:05.310' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (6, 6, N'/image/ImageforMukhwash/Jamun Pop.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:08:05.320' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (7, 7, N'/image/ImageforMukhwash/Dil RAJA.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:08:05.337' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (8, 8, N'/image/ImageforMukhwash/Choco Masti.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:08:05.347' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (9, 9, N'/image/ImageforMukhwash/Digest Ease.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:08:05.357' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (10, 10, N'/image/ImageforMukhwash/Dil Bahaar.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:08:05.367' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (11, 11, N'/image/ImageforMukhwash/Hing Hajma.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:08:05.380' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (12, 12, N'/image/ImageforMukhwash/Shahi Pan.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:08:05.390' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (13, 13, N'/image/Tea Masala/TEA MASALA.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.093' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (14, 14, N'/image/jamunbottole_clean.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.113' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (15, 15, N'/image/jamunbottole_clean.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.123' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (16, 16, N'/image/Soap/neem.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.143' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (17, 17, N'/image/jamunbottole_clean.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.157' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (18, 18, N'/image/jamunbottole_clean.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.167' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (19, 19, N'/image/Hair Oil/hair oil.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.180' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (20, 20, N'/image/jamunbottole_clean.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.197' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (21, 21, N'/image/jamunbottole_clean.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.213' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (22, 22, N'/image/jamunbottole_clean.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.230' AS DateTime))
GO
INSERT [dbo].[ProductImage] ([Id], [ProductId], [ImagePath], [DisplayOrder], [IsPrimary], [IsActive], [IsDeleted], [CreatedDate]) VALUES (23, 23, N'/image/jamunbottole_clean.webp', 1, 1, 1, 0, CAST(N'2026-08-24T14:11:16.240' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[ProductImage] OFF
GO
SET IDENTITY_INSERT [dbo].[ProductVariant] ON 
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, 1, N'100g Jar', N'MUK-PAN-100G', CAST(199.00 AS Decimal(18, 2)), CAST(249.00 AS Decimal(18, 2)), 50, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:03:12.200' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, 1, N'250g Jar', N'MUK-PAN-250G', CAST(449.00 AS Decimal(18, 2)), CAST(549.00 AS Decimal(18, 2)), 30, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:03:12.200' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, 2, N'200ml Bottle', N'MUK-JAM-200ML', CAST(299.00 AS Decimal(18, 2)), CAST(349.00 AS Decimal(18, 2)), 40, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:03:12.203' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (4, 2, N'500ml Pack', N'MUK-JAM-500ML', CAST(649.00 AS Decimal(18, 2)), CAST(749.00 AS Decimal(18, 2)), 20, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:03:12.203' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (5, 3, N'100g Jar', N'MUK-KAL-100G', CAST(349.00 AS Decimal(18, 2)), CAST(399.00 AS Decimal(18, 2)), 100, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.273' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (6, 3, N'250g Jar', N'MUK-KAL-250G', CAST(749.00 AS Decimal(18, 2)), CAST(849.00 AS Decimal(18, 2)), 60, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:08:05.280' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (7, 3, N'500g Jar', N'MUK-KAL-500G', CAST(1399.00 AS Decimal(18, 2)), CAST(1599.00 AS Decimal(18, 2)), 40, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:08:05.280' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (8, 4, N'100g Jar', N'MUK-AML-100G', CAST(249.00 AS Decimal(18, 2)), CAST(285.00 AS Decimal(18, 2)), 80, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.293' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (9, 4, N'250g Jar', N'MUK-AML-250G', CAST(549.00 AS Decimal(18, 2)), CAST(620.00 AS Decimal(18, 2)), 50, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:08:05.297' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (10, 5, N'100g Jar', N'MUK-KHA-100G', CAST(279.00 AS Decimal(18, 2)), CAST(320.00 AS Decimal(18, 2)), 90, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.307' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (11, 5, N'250g Jar', N'MUK-KHA-250G', CAST(599.00 AS Decimal(18, 2)), CAST(699.00 AS Decimal(18, 2)), 45, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:08:05.307' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (12, 6, N'100g Jar', N'MUK-JMN-100G', CAST(319.00 AS Decimal(18, 2)), CAST(369.00 AS Decimal(18, 2)), 70, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.317' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (13, 6, N'250g Jar', N'MUK-JMN-250G', CAST(699.00 AS Decimal(18, 2)), CAST(799.00 AS Decimal(18, 2)), 35, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:08:05.317' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (14, 7, N'100g Jar', N'MUK-RAJ-100G', CAST(299.00 AS Decimal(18, 2)), CAST(349.00 AS Decimal(18, 2)), 85, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.330' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (15, 7, N'250g Jar', N'MUK-RAJ-250G', CAST(649.00 AS Decimal(18, 2)), CAST(749.00 AS Decimal(18, 2)), 50, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:08:05.333' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (16, 8, N'100g Jar', N'MUK-CHO-100G', CAST(269.00 AS Decimal(18, 2)), CAST(310.00 AS Decimal(18, 2)), 75, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.343' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (17, 9, N'100g Jar', N'MUK-DIG-100G', CAST(229.00 AS Decimal(18, 2)), CAST(260.00 AS Decimal(18, 2)), 110, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.353' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (18, 10, N'100g Jar', N'MUK-BAH-100G', CAST(259.00 AS Decimal(18, 2)), CAST(299.00 AS Decimal(18, 2)), 65, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.367' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (19, 11, N'100g Jar', N'MUK-HNG-100G', CAST(219.00 AS Decimal(18, 2)), CAST(250.00 AS Decimal(18, 2)), 90, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.377' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (20, 12, N'100g Jar', N'MUK-GLK-100G', CAST(329.00 AS Decimal(18, 2)), CAST(379.00 AS Decimal(18, 2)), 80, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:08:05.387' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (21, 13, N'50g Jar', N'TEA-RAJ-50G', CAST(199.00 AS Decimal(18, 2)), CAST(249.00 AS Decimal(18, 2)), 100, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.090' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (22, 13, N'100g Jar', N'TEA-RAJ-100G', CAST(349.00 AS Decimal(18, 2)), CAST(420.00 AS Decimal(18, 2)), 60, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:11:16.090' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (23, 14, N'50g Jar', N'TEA-KSR-50G', CAST(249.00 AS Decimal(18, 2)), CAST(299.00 AS Decimal(18, 2)), 80, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.110' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (24, 14, N'100g Jar', N'TEA-KSR-100G', CAST(449.00 AS Decimal(18, 2)), CAST(520.00 AS Decimal(18, 2)), 40, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:11:16.110' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (25, 15, N'50g Pack', N'TEA-GNG-50G', CAST(179.00 AS Decimal(18, 2)), CAST(220.00 AS Decimal(18, 2)), 90, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.123' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (26, 16, N'100g Bar', N'SOP-NEM-100G', CAST(149.00 AS Decimal(18, 2)), CAST(180.00 AS Decimal(18, 2)), 120, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.137' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (27, 16, N'Pack of 3', N'SOP-NEM-3PK', CAST(399.00 AS Decimal(18, 2)), CAST(480.00 AS Decimal(18, 2)), 50, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:11:16.140' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (28, 17, N'100g Bar', N'SOP-CHR-100G', CAST(169.00 AS Decimal(18, 2)), CAST(199.00 AS Decimal(18, 2)), 90, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.153' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (29, 17, N'Pack of 2', N'SOP-CHR-2PK', CAST(299.00 AS Decimal(18, 2)), CAST(360.00 AS Decimal(18, 2)), 40, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:11:16.157' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (30, 18, N'100g Bar', N'SOP-ROS-100G', CAST(159.00 AS Decimal(18, 2)), CAST(189.00 AS Decimal(18, 2)), 100, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.163' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (31, 19, N'100ml Bottle', N'OIL-BHR-100ML', CAST(399.00 AS Decimal(18, 2)), CAST(499.00 AS Decimal(18, 2)), 80, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.177' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (32, 19, N'200ml Bottle', N'OIL-BHR-200ML', CAST(699.00 AS Decimal(18, 2)), CAST(849.00 AS Decimal(18, 2)), 45, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:11:16.180' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (33, 20, N'100ml Bottle', N'OIL-ONI-100ML', CAST(449.00 AS Decimal(18, 2)), CAST(549.00 AS Decimal(18, 2)), 70, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.190' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (34, 20, N'200ml Bottle', N'OIL-ONI-200ML', CAST(799.00 AS Decimal(18, 2)), CAST(949.00 AS Decimal(18, 2)), 35, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:11:16.193' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (35, 21, N'100ml Bottle', N'OIL-COC-100ML', CAST(299.00 AS Decimal(18, 2)), CAST(350.00 AS Decimal(18, 2)), 95, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.210' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (36, 22, N'Standard Gift Box', N'GFT-ROY-STD', CAST(1299.00 AS Decimal(18, 2)), CAST(1599.00 AS Decimal(18, 2)), 40, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.227' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (37, 22, N'Luxury Wooden Box', N'GFT-ROY-LUX', CAST(1899.00 AS Decimal(18, 2)), CAST(2199.00 AS Decimal(18, 2)), 20, 1, 0, 1, 0, 1, CAST(N'2026-08-24T14:11:16.230' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (38, 23, N'Complete Spa Set', N'GFT-SPA-SET', CAST(999.00 AS Decimal(18, 2)), CAST(1249.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-24T14:11:16.240' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[ProductVariant] OFF
GO
SET IDENTITY_INSERT [dbo].[Role] ON 
GO
INSERT [dbo].[Role] ([RoleId], [RoleName], [RoleCode], [Description], [IsSystemRole], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, N'Super Admin', N'SUPER_ADMIN', N'Full access system administrator', 1, 1, 0, NULL, CAST(N'2026-08-24T15:59:54.3985095' AS DateTime2), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Role] OFF
GO
SET IDENTITY_INSERT [dbo].[RoleMenuPermission] ON 
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, 1, 1, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-24T15:59:55.1389600' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, 1, 2, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-24T15:59:55.1859637' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, 1, 3, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-24T15:59:55.1864310' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (4, 1, 4, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-24T15:59:55.1865941' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (5, 1, 5, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-24T15:59:55.1867517' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (6, 1, 6, 1, 1, 1, 1, 1, NULL, CAST(N'2026-08-24T15:59:55.1869367' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[RoleMenuPermission] ([PermissionId], [RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CanExport], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (8, 1, 7, 1, 1, 1, 1, 1, 1, CAST(N'2026-08-24T18:36:48.2566667' AS DateTime2), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[RoleMenuPermission] OFF
GO
SET IDENTITY_INSERT [dbo].[User] ON 
GO
INSERT [dbo].[User] ([UserId], [FirstName], [LastName], [Email], [MobileNo], [PasswordHash], [ProfileImagePath], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, N'Vishal', N'Gami', N'vmgami33333@gmail.com', N'9876543210', N'admin123', NULL, 1, 0, NULL, CAST(N'2026-08-24T15:59:54.7320448' AS DateTime2), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[User] OFF
GO
SET IDENTITY_INSERT [dbo].[UserRole] ON 
GO
INSERT [dbo].[UserRole] ([Id], [UserId], [RoleId], [AssignedDate], [AssignedBy]) VALUES (1, 1, 1, CAST(N'2026-08-24T15:59:54.8727189' AS DateTime2), NULL)
GO
SET IDENTITY_INSERT [dbo].[UserRole] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Role__D62CB59C09888C87]    Script Date: 24-Aug-26 7:19:48 PM ******/
ALTER TABLE [dbo].[Role] ADD UNIQUE NONCLUSTERED 
(
	[RoleCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__User__A9D10534800151D4]    Script Date: 24-Aug-26 7:19:48 PM ******/
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
