using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Services
{
    public class RewardService : IRewardService
    {
        private readonly DataContext _context;

        public RewardService(DataContext context)
        {
            _context = context;
        }

        public async Task<RewardSetting> GetSettingsAsync()
        {
            var settings = await _context.RewardSettings.FirstOrDefaultAsync(s => s.IsActive);
            if (settings != null)
            {
                return settings;
            }

            // Sensible defaults if nothing has been configured by an admin yet.
            return new RewardSetting
            {
                SignupCoins = 0,
                LoginCoins = 0,
                ReferralCoins = 0,
                CoinToRupeeRate = 1,
                MaxCoinUsagePercent = 10,
                IsActive = true
            };
        }

        public async Task<(int Balance, List<RewardTransaction> Transactions)> GetLedgerAsync(long customerId)
        {
            var customer = await _context.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.CustomerId == customerId);
            var transactions = await _context.RewardTransactions
                .Where(r => r.CustomerId == customerId)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();

            return (customer?.RewardCoins ?? 0, transactions);
        }

        public Task<(int Balance, List<RewardTransaction> Transactions)> GetLedgerForAdminAsync(long customerId)
        {
            return GetLedgerAsync(customerId);
        }

        public async Task<CoinValidationResult> ValidateCoinUsageAsync(long customerId, int coinsRequested, decimal amountAfterDiscount)
        {
            if (coinsRequested <= 0)
            {
                return new CoinValidationResult { IsValid = true, CoinDiscountAmount = 0 };
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (customer == null)
            {
                return new CoinValidationResult { IsValid = false, Message = "Customer not found." };
            }

            if (coinsRequested > customer.RewardCoins)
            {
                return new CoinValidationResult { IsValid = false, Message = "You do not have enough reward coins." };
            }

            var settings = await GetSettingsAsync();
            var coinDiscount = Math.Round(coinsRequested * settings.CoinToRupeeRate, 2);
            var maxAllowed = Math.Round(amountAfterDiscount * (settings.MaxCoinUsagePercent / 100m), 2);

            if (coinDiscount > maxAllowed)
            {
                return new CoinValidationResult
                {
                    IsValid = false,
                    Message = $"You can redeem at most {settings.MaxCoinUsagePercent}% of the order value in coins."
                };
            }

            if (coinDiscount > amountAfterDiscount)
            {
                coinDiscount = amountAfterDiscount;
            }

            return new CoinValidationResult { IsValid = true, CoinDiscountAmount = coinDiscount };
        }

        public async Task DebitCoinsAsync(long customerId, int coins, long orderId)
        {
            if (coins <= 0)
            {
                return;
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (customer == null)
            {
                return;
            }

            customer.RewardCoins -= coins;

            await _context.RewardTransactions.AddAsync(new RewardTransaction
            {
                CustomerId = customerId,
                OrderId = orderId,
                Type = RewardTransactionType.Spent,
                Coins = coins,
                Remarks = "Reward coins used during checkout",
                BalanceAfter = customer.RewardCoins,
                CreatedDate = DateTime.Now
            });

            await _context.SaveChangesAsync();
        }

        public async Task CreditForDeliveredOrderAsync(long customerId, long orderId, decimal orderFinalAmount)
        {
            var slab = await _context.OrderRewardSlabs
                .Where(s => s.IsActive && orderFinalAmount >= s.MinOrderAmount && orderFinalAmount <= s.MaxOrderAmount)
                .OrderByDescending(s => s.MinOrderAmount)
                .FirstOrDefaultAsync();

            if (slab == null || slab.RewardCoins <= 0)
            {
                return;
            }

            var alreadyEarned = await _context.RewardTransactions.AnyAsync(r =>
                r.OrderId == orderId && r.Type == RewardTransactionType.Earned);
            if (alreadyEarned)
            {
                return;
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (customer == null)
            {
                return;
            }

            customer.RewardCoins += slab.RewardCoins;

            await _context.RewardTransactions.AddAsync(new RewardTransaction
            {
                CustomerId = customerId,
                OrderId = orderId,
                Type = RewardTransactionType.Earned,
                Coins = slab.RewardCoins,
                Remarks = "Reward coins earned for delivered order",
                BalanceAfter = customer.RewardCoins,
                CreatedDate = DateTime.Now
            });

            await _context.SaveChangesAsync();
        }

        public async Task RefundCoinsForOrderAsync(long orderId)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null || order.CoinsUsed <= 0)
            {
                return;
            }

            var alreadyRefunded = await _context.RewardTransactions.AnyAsync(r =>
                r.OrderId == orderId && r.Type == RewardTransactionType.Refunded);
            if (alreadyRefunded)
            {
                return;
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == order.CustomerId);
            if (customer == null)
            {
                return;
            }

            customer.RewardCoins += order.CoinsUsed;

            await _context.RewardTransactions.AddAsync(new RewardTransaction
            {
                CustomerId = order.CustomerId,
                OrderId = orderId,
                Type = RewardTransactionType.Refunded,
                Coins = order.CoinsUsed,
                Remarks = "Reward coins refunded for cancelled/returned order",
                BalanceAfter = customer.RewardCoins,
                CreatedDate = DateTime.Now
            });

            // Also reverse any coins that had already been earned for this order (e.g. on Delivered -> Returned).
            var earnedTx = await _context.RewardTransactions.FirstOrDefaultAsync(r =>
                r.OrderId == orderId && r.Type == RewardTransactionType.Earned);
            if (earnedTx != null)
            {
                var alreadyReversed = await _context.RewardTransactions.AnyAsync(r =>
                    r.OrderId == orderId && r.Type == RewardTransactionType.EarnReversed);
                if (!alreadyReversed)
                {
                    customer.RewardCoins = Math.Max(0, customer.RewardCoins - earnedTx.Coins);
                    await _context.RewardTransactions.AddAsync(new RewardTransaction
                    {
                        CustomerId = order.CustomerId,
                        OrderId = orderId,
                        Type = RewardTransactionType.EarnReversed,
                        Coins = -earnedTx.Coins,
                        Source = "Order",
                        Remarks = "Reversal of previously earned coins for returned order",
                        BalanceAfter = customer.RewardCoins,
                        CreatedDate = DateTime.Now
                    });
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task<int> CreditSignupBonusAsync(long customerId)
        {
            var settings = await GetSettingsAsync();
            if (settings.SignupCoins <= 0) return 0;

            var alreadyGranted = await _context.RewardTransactions.AnyAsync(r =>
                r.CustomerId == customerId && r.Source == "Signup");
            if (alreadyGranted) return 0;

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (customer == null) return 0;

            customer.RewardCoins += settings.SignupCoins;
            await _context.RewardTransactions.AddAsync(new RewardTransaction
            {
                CustomerId = customerId,
                Type = RewardTransactionType.Earned,
                Coins = settings.SignupCoins,
                Source = "Signup",
                Remarks = "Welcome bonus for creating an account",
                BalanceAfter = customer.RewardCoins,
                CreatedDate = DateTime.Now
            });

            await _context.SaveChangesAsync();
            return settings.SignupCoins;
        }

        public async Task<int> CreditDailyLoginBonusAsync(long customerId)
        {
            var settings = await GetSettingsAsync();
            if (settings.LoginCoins <= 0) return 0;

            var today = DateTime.Now.Date;
            var alreadyGrantedToday = await _context.RewardTransactions.AnyAsync(r =>
                r.CustomerId == customerId &&
                (r.Source == "Signup" || r.Source == "Login") &&
                r.CreatedDate >= today);
            if (alreadyGrantedToday) return 0;

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (customer == null) return 0;

            customer.RewardCoins += settings.LoginCoins;
            await _context.RewardTransactions.AddAsync(new RewardTransaction
            {
                CustomerId = customerId,
                Type = RewardTransactionType.Earned,
                Coins = settings.LoginCoins,
                Source = "Login",
                Remarks = "Daily login bonus",
                BalanceAfter = customer.RewardCoins,
                CreatedDate = DateTime.Now
            });

            await _context.SaveChangesAsync();
            return settings.LoginCoins;
        }

        public async Task<(int ReferrerCoins, int JoineeCoins)> CreditReferralBonusAsync(long newCustomerId, long referrerCustomerId)
        {
            var settings = await GetSettingsAsync();

            var alreadyGranted = await _context.RewardTransactions.AnyAsync(r =>
                r.CustomerId == newCustomerId && r.Source == "Referral");
            if (alreadyGranted) return (0, 0);

            var newCustomer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == newCustomerId);
            var referrer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == referrerCustomerId);
            if (newCustomer == null || referrer == null) return (0, 0);

            if (settings.ReferralCoins > 0)
            {
                referrer.RewardCoins += settings.ReferralCoins;
                await _context.RewardTransactions.AddAsync(new RewardTransaction
                {
                    CustomerId = referrerCustomerId,
                    Type = RewardTransactionType.Earned,
                    Coins = settings.ReferralCoins,
                    Source = "Referral",
                    Remarks = $"Referral bonus - referred customer #{newCustomerId} joined",
                    BalanceAfter = referrer.RewardCoins,
                    CreatedDate = DateTime.Now
                });
            }

            if (settings.ReferralJoinCoins > 0)
            {
                newCustomer.RewardCoins += settings.ReferralJoinCoins;
                await _context.RewardTransactions.AddAsync(new RewardTransaction
                {
                    CustomerId = newCustomerId,
                    Type = RewardTransactionType.Earned,
                    Coins = settings.ReferralJoinCoins,
                    Source = "Referral",
                    Remarks = $"Bonus for joining using referrer #{referrerCustomerId}'s code",
                    BalanceAfter = newCustomer.RewardCoins,
                    CreatedDate = DateTime.Now
                });
            }

            await _context.SaveChangesAsync();
            return (settings.ReferralCoins > 0 ? settings.ReferralCoins : 0, settings.ReferralJoinCoins > 0 ? settings.ReferralJoinCoins : 0);
        }

        public async Task<CoinValidationResult> AdminCreditAsync(long customerId, int coins, string remarks, long actorStaffId)
        {
            if (coins <= 0)
            {
                return new CoinValidationResult { IsValid = false, Message = "Coins must be a positive number." };
            }
            if (string.IsNullOrWhiteSpace(remarks))
            {
                return new CoinValidationResult { IsValid = false, Message = "A remark is required for a manual coin grant." };
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (customer == null)
            {
                return new CoinValidationResult { IsValid = false, Message = "Customer not found." };
            }

            customer.RewardCoins += coins;
            await _context.RewardTransactions.AddAsync(new RewardTransaction
            {
                CustomerId = customerId,
                Type = RewardTransactionType.AdminGrant,
                Coins = coins,
                Source = "Admin",
                Remarks = remarks,
                BalanceAfter = customer.RewardCoins,
                CreatedDate = DateTime.Now
            });

            await _context.SaveChangesAsync();
            return new CoinValidationResult { IsValid = true, Message = "Coins credited.", CoinDiscountAmount = 0 };
        }
    }
}
