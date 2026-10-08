using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hiya2.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddLovMasterTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LovMaster",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LovColumn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LovCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LovDesc = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<long>(type: "bigint", nullable: true),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LovMaster", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LovMaster_LovColumn_LovCode",
                table: "LovMaster",
                columns: new[] { "LovColumn", "LovCode" },
                unique: true);

            // Seed OrderStatus display labels - matches the current hardcoded
            // defaults exactly, so behavior is identical until an admin edits
            // a row here. LovCode values match OrderStatus enum member names.
            migrationBuilder.InsertData(
                table: "LovMaster",
                columns: new[] { "LovColumn", "LovCode", "LovDesc", "DisplayOrder", "IsActive", "IsDeleted", "CreatedDate" },
                values: new object[,]
                {
                    { "OrderStatus", "Placed", "Placed", 1, true, false, DateTime.Now },
                    { "OrderStatus", "Confirmed", "Confirmed", 2, true, false, DateTime.Now },
                    { "OrderStatus", "Processing", "Processing", 3, true, false, DateTime.Now },
                    { "OrderStatus", "Packed", "Packed", 4, true, false, DateTime.Now },
                    { "OrderStatus", "Shipped", "Shipped", 5, true, false, DateTime.Now },
                    { "OrderStatus", "OutForDelivery", "Out for Delivery", 6, true, false, DateTime.Now },
                    { "OrderStatus", "Delivered", "Delivered", 7, true, false, DateTime.Now },
                    { "OrderStatus", "CancelRequested", "Cancellation Requested", 8, true, false, DateTime.Now },
                    { "OrderStatus", "Cancelled", "Cancelled", 9, true, false, DateTime.Now },
                    { "OrderStatus", "ReturnRequested", "Return Requested", 10, true, false, DateTime.Now },
                    { "OrderStatus", "Returned", "Returned", 11, true, false, DateTime.Now },
                    { "OrderStatus", "RefundInitiated", "Refund Initiated", 12, true, false, DateTime.Now },
                    { "OrderStatus", "Refunded", "Refunded", 13, true, false, DateTime.Now },
                    { "OrderStatus", "CancelRejected", "Cancellation Rejected", 14, true, false, DateTime.Now },
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LovMaster");
        }
    }
}
