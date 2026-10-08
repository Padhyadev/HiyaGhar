using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hiya2.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddLovCategoryTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LovCategory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LovColumn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DisplayText = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<long>(type: "bigint", nullable: true),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LovCategory", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LovCategory_LovColumn",
                table: "LovCategory",
                column: "LovColumn",
                unique: true);

            // The "OrderStatus" category already exists (with 14 code rows in
            // LovMaster) from the earlier migration - give it a category
            // record here too so it doesn't disappear from the category list.
            migrationBuilder.InsertData(
                table: "LovCategory",
                columns: new[] { "LovColumn", "DisplayText", "IsActive", "IsDeleted", "CreatedDate" },
                values: new object[] { "OrderStatus", "Order Status", true, false, DateTime.Now });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LovCategory");
        }
    }
}
