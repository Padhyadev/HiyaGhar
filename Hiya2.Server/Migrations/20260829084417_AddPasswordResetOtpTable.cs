using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hiya2.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetOtpTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: The auto-scaffolded version of this migration also contained
            // AddColumn operations for User.Username and Customer.Username -
            // pre-existing schema drift (those columns were added out-of-band
            // directly against the database in earlier work, same as the
            // CustomerAddress/Attribute/AttributeValue gap documented in
            // 20260827085221_AddCommerceTables.cs) that is already applied
            // everywhere this app runs. Intentionally omitted here so this
            // migration is scoped to only the genuinely new PasswordResetOtp table.

            migrationBuilder.CreateTable(
                name: "PasswordResetOtp",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<long>(type: "bigint", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OtpCode = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResetOtp", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PasswordResetOtp");
        }
    }
}
