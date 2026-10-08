using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hiya2.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddStockReservationSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StockQuantity",
                table: "ProductVariant",
                newName: "AvailableStock");

            migrationBuilder.AddColumn<int>(
                name: "ReservedStock",
                table: "ProductVariant",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LowStockThreshold",
                table: "ProductVariant",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProductStockHistory",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    VariantId = table.Column<int>(type: "int", nullable: false),
                    ChangeType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuantityChanged = table.Column<int>(type: "int", nullable: false),
                    PreviousStock = table.Column<int>(type: "int", nullable: false),
                    NewStock = table.Column<int>(type: "int", nullable: false),
                    ReferenceId = table.Column<long>(type: "bigint", nullable: true),
                    ReferenceType = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChangedBy = table.Column<long>(type: "bigint", nullable: true),
                    ChangedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductStockHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductStockHistory_ProductVariant_VariantId",
                        column: x => x.VariantId,
                        principalTable: "ProductVariant",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductStockHistory_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StockReservation",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<long>(type: "bigint", nullable: false),
                    CartItemId = table.Column<long>(type: "bigint", nullable: true),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    VariantId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ReservedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReleasedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OrderId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockReservation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StockReservation_Customer_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customer",
                        principalColumn: "CustomerId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StockReservation_ProductVariant_VariantId",
                        column: x => x.VariantId,
                        principalTable: "ProductVariant",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StockReservation_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StockSetting",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DefaultLowStockThreshold = table.Column<int>(type: "int", nullable: false),
                    ReservationExpiryMinutes = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    LastModifiedBy = table.Column<long>(type: "bigint", nullable: true),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockSetting", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductStockHistory_ProductId_VariantId_ChangedDate",
                table: "ProductStockHistory",
                columns: new[] { "ProductId", "VariantId", "ChangedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductStockHistory_ReferenceType_ReferenceId",
                table: "ProductStockHistory",
                columns: new[] { "ReferenceType", "ReferenceId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductStockHistory_VariantId",
                table: "ProductStockHistory",
                column: "VariantId");

            migrationBuilder.CreateIndex(
                name: "IX_StockReservation_CustomerId_ProductId_VariantId_Status",
                table: "StockReservation",
                columns: new[] { "CustomerId", "ProductId", "VariantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_StockReservation_OrderId",
                table: "StockReservation",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_StockReservation_ProductId",
                table: "StockReservation",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_StockReservation_Status_ExpiresAt",
                table: "StockReservation",
                columns: new[] { "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_StockReservation_VariantId",
                table: "StockReservation",
                column: "VariantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductStockHistory");

            migrationBuilder.DropTable(
                name: "StockReservation");

            migrationBuilder.DropTable(
                name: "StockSetting");

            migrationBuilder.DropColumn(
                name: "ReservedStock",
                table: "ProductVariant");

            migrationBuilder.DropColumn(
                name: "LowStockThreshold",
                table: "ProductVariant");

            migrationBuilder.RenameColumn(
                name: "AvailableStock",
                table: "ProductVariant",
                newName: "StockQuantity");
        }
    }
}
