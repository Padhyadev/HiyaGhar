using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hiya2.Server.Migrations
{
    /// <inheritdoc />
    /// <remarks>
    /// The model snapshot also picked up tables/columns that are created by the raw SQL block in
    /// Program.cs rather than by migrations (ContactQuery, Faq, NewsletterSubscriber,
    /// ShippingSetting, and the Order courier/Razorpay columns). Those operations were removed
    /// from this migration so it doesn't fail with "already exists" on databases that have them.
    /// </remarks>
    public partial class AddVariantImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Superseded by the (ProductId, VariantId) index below. Guarded in case the
            // database was built from a SQL dump without it.
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProductImage_ProductId' AND object_id = OBJECT_ID('dbo.ProductImage'))
    DROP INDEX [IX_ProductImage_ProductId] ON [dbo].[ProductImage];");

            migrationBuilder.AddColumn<int>(
                name: "VariantId",
                table: "ProductImage",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "OrderItem",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductImage_ProductId_VariantId",
                table: "ProductImage",
                columns: new[] { "ProductId", "VariantId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductImage_VariantId",
                table: "ProductImage",
                column: "VariantId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductImage_ProductVariant_VariantId",
                table: "ProductImage",
                column: "VariantId",
                principalTable: "ProductVariant",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductImage_ProductVariant_VariantId",
                table: "ProductImage");

            migrationBuilder.DropIndex(
                name: "IX_ProductImage_ProductId_VariantId",
                table: "ProductImage");

            migrationBuilder.DropIndex(
                name: "IX_ProductImage_VariantId",
                table: "ProductImage");

            migrationBuilder.DropColumn(
                name: "VariantId",
                table: "ProductImage");

            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "OrderItem");

            migrationBuilder.CreateIndex(
                name: "IX_ProductImage_ProductId",
                table: "ProductImage",
                column: "ProductId");
        }
    }
}
