USE [hiyaghar]
GO
/****** Object:  Table [dbo].[__EFMigrationsHistory]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[Attribute]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[AttributeValue]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[Category]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[Customer]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[HomePageComponent]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[HomePageComponentItem]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[Menus]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[Product]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[ProductImage]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[ProductVariant]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[ProductVariantDetails]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[ProductVariantMapping]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[Role]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[RoleMenuPermission]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[User]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
/****** Object:  Table [dbo].[UserRole]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
INSERT [dbo].[Attribute] ([Id], [Name], [DisplayName], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, N'Weight', N'Weight', 1, 0, NULL, CAST(N'2026-08-26T15:54:26.880' AS DateTime), NULL, CAST(N'2026-08-26T16:06:41.997' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Attribute] OFF
GO
SET IDENTITY_INSERT [dbo].[AttributeValue] ON 
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, 1, N'100 g', 1, 1, NULL, CAST(N'2026-08-26T15:54:26.880' AS DateTime), NULL, CAST(N'2026-08-26T16:06:41.997' AS DateTime))
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, 1, N'200 g', 1, 1, NULL, CAST(N'2026-08-26T15:54:26.880' AS DateTime), NULL, CAST(N'2026-08-26T16:06:41.997' AS DateTime))
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, 1, N'50 g', 1, 0, NULL, CAST(N'2026-08-26T16:06:41.997' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (4, 1, N'100 g', 1, 0, NULL, CAST(N'2026-08-26T16:06:41.997' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (5, 1, N'150', 1, 0, NULL, CAST(N'2026-08-26T16:06:41.997' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[AttributeValue] ([Id], [AttributeId], [Value], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (6, 1, N'200 g', 1, 0, NULL, CAST(N'2026-08-26T16:06:41.997' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[AttributeValue] OFF
GO
SET IDENTITY_INSERT [dbo].[Category] ON 
GO
INSERT [dbo].[Category] ([Id], [CategoryName], [ParentCategoryId], [ImagePath], [SKU], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate], [Description]) VALUES (1, N'Mukhwas', 0, N'/uploads/category/a6a63722-627e-4c2a-b4ad-a8df3cc021e7.webp', N'CAT-1787739621623', 1, 0, 1, CAST(N'2026-08-26T15:50:21.750' AS DateTime), NULL, NULL, NULL)
GO
INSERT [dbo].[Category] ([Id], [CategoryName], [ParentCategoryId], [ImagePath], [SKU], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate], [Description]) VALUES (2, N'Tea Masala', 0, N'/uploads/category/077f3e4d-7ebb-44f7-92d7-047fca964dcc.webp', N'CAT-1787739680503', 1, 0, 1, CAST(N'2026-08-26T15:51:20.647' AS DateTime), NULL, NULL, NULL)
GO
INSERT [dbo].[Category] ([Id], [CategoryName], [ParentCategoryId], [ImagePath], [SKU], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate], [Description]) VALUES (3, N'Handmade Soap', 0, N'/uploads/category/241aaf4e-7291-46a8-a8c1-619418f0327b.webp', N'CAT-1787739720953', 1, 0, 1, CAST(N'2026-08-26T15:52:00.960' AS DateTime), NULL, CAST(N'2026-08-26T15:52:58.413' AS DateTime), NULL)
GO
INSERT [dbo].[Category] ([Id], [CategoryName], [ParentCategoryId], [ImagePath], [SKU], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate], [Description]) VALUES (4, N'Hair Oil', 0, N'/uploads/category/b3724173-0004-4102-a08a-fb0c0c6c66e5.webp', N'CAT-1787739763143', 1, 0, 1, CAST(N'2026-08-26T15:52:43.153' AS DateTime), NULL, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Category] OFF
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
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (8, 0, N'HomePageComponent', N'HomePageComponent', N'fa-solid fa-puzzle-piece', 8, 1, 1, 0, NULL, CAST(N'2026-08-25T11:55:36.667' AS DateTime), NULL, CAST(N'2026-08-26T13:31:18.937' AS DateTime))
GO
INSERT [dbo].[Menus] ([MenuId], [ParentId], [Controller], [Name], [Icon], [DisplayOrder], [SuperAdmin], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (9, 0, N'TestMenu', N'TestMenu', N'fa-solid fa-puzzle-piece', 9, 1, 1, 1, NULL, CAST(N'2026-08-25T12:13:42.637' AS DateTime), NULL, CAST(N'2026-08-25T13:46:49.117' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Menus] OFF
GO
SET IDENTITY_INSERT [dbo].[Product] ON 
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, 3, N'Beet Radiance Handmade Beetroot Soap', NULL, NULL, N'/uploads/product/9275e310-2612-4c49-b2b2-2d5f55398333.webp', CAST(160.00 AS Decimal(18, 2)), CAST(85.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T15:55:50.580' AS DateTime), NULL, CAST(N'2026-08-26T16:00:57.470' AS DateTime))
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, 3, N'Glow Craft Detan Soap', NULL, NULL, N'/uploads/product/9b28c220-9dc8-4526-b783-7855341b533d.webp', CAST(190.00 AS Decimal(18, 2)), CAST(90.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:02:05.980' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, 3, N'Kesudo Radiance', NULL, NULL, N'/uploads/product/5a4048a0-62d9-4583-acf9-7418dbcf06f1.webp', CAST(130.00 AS Decimal(18, 2)), CAST(70.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:02:56.267' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (4, 3, N'Neem Aloe Fresh', NULL, NULL, N'/uploads/product/44004e16-665a-4a2d-9a1c-66e0fba2fa41.webp', CAST(130.00 AS Decimal(18, 2)), CAST(70.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:03:35.520' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (5, 3, N'Rice & Potato Bliss', NULL, NULL, N'/uploads/product/e535adaf-32f2-4e29-9cbc-e8515b33f8d3.webp', CAST(290.00 AS Decimal(18, 2)), CAST(190.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:04:14.913' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (6, 4, N'Keshvedaam Herbal Hair Oil', NULL, NULL, N'/uploads/product/90ec0777-f5b3-43b5-9117-790f2ea54fd3.webp', CAST(250.00 AS Decimal(18, 2)), CAST(209.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:05:19.430' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (7, 2, N'Tea Masala', NULL, NULL, N'/uploads/product/84c5cf8d-ae4d-4669-8606-ffd26c68f657.webp', CAST(0.00 AS Decimal(18, 2)), CAST(80.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:07:46.250' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (8, 1, N'Chocolate Mukhwas', NULL, NULL, N'/uploads/product/e2c0dbab-de1c-4e29-b59e-b070461e14f9.webp', CAST(0.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:10:26.533' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (9, 1, N'Dhana Dal Mukhwas', NULL, NULL, N'/uploads/product/8c05b7dc-85be-4564-9380-23eb3d229e24.webp', CAST(0.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:13:21.527' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (10, 1, N'Digestive', NULL, NULL, N'/uploads/product/85996ac3-7359-4ae5-a3bc-95777d2fa986.webp', CAST(60.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:14:54.760' AS DateTime), NULL, CAST(N'2026-08-26T16:18:13.770' AS DateTime))
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (11, 1, N'Dil Khush', NULL, NULL, N'/uploads/product/ff596bc3-a6ef-4f72-bb90-0ae7c85bf1cc.webp', CAST(60.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:15:43.210' AS DateTime), NULL, CAST(N'2026-08-26T16:17:52.573' AS DateTime))
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (12, 1, N'Dil Rajan Mukhwas', NULL, NULL, N'/uploads/product/a4b31b11-ec70-4d97-bdf0-0d7bf1b8b8df.webp', CAST(0.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:16:43.530' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Product] ([Id], [CategoryId], [ProductName], [ShortDescription], [FullDescription], [MainImagePath], [BasePrice], [DiscountPrice], [Rating], [ReviewCount], [IsFeatured], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (13, 1, N'Drakhsha Wati Mukhwas', NULL, NULL, N'/uploads/product/040e395d-ad7c-476f-909d-6a6038f58d4d.webp', CAST(0.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), CAST(5.00 AS Decimal(3, 2)), 0, 0, 1, 0, 1, CAST(N'2026-08-26T16:17:37.040' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Product] OFF
GO
SET IDENTITY_INSERT [dbo].[ProductVariant] ON 
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, 1, N'No Variant', N'SKU-3143', CAST(85.00 AS Decimal(18, 2)), CAST(160.00 AS Decimal(18, 2)), 30, 1, 1, 1, 1, 1, CAST(N'2026-08-26T15:55:50.587' AS DateTime), NULL, CAST(N'2026-08-26T15:55:58.213' AS DateTime))
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, 1, N'Weight: No Variant', N'SKU-3143', CAST(85.00 AS Decimal(18, 2)), CAST(160.00 AS Decimal(18, 2)), 30, 1, 1, 1, 1, 1, CAST(N'2026-08-26T15:55:58.213' AS DateTime), NULL, CAST(N'2026-08-26T16:00:57.477' AS DateTime))
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (3, 1, N'Weight: No Variant', N'SKU-3143', CAST(85.00 AS Decimal(18, 2)), CAST(160.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:00:57.477' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (4, 2, N'No Variant', N'SKU-6886', CAST(90.00 AS Decimal(18, 2)), CAST(190.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:02:05.987' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (5, 3, N'No Variant', N'SKU-4318', CAST(70.00 AS Decimal(18, 2)), CAST(130.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:02:56.273' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (6, 4, N'No Variant', N'SKU-2240', CAST(70.00 AS Decimal(18, 2)), CAST(130.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:03:35.530' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (7, 5, N'No Variant', N'SKU-8430', CAST(190.00 AS Decimal(18, 2)), CAST(290.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:04:14.920' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (8, 6, N'No Variant', N'SKU-2870', CAST(209.00 AS Decimal(18, 2)), CAST(250.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:05:19.440' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (9, 7, N'Weight: 50 g', N'SKU-1078', CAST(80.00 AS Decimal(18, 2)), CAST(80.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:07:46.267' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (10, 7, N'Weight: 100 g', N'SKU-2166', CAST(160.00 AS Decimal(18, 2)), CAST(160.00 AS Decimal(18, 2)), 30, 1, 0, 1, 0, 1, CAST(N'2026-08-26T16:07:46.267' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (11, 7, N'Weight: 150', N'SKU-2991', CAST(300.00 AS Decimal(18, 2)), CAST(300.00 AS Decimal(18, 2)), 30, 1, 0, 1, 0, 1, CAST(N'2026-08-26T16:07:46.267' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (12, 8, N'Weight: 100 g', N'SKU-7814', CAST(60.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:10:26.593' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (13, 8, N'Weight: 200 g', N'SKU-9597', CAST(120.00 AS Decimal(18, 2)), CAST(120.00 AS Decimal(18, 2)), 30, 1, 0, 1, 0, 1, CAST(N'2026-08-26T16:10:26.593' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (14, 9, N'Weight: 100 g', N'SKU-2213', CAST(60.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:13:21.570' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (15, 9, N'Weight: 200 g', N'SKU-3758', CAST(120.00 AS Decimal(18, 2)), CAST(120.00 AS Decimal(18, 2)), 30, 1, 0, 1, 0, 1, CAST(N'2026-08-26T16:13:21.573' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (16, 10, N'Weight: 100 g', N'SKU-9397', CAST(60.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), 0, 1, 1, 1, 1, 1, CAST(N'2026-08-26T16:14:54.770' AS DateTime), NULL, CAST(N'2026-08-26T16:18:13.787' AS DateTime))
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (17, 10, N'Weight: 200 g', N'SKU-0413', CAST(120.00 AS Decimal(18, 2)), CAST(120.00 AS Decimal(18, 2)), 0, 1, 0, 1, 1, 1, CAST(N'2026-08-26T16:14:54.770' AS DateTime), NULL, CAST(N'2026-08-26T16:18:13.787' AS DateTime))
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (18, 11, N'Weight: 100 g', N'SKU-3509', CAST(60.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), 0, 1, 1, 1, 1, 1, CAST(N'2026-08-26T16:15:43.243' AS DateTime), NULL, CAST(N'2026-08-26T16:17:52.580' AS DateTime))
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (19, 11, N'Weight: 200 g', N'SKU-3933', CAST(120.00 AS Decimal(18, 2)), CAST(120.00 AS Decimal(18, 2)), 0, 1, 0, 1, 1, 1, CAST(N'2026-08-26T16:15:43.243' AS DateTime), NULL, CAST(N'2026-08-26T16:17:52.580' AS DateTime))
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (20, 12, N'Weight: 100 g', N'SKU-2805', CAST(60.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:16:43.553' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (21, 12, N'Weight: 200 g', N'SKU-5845', CAST(120.00 AS Decimal(18, 2)), CAST(120.00 AS Decimal(18, 2)), 30, 1, 0, 1, 0, 1, CAST(N'2026-08-26T16:16:43.553' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (22, 13, N'Weight: 100 g', N'SKU-9133', CAST(60.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), 50, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:17:37.060' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (23, 13, N'Weight: 200 g', N'SKU-2325', CAST(120.00 AS Decimal(18, 2)), CAST(120.00 AS Decimal(18, 2)), 50, 1, 0, 1, 0, 1, CAST(N'2026-08-26T16:17:37.063' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (24, 11, N'Weight: 100 g', N'SKU-3509', CAST(60.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), 50, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:17:52.580' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (25, 11, N'Weight: 200 g', N'SKU-3933', CAST(120.00 AS Decimal(18, 2)), CAST(120.00 AS Decimal(18, 2)), 50, 1, 0, 1, 0, 1, CAST(N'2026-08-26T16:17:52.580' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (26, 10, N'Weight: 100 g', N'SKU-9397', CAST(60.00 AS Decimal(18, 2)), CAST(60.00 AS Decimal(18, 2)), 30, 1, 1, 1, 0, 1, CAST(N'2026-08-26T16:18:13.787' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[ProductVariant] ([Id], [ProductId], [VariantName], [SKU], [Price], [OriginalPrice], [StockQuantity], [IsInStock], [IsDefault], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (27, 10, N'Weight: 200 g', N'SKU-0413', CAST(120.00 AS Decimal(18, 2)), CAST(120.00 AS Decimal(18, 2)), 30, 1, 0, 1, 0, 1, CAST(N'2026-08-26T16:18:13.787' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[ProductVariant] OFF
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
INSERT [dbo].[User] ([UserId], [FirstName], [LastName], [Email], [MobileNo], [PasswordHash], [ProfileImagePath], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (1, N'Gami', N'Vishal', N'vmgami33333@gmail.com', N'9510212154', N'admin123', NULL, 1, 0, NULL, CAST(N'2026-08-24T15:59:54.7320448' AS DateTime2), NULL, CAST(N'2026-08-26T15:47:10.7616789' AS DateTime2))
GO
INSERT [dbo].[User] ([UserId], [FirstName], [LastName], [Email], [MobileNo], [PasswordHash], [ProfileImagePath], [IsActive], [IsDeleted], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) VALUES (2, N'gami', N'VISHAL', N'vmgami2001@gmail.com', N'9510212154', N'admin@123', NULL, 1, 0, NULL, CAST(N'2026-08-25T13:57:06.6392051' AS DateTime2), NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[User] OFF
GO
SET IDENTITY_INSERT [dbo].[UserRole] ON 
GO
INSERT [dbo].[UserRole] ([Id], [UserId], [RoleId], [AssignedDate], [AssignedBy]) VALUES (4, 2, 3, CAST(N'2026-08-25T13:57:06.6610028' AS DateTime2), NULL)
GO
INSERT [dbo].[UserRole] ([Id], [UserId], [RoleId], [AssignedDate], [AssignedBy]) VALUES (5, 1, 1, CAST(N'2026-08-26T15:47:10.8048229' AS DateTime2), NULL)
GO
SET IDENTITY_INSERT [dbo].[UserRole] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Role__D62CB59C09888C87]    Script Date: 26-Aug-26 5:28:27 PM ******/
ALTER TABLE [dbo].[Role] ADD UNIQUE NONCLUSTERED 
(
	[RoleCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__User__A9D10534800151D4]    Script Date: 26-Aug-26 5:28:27 PM ******/
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
