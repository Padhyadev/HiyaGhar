namespace Hiya2.Server.Services
{
    // Reward coins are switched off for customers for now (the website side is
    // hiya2.client/src/utils/features.ts). While off:
    //  - no coins are given for signup, daily login, referrals or delivered orders,
    //  - orders ignore any coins sent with them (nothing is spent).
    // Admin reward pages, existing balances/ledger and admin manual credits are unaffected.
    // Set to true (together with REWARD_COINS_ENABLED on the website) to bring it all back.
    public static class RewardFeature
    {
        // static readonly, not const, so the compiler doesn't flag the guarded code as unreachable.
        public static readonly bool Enabled = false;
    }
}
