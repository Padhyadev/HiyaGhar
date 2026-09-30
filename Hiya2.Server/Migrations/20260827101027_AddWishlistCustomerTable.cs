using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hiya2.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddWishlistCustomerTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WishlistCustomer",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<long>(type: "bigint", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    VariantId = table.Column<int>(type: "int", nullable: true),
                    PackingType = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<long>(type: "bigint", nullable: true),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WishlistCustomer", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WishlistCustomer_Customer_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customer",
                        principalColumn: "CustomerId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WishlistCustomer_ProductVariant_VariantId",
                        column: x => x.VariantId,
                        principalTable: "ProductVariant",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_WishlistCustomer_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WishlistCustomer_CustomerId_ProductId_VariantId_PackingType",
                table: "WishlistCustomer",
                columns: new[] { "CustomerId", "ProductId", "VariantId", "PackingType" },
                unique: true,
                filter: "[VariantId] IS NOT NULL AND [PackingType] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_WishlistCustomer_ProductId",
                table: "WishlistCustomer",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_WishlistCustomer_VariantId",
                table: "WishlistCustomer",
                column: "VariantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WishlistCustomer");
        }
    }
}
