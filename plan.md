# Plan: Fix multi-image product save (Admin → Backend → Product Detail page)

## Context

The admin Product Management screen lets an admin upload several photos per product and pick one as "Primary" via a working thumbnail grid with radio buttons. The request was to verify this actually saves correctly end-to-end and is fully used afterward (on the Product Detail page). It does not — a full-codebase trace found the multi-image feature is **built on both ends but never connected in the middle**, plus a handful of real bugs in the one gallery endpoint that does exist. This plan fixes the save path and the bugs uncovered along the way so "upload 3 photos, mark one primary" actually survives a save/reload and displays correctly to customers.

## What's actually happening today (verified by reading the code, not just grepping)

1. **Admin UI works, but throws the gallery away on save.** `ProductManagementPage.tsx` (`handleFileUpload` line 266, `handleSetPrimaryImage` line 318, `handleRemoveImage` line 328) genuinely builds `formData.images: ProductImageItem[]` with multiple images and a per-image `isPrimary` flag. But `handleSaveForm` (line 461) does this:
   ```ts
   const primaryImg = formData.images.find((img) => img.isPrimary)?.imagePath || formData.images[0]?.imagePath || '';
   ...
   bodyFormData.append('MainImagePath', primaryImg || '/uploads/Noimage.png');
   ```
   Only the primary image's base64 data is sent, as a single `MainImagePath` field. Every other uploaded image is silently dropped — nothing else in `formData.images` is ever serialized into the request.

2. **Backend `Create`/`Update` can't accept a gallery even if the frontend sent one.** `ProductController.cs` `Create` (line 177) and `Update` (line 272) only accept `IFormFile? mainImage` (or a base64 `MainImagePath` string, decoded via `SaveBase64ImageAsync`, line 499). Both explicitly do `ModelState.Remove("Images")` (lines 183, 283) and never touch the `ProductImage` table.

3. **A real gallery endpoint exists but the admin form never calls it.** `POST /api/product/{id}/images` → `UploadGalleryImage` (line 444) does correctly insert a `ProductImage` row — but it has its own bugs:
   - No un-setting of other rows' `IsPrimary` when a new image is uploaded with `isPrimary=true` → **two images can both end up primary**, nothing prevents it (no DB constraint either — `Models/ProductImage.cs` has no unique index on `(ProductId, IsPrimary)`).
   - `DisplayOrder = 1` is hardcoded (line 462) for every image — never incremented, so all gallery images for a product share the same order value.
   - If `isPrimary` is never passed as `true`, **no image ever becomes primary** — there's no fallback promotion.

4. **Reads don't order images at all.** `GetAll` (line 72) and `GetById` (line 164) both project `images` with no `.OrderBy(...)` — order is whatever the DB happens to return, and `displayOrder` isn't even included in the projection.

5. **Delete is dead code.** `IProductRepository.DeleteImageAsync` (`ProductRepository.cs` line 146) soft-deletes a `ProductImage` row correctly, but no controller route calls it — there is no way to delete a single gallery image via the API today.

6. **Good news — the customer-facing Product Detail page already works.** `ProductDetailPage.tsx` (lines 42-43, 60-69, 92-93, 335-356) builds a `galleryImages: string[]` from `mainImagePath` + the full `images[]` array (deduped by path) and renders a real clickable thumbnail strip (`.noka-detail-thumbnails-row`) — `if (galleryImages.length > 1)`. It does **not** need to change to support multiple images; it only lacks sorting by `displayOrder`/`isPrimary` (minor, see below), and it already correctly consumes whatever `images[]` the API returns. Once the backend actually starts persisting the gallery, this page will show it with no changes required.

## Recommended approach

Mirror the pattern this exact controller already uses for variants (`VariantsJson` + `SaveVariantsFromJsonAsync`, lines 342-402: soft-delete all existing rows for the product, then reinsert fresh ones from a JSON blob) — same "full replace on every save" convention, applied to images instead of variants. This keeps the change idiomatic to the codebase and avoids inventing a new multi-file upload plumbing path (the admin form already converts every picked file to a base64 data URL via `FileReader`, so no new `IFormFile[]` binding is needed — just reuse the existing `SaveBase64ImageAsync` decode-and-write logic per image).

### 1. Backend — `Hiya2.Server/Controllers/ProductController.cs`

- **DONE**: Added `IncomingImageDto { int? Id, string ImagePath, bool IsPrimary }` next to `IncomingVariantDto` (near line 17-27).
- **DONE**: Added `[FromForm] string? imagesJson` parameter to `Create` (line 177 signature).
- **STILL TODO**: Add the same `[FromForm] string? imagesJson` parameter to `Update`'s signature (currently at line 279: `Update(int id, [FromForm] Product product, [FromForm] string? categoryName, IFormFile? mainImage, [FromForm] string? variantsJson)`).
- **STILL TODO**: Add a new private helper `SaveImagesFromJsonAsync(int productId, string? imagesJson)`, modeled directly on `SaveVariantsFromJsonAsync` (line 342):
  - Deserialize `imagesJson` into `List<IncomingImageDto>` (same `JsonSerializerOptions { PropertyNameCaseInsensitive = true }` used for variants).
  - Soft-delete all existing, non-deleted `ProductImage` rows for `productId` (same pattern as the variants helper: loop, set `IsDeleted = true`).
  - For each incoming item, in array order (array position = display order):
    - If `ImagePath` starts with `"data:image/"` → decode/save via the existing `SaveBase64ImageAsync` (line 499) to get a real `/uploads/product/...` path.
    - Otherwise (an existing image kept unchanged during an edit) → keep the path as-is.
    - Insert a new `ProductImage` row: `ProductId`, resolved `ImagePath`, `DisplayOrder = <index>`, `IsPrimary = <the incoming flag>`.
  - **Enforce single-primary invariant** after building the list: exactly one inserted row gets `IsPrimary = true` (the one flagged; if none was flagged, promote index 0). Explicitly force every other row's `IsPrimary` to `false` in the same pass — this is the fix for bug #3's double/zero-primary risk.
  - Return the resolved primary row's `ImagePath` (or `null` if no images) so the caller can sync `Product.MainImagePath` — so every other part of the app that already reads `MainImagePath` directly (category listing card thumbnails, cart/wishlist line items, order snapshots) keeps working unchanged. `ProductImage` becomes the source of truth, `MainImagePath` is just kept in sync as a denormalized copy.
  - Since `Create` calls this *after* `_productRepository.AddAsync(product)` returns the tracked `created` entity, and `Update` calls `_productRepository.UpdateAsync(product)` with a *detached* `[FromForm]`-bound `product` instance (not EF-tracked) — the helper should take the `productId` only, do its own `_context.Products.FindAsync(productId)` (or a direct `SaveChangesAsync` after setting `MainImagePath` via a small tracked update) to persist the synced `MainImagePath` without depending on which caller's `product` reference is tracked.
  - Call this from `Create` (after `_productRepository.AddAsync`, alongside the existing `SaveVariantsFromJsonAsync` call at line 247) and from `Update` (alongside its call at line 338, need to add `imagesJson` param there first — see "STILL TODO" above). If `imagesJson` is null/empty, fall back to today's single-`mainImage` behavior unchanged (keeps any other caller of these endpoints working).
- **STILL TODO**: Fix `UploadGalleryImage` (line 444) for correctness as a standalone endpoint (used by anything other than the admin form, or future use): before inserting, if `isPrimary == true`, first set `IsPrimary = false` on all other non-deleted `ProductImage` rows for that product; compute `DisplayOrder` as `(max existing DisplayOrder for this product) + 1` instead of the hardcoded `1`.
- **STILL TODO**: Fix ordering on read — in both `GetAll` (line 72) and `GetById` (line 164), change the images projection to order primary-first, then by display order, and include `displayOrder` in the projected shape:
  ```csharp
  images = p.Images.Where(i => !i.IsDeleted)
      .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
      .Select(i => new { id = i.Id, imagePath = i.ImagePath, isPrimary = i.IsPrimary, displayOrder = i.DisplayOrder })
  ```
- **STILL TODO**: Add the missing delete route: `[HttpDelete("image/{imageId}")]` calling the already-implemented `_productRepository.DeleteImageAsync(imageId)` (currently dead code) — small addition, lets a future "delete this gallery image immediately" UI action work without a full product save.

### 2. Admin frontend — `hiya2.client/src/pages/Admin/ProductManagementPage.tsx`

- No changes needed to the picker/primary-radio/remove-button UI — it already works correctly.
- **STILL TODO**: In `handleSaveForm` (line 461), alongside the existing `VariantsJson` append (line 495), add:
  ```ts
  bodyFormData.append('ImagesJson', JSON.stringify(
    formData.images.map((img) => ({ id: img.id, imagePath: img.imagePath, isPrimary: img.isPrimary }))
  ));
  ```
  Keep the existing `MainImagePath` field as-is (harmless/redundant — the backend now recomputes it canonically from the images list regardless).
- `handleOpenEdit` (line 195) already maps `item.images` into `formData.images` when present — no change needed; it will simply start receiving real data once the backend fix ships.

### 3. Customer frontend — `ProductDetailPage.tsx`

**Update (found via real user testing, not just optional polish):** once the backend fix shipped, `apiProd.images` started including the primary image itself (by design — `ProductImage` is now the source of truth for all images, primary included). The old gallery-building code pushed `apiProd.mainImagePath + "?v=2"` as entry 0, then deduped `images[]` entries against that list by exact string match — but the "?v=2" suffix meant the primary's own `images[]` entry never matched, so it got pushed again as a duplicate. A product with 2 real images (1 primary + 1 secondary) showed 3 thumbnails, two of them identical.

**Fixed**: gallery is now built directly from `apiProd.images` (already sorted primary-first by the backend), with `mainImagePath` only used as a fallback for legacy products that have no `ProductImage` rows at all (saved before this fix shipped).

## Current implementation status

- [x] Added `IncomingImageDto` class in `ProductController.cs`
- [x] Added `imagesJson` parameter to `Create()` signature
- [x] Added `imagesJson` parameter to `Update()` signature
- [x] Wrote `SaveImagesFromJsonAsync` helper method (full-replace pattern, enforces single-primary, syncs `Product.MainImagePath`)
- [x] Wired helper into `Create()`
- [x] Wired helper into `Update()`
- [x] Fixed `UploadGalleryImage` primary/display-order bugs (clears other primaries, increments `DisplayOrder`, syncs `MainImagePath`)
- [x] Fixed `GetAll`/`GetById` image ordering (`OrderByDescending(IsPrimary).ThenBy(DisplayOrder)`) + added `displayOrder` to projection
- [x] Added `DELETE /api/product/image/{imageId}` route (wired to previously-dead `DeleteImageAsync`)
- [x] Updated `ProductManagementPage.tsx` `handleSaveForm` to append `ImagesJson`
- [x] Backend compiles clean (no CS errors; only a harmless file-lock from the user's already-running `dotnet watch`)
- [x] Frontend type-checks clean (`tsc -b --noEmit`)
- [~] Full click-through verification via the Admin UI is still blocked — couldn't log in with the dev-seed credentials (someone changed the admin password on this shared database), and didn't want to forge a JWT to bypass login and write test data into the shared `Padhyasoft_Hiyaghar` DB. **Someone with real admin credentials should still run the full Verification steps below at least once.**
- [x] However, the user manually tested product id 9 ("Dhana Dal Mukhwas") through the real Admin UI themselves and found the gallery-duplication bug above. Confirmed via direct read of `GET /api/product/9` that the backend data was already correct (exactly 2 `ProductImage` rows, one primary) — the bug was 100% in the frontend rendering, not the save. Fixed in `ProductDetailPage.tsx` and verified with a read-only Playwright check against the live dev backend: product 9 now renders exactly 2 thumbnails (previously 3, with a duplicate), matching the 2 real saved images.

## Verification

1. Run backend + client dev servers. In Admin → Products, create a new product, upload 3 photos, mark the 2nd as primary, save.
2. `GET /api/product/{id}` — confirm `mainImagePath` equals the 2nd photo's saved path, and `images` contains all 3 entries sorted primary-first, with exactly one `isPrimary: true`.
3. Reopen the product in the admin edit form — confirm all 3 thumbnails reappear with the correct one marked primary (proves round-trip persistence, not just write-side).
4. Open that product's Product Detail page on the storefront — confirm the thumbnail strip shows all 3 images and the primary one displays first by default.
5. Edit again: remove one image, switch primary to a different one, save — confirm the removed image is gone (soft-deleted, doesn't reappear on reload) and exactly one image is primary afterward (no double-primary).
6. Spot-check a category listing page (e.g. `/mukhwas`) still shows the correct card thumbnail for an edited product (proves `MainImagePath` sync didn't break existing consumers).
