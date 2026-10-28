using Hiya2.Server.Infra;

namespace Hiya2.Server.Tests;

public class DeliveryPincodeSeedTests
{
    [Fact]
    public void AllPincodes_AreSixDigitAhmedabadPincodes()
    {
        Assert.All(DeliveryPincodeSeed.Pincodes, p =>
        {
            Assert.Matches(@"^38[02]\d{3}$", p.Pincode);
            Assert.False(string.IsNullOrWhiteSpace(p.AreaName));
            Assert.True(p.AreaName.Length <= 200);
        });
    }

    [Fact]
    public void Pincodes_AreUnique()
    {
        var pincodes = DeliveryPincodeSeed.Pincodes.Select(p => p.Pincode).ToList();

        Assert.Equal(pincodes.Count, pincodes.Distinct().Count());
    }

    [Fact]
    public void OnlyPincodesNearGhatlodiya_AreAllowedByDefault()
    {
        var allowed = DeliveryPincodeSeed.Pincodes.Where(p => p.IsAllowed).Select(p => p.Pincode).OrderBy(p => p);

        Assert.Equal(new[] { "380013", "380052", "380061", "380063", "382480", "382481" }, allowed);
    }
}
