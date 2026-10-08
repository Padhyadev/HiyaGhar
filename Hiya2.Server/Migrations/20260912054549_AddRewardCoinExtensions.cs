using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hiya2.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddRewardCoinExtensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "RewardTransaction",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReferralJoinCoins",
                table: "RewardSetting",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ReferralCode",
                table: "Customer",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ReferredByCustomerId",
                table: "Customer",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Customer_ReferralCode",
                table: "Customer",
                column: "ReferralCode",
                unique: true,
                filter: "[ReferralCode] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Customer_ReferralCode",
                table: "Customer");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "RewardTransaction");

            migrationBuilder.DropColumn(
                name: "ReferralJoinCoins",
                table: "RewardSetting");

            migrationBuilder.DropColumn(
                name: "ReferralCode",
                table: "Customer");

            migrationBuilder.DropColumn(
                name: "ReferredByCustomerId",
                table: "Customer");
        }
    }
}
