using Hiya2.Server.Models;

namespace Hiya2.Server.Services
{
    public class CoinValidationResult
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal CoinDiscountAmount { get; set; }
    }

    public interface IRewardService
    {
        Task<RewardSetting> GetSettingsAsync();
        Task<(int Balance, List<RewardTransaction> Transactions)> GetLedgerAsync(long customerId);

        // Used inside the checkout transaction.
        Task<CoinValidationResult> ValidateCoinUsageAsync(long customerId, int coinsRequested, decimal amountAfterDiscount);
        Task DebitCoinsAsync(long customerId, int coins, long orderId);
        Task CreditForDeliveredOrderAsync(long customerId, long orderId, decimal orderFinalAmount);
        Task RefundCoinsForOrderAsync(long orderId);

        // Signup / login / referral bonuses - all no-ops if the configured amount is <= 0,
        // and idempotent per customer (signup/referral) or per calendar day (login).
        Task<int> CreditSignupBonusAsync(long customerId);
        Task<int> CreditDailyLoginBonusAsync(long customerId);
        Task<(int ReferrerCoins, int JoineeCoins)> CreditReferralBonusAsync(long newCustomerId, long referrerCustomerId);

        // Admin manual grant.
        Task<CoinValidationResult> AdminCreditAsync(long customerId, int coins, string remarks, long actorStaffId);

        // Admin-only ledger lookup for an arbitrary customer (distinct from the self-service
        // GetLedgerAsync above, which is only ever called with the JWT's own CustomerId).
        Task<(int Balance, List<RewardTransaction> Transactions)> GetLedgerForAdminAsync(long customerId);
    }
}
