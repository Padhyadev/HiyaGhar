# Gift insert fonts

Fonts used by the personalised gift message editor (browser preview, served at `/gift-fonts/`)
and embedded in the A4 insert PDF (QuestPDF). All are free to bundle and embed:

| Shown to customer as | File family       | Licence            |
|----------------------|-------------------|--------------------|
| Arial                | Arimo             | Apache 2.0 (metric-compatible with Arial) |
| Times New Roman      | Tinos             | Apache 2.0 (metric-compatible with Times New Roman) |
| Georgia              | Gelasio           | SIL OFL 1.1 (metric-compatible with Georgia) |
| Poppins              | Poppins           | SIL OFL 1.1 |
| Playfair Display     | Playfair Display  | SIL OFL 1.1 |
| Dancing Script       | Dancing Script    | SIL OFL 1.1 (no italic face) |

Arial, Times New Roman and Georgia themselves are Microsoft fonts and are not bundled.
The font list lives in `Services/Gifting/GiftSettings.cs` and `hiya2.client/src/components/gifting/giftFonts.ts`;
keep the two in step.
