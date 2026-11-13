namespace Hiya2.Server.Services.Gifting
{
    public record GiftBoxType(int Id, string Name, int Capacity);

    /// <summary>One product line to pack: how much box space one piece takes, and how many pieces.</summary>
    public record GiftPlanItem(string Label, int Units, int Quantity);

    public class PlannedGiftBox
    {
        public int BoxId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int UsedUnits { get; set; }
    }

    public class GiftBoxPlan
    {
        public List<PlannedGiftBox> Boxes { get; set; } = new();
        public string? Error { get; set; }
        public bool IsSuccess => Error == null && Boxes.Count > 0;
        public int BoxCount => Boxes.Count;
        public int TotalUnits => Boxes.Sum(b => b.UsedUnits);

        /// <summary>e.g. "1 × Large Box, 1 × Small Box".</summary>
        public string Summary => string.Join(", ", Boxes
            .GroupBy(b => new { b.BoxId, b.Name, b.Capacity })
            .OrderByDescending(g => g.Key.Capacity)
            .Select(g => $"{g.Count()} × {g.Key.Name}"));
    }

    /// <summary>
    /// Chooses gift boxes automatically from configured box capacities and each item's gift units.
    /// Pieces are packed largest-first into the biggest box (first-fit decreasing), then each
    /// filled box is swapped for the smallest box size that still holds its contents.
    /// A single box is used whenever everything fits in one.
    /// </summary>
    public static class GiftBoxPlanner
    {
        public const int MaxTotalUnits = 500;

        public static GiftBoxPlan Plan(IEnumerable<GiftPlanItem> items, IEnumerable<GiftBoxType> boxTypes)
        {
            var sizes = boxTypes.Where(b => b.Capacity > 0)
                .OrderBy(b => b.Capacity).ThenBy(b => b.Id)
                .ToList();
            if (sizes.Count == 0)
            {
                return new GiftBoxPlan { Error = "Gift boxes are not set up yet. Please contact us to place a gift order." };
            }

            var lines = items.Where(i => i.Quantity > 0).ToList();
            if (lines.Count == 0)
            {
                return new GiftBoxPlan { Error = "Please select at least one product for your gift." };
            }

            var largest = sizes[^1];
            var pieces = new List<int>();
            long totalUnits = 0;
            foreach (var line in lines)
            {
                var units = Math.Max(1, line.Units);
                if (units > largest.Capacity)
                {
                    return new GiftBoxPlan { Error = $"'{line.Label}' is too large for our gift boxes." };
                }
                totalUnits += (long)units * line.Quantity;
                if (totalUnits > MaxTotalUnits)
                {
                    return new GiftBoxPlan { Error = "This gift is too large to pack. Please reduce the quantity or contact us." };
                }
                pieces.AddRange(Enumerable.Repeat(units, line.Quantity));
            }

            // First-fit decreasing into boxes of the largest size.
            var bins = new List<int>();
            foreach (var units in pieces.OrderByDescending(u => u))
            {
                var index = bins.FindIndex(used => used + units <= largest.Capacity);
                if (index >= 0) bins[index] += units;
                else bins.Add(units);
            }

            var plan = new GiftBoxPlan();
            foreach (var used in bins.OrderByDescending(u => u))
            {
                var box = sizes.First(s => s.Capacity >= used);
                plan.Boxes.Add(new PlannedGiftBox { BoxId = box.Id, Name = box.Name, Capacity = box.Capacity, UsedUnits = used });
            }
            return plan;
        }
    }
}
