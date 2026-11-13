using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Hiya2.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddGiftingAndRemoveGiftHamper : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GiftHamperOccasionProduct");

            migrationBuilder.DropTable(
                name: "GiftHamperOccasion");

            migrationBuilder.AddColumn<int>(
                name: "GiftUnits",
                table: "ProductVariant",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<decimal>(
                name: "GiftCharge",
                table: "Order",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "GiftBox",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GiftBox", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrderGift",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<long>(type: "bigint", nullable: false),
                    GiftType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    BoxCount = table.Column<int>(type: "int", nullable: false),
                    BoxSummary = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    BoxesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChargePerBox = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalCharge = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PhotoOriginalPath = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    PhotoPath = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    MessageJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MessageText = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    InsertPdfPath = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    IsForSelf = table.Column<bool>(type: "bit", nullable: false),
                    RecipientName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    RecipientPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderGift", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderGift_Order_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "GiftBox",
                columns: new[] { "Id", "Capacity", "CreatedDate", "DisplayOrder", "IsActive", "IsDeleted", "LastModifiedDate", "Name" },
                values: new object[,]
                {
                    { 1, 2, new DateTime(2026, 11, 13, 0, 0, 0, 0, DateTimeKind.Unspecified), 1, true, false, null, "Small Box" },
                    { 2, 4, new DateTime(2026, 11, 13, 0, 0, 0, 0, DateTimeKind.Unspecified), 2, true, false, null, "Medium Box" },
                    { 3, 6, new DateTime(2026, 11, 13, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, true, false, null, "Large Box" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderGift_OrderId",
                table: "OrderGift",
                column: "OrderId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GiftBox");

            migrationBuilder.DropTable(
                name: "OrderGift");

            migrationBuilder.DropColumn(
                name: "GiftUnits",
                table: "ProductVariant");

            migrationBuilder.DropColumn(
                name: "GiftCharge",
                table: "Order");

            migrationBuilder.CreateTable(
                name: "GiftHamperOccasion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BannerImagePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    LastModifiedBy = table.Column<int>(type: "int", nullable: true),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GiftHamperOccasion", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GiftHamperOccasionProduct",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OccasionId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GiftHamperOccasionProduct", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GiftHamperOccasionProduct_GiftHamperOccasion_OccasionId",
                        column: x => x.OccasionId,
                        principalTable: "GiftHamperOccasion",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GiftHamperOccasionProduct_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GiftHamperOccasion_Slug",
                table: "GiftHamperOccasion",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GiftHamperOccasionProduct_OccasionId_ProductId",
                table: "GiftHamperOccasionProduct",
                columns: new[] { "OccasionId", "ProductId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GiftHamperOccasionProduct_ProductId",
                table: "GiftHamperOccasionProduct",
                column: "ProductId");
        }
    }
}
