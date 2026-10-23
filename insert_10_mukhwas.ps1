$connStr = 'Server=winsome.grabweb.in,5691;Database=Padhyasoft_Hiyaghar;User Id=Hiyaghar;Password=3VSLb8ByZza6$DX;TrustServerCertificate=True;'
Add-Type -AssemblyName System.Data
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

# 10 Products Data Definition
$products = @(
    @{
        ProductName = "Pan Shot"
        ShortDescription = "A delightful burst of traditional paan flavour in every bite. Sweet, aromatic, and refreshing — the perfect mouth freshener for a quick after-meal treat."
        FullDescription = "Our Pan Shot is a refreshing, homemade mukhwas crafted using natural pan essence, gulkand, and carefully selected traditional ingredients. Prepared in small batches to preserve authentic Kathiawadi freshness.`n`n<!--HIYA_META: {""ingredients"":[""Sun-dried Betel Leaves"",""Rose Petal Gulkand"",""Fennel Seeds"",""Sweet Coconut Flakes"",""Menthol Crystals"",""Aromatic Spices""],""benefits"":[""Instant mouth freshener"",""Authentic betel leaf taste"",""100% Tobacco & Supari free"",""Aids post-meal digestion""],""servingSize"":""100g"",""nutritionalInfo"":{""Energy"":""375 kcal"",""Carbohydrates"":""66.0g"",""Protein"":""5.8g"",""Total Fat"":""9.2g"",""Dietary Fiber"":""12.5g""}} -->"
        MainImage = "/uploads/product/pan-shot-2.webp"
        GalleryImages = @(
            @{ Path = "/uploads/product/pan-shot-2.webp"; IsPrimary = $true },
            @{ Path = "/uploads/product/pan-shot.webp"; IsPrimary = $false }
        )
        Variants = @(
            @{ Name = "Weight: 100 g, Packing: Pouch"; Price = 60.00; Stock = 50; IsDefault = $true },
            @{ Name = "Weight: 100 g, Packing: Bottle"; Price = 60.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Pouch"; Price = 120.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Bottle"; Price = 120.00; Stock = 50; IsDefault = $false }
        )
    },
    @{
        ProductName = "Kalkatti Pan"
        ShortDescription = "A rich and aromatic mouth freshener inspired by traditional Kolkata paan. Packed with natural ingredients for a refreshing, sweet, and authentic paan flavour."
        FullDescription = "Our Kalkatti Pan is a traditional, homemade mukhwas prepared using carefully selected premium pan leaves essence, rose gulkand, and natural aromatic ingredients. 100% tobacco and supari free.`n`n<!--HIYA_META: {""ingredients"":[""Kalkatti Betel Leaves"",""Sun-dried Rose Gulkand"",""Silver Cardamom"",""Sweet Coconut Flakes"",""Menthol Crystals""],""benefits"":[""Authentic paan taste"",""Instant long-lasting oral freshness"",""100% Tobacco & Supari Free"",""Aids post-meal digestive wellness""],""servingSize"":""100g"",""nutritionalInfo"":{""Energy"":""385 kcal"",""Carbohydrates"":""68.5g"",""Protein"":""6.2g"",""Total Fat"":""9.8g"",""Dietary Fiber"":""14.2g""}} -->"
        MainImage = "/uploads/product/kalkatti-pan-1-1.webp"
        GalleryImages = @(
            @{ Path = "/uploads/product/kalkatti-pan-1-1.webp"; IsPrimary = $true },
            @{ Path = "/uploads/product/kalkatti-pan-1.webp"; IsPrimary = $false }
        )
        Variants = @(
            @{ Name = "Weight: 100 g, Packing: Pouch"; Price = 60.00; Stock = 50; IsDefault = $true },
            @{ Name = "Weight: 100 g, Packing: Bottle"; Price = 60.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Pouch"; Price = 120.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Bottle"; Price = 120.00; Stock = 50; IsDefault = $false }
        )
    },
    @{
        ProductName = "Jamun Shot"
        ShortDescription = "A sweet and tangy mouth freshener made from real jamun pulp. Refreshing, fruity, and perfect for after meals or anytime you crave a burst of authentic taste."
        FullDescription = "Our Jamun Mukhwas Shot is a traditional, homemade digestive preparation made using real Indian blackberry (jamun) pulp and carefully selected natural digestive spices. Rich in antioxidants and delightfully refreshing.`n`n<!--HIYA_META: {""ingredients"":[""Pure Jamun Pulp"",""Roasted Flaxseeds"",""Dry Dates"",""Pink Rock Salt"",""Digestive Spices""],""benefits"":[""Rich in natural antioxidants"",""Supports healthy blood sugar & digestion"",""Tangy and mouthwatering flavor"",""100% Natural fruit goodness""],""servingSize"":""100g"",""nutritionalInfo"":{""Energy"":""310 kcal"",""Carbohydrates"":""62.0g"",""Protein"":""4.5g"",""Total Fat"":""4.2g"",""Dietary Fiber"":""11.8g""}} -->"
        MainImage = "/uploads/product/jamun-shot-2.webp"
        GalleryImages = @(
            @{ Path = "/uploads/product/jamun-shot-2.webp"; IsPrimary = $true },
            @{ Path = "/uploads/product/jamun-shot.webp"; IsPrimary = $false }
        )
        Variants = @(
            @{ Name = "Weight: 100 g, Packing: Pouch"; Price = 60.00; Stock = 50; IsDefault = $true },
            @{ Name = "Weight: 100 g, Packing: Bottle"; Price = 60.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Pouch"; Price = 120.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Bottle"; Price = 120.00; Stock = 50; IsDefault = $false }
        )
    },
    @{
        ProductName = "Hing Penda Digestive Mukhwas"
        ShortDescription = "Traditional after-meal mouth freshener with the distinctive taste of pure Hing. Flavorful blend crafted for soothing digestion and relief after rich meals."
        FullDescription = "Hing Penda Digestive Mukhwas is an authentic Ayurvedic after-meal preparation crafted with roasted cumin, Bandhani asafoetida (Hing), dry ginger (sonth), black salt, and digestive herbs.`n`n<!--HIYA_META: {""ingredients"":[""Bandhani Asafoetida (Hing)"",""Roasted Cumin (Jeera)"",""Dry Ginger (Sonth)"",""Black Salt (Kala Namak)"",""Amchur"",""Ajwain""],""benefits"":[""Fast relief from gas, bloating & indigestion"",""Authentic Ayurvedic digestive formulation"",""Stimulates appetite and digestive fire"",""Bold, savory, traditional Kathiawadi flavor""],""servingSize"":""100g"",""nutritionalInfo"":{""Energy"":""260 kcal"",""Carbohydrates"":""44.0g"",""Protein"":""7.2g"",""Total Fat"":""6.1g"",""Dietary Fiber"":""16.5g""}} -->"
        MainImage = "/uploads/product/hing-penda-2.webp"
        GalleryImages = @(
            @{ Path = "/uploads/product/hing-penda-2.webp"; IsPrimary = $true },
            @{ Path = "/uploads/product/hing-penda.webp"; IsPrimary = $false }
        )
        Variants = @(
            @{ Name = "Weight: 100 g, Packing: Pouch"; Price = 60.00; Stock = 50; IsDefault = $true },
            @{ Name = "Weight: 100 g, Packing: Bottle"; Price = 60.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Pouch"; Price = 120.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Bottle"; Price = 120.00; Stock = 50; IsDefault = $false }
        )
    },
    @{
        ProductName = "Spicy Ambodia"
        ShortDescription = "A tangy and flavorful Ayurvedic raw mango mouth freshener made with natural digestive spices for instant freshness and healthy digestion."
        FullDescription = "Our Spicy Ambodia is a traditional, homemade digestive preparation made using sun-dried raw green mango pieces (ambodia) seasoned with black rock salt, roasted cumin, and signature Indian spices.`n`n<!--HIYA_META: {""ingredients"":[""Sun-dried Raw Mango (Ambodia)"",""Black Rock Salt"",""Roasted Cumin"",""Red Chili Powder"",""Amchur"",""Ginger Powder""],""benefits"":[""Zesty, sour & spicy flavor explosion"",""Activates salivary glands & aids digestion"",""Natural cure for sluggish digestion & nausea"",""Made with zero artificial food colors""],""servingSize"":""100g"",""nutritionalInfo"":{""Energy"":""275 kcal"",""Carbohydrates"":""52.0g"",""Protein"":""3.8g"",""Total Fat"":""3.5g"",""Dietary Fiber"":""10.2g""}} -->"
        MainImage = "/uploads/product/spicy-ambodia.webp"
        GalleryImages = @(
            @{ Path = "/uploads/product/spicy-ambodia.webp"; IsPrimary = $true },
            @{ Path = "/uploads/product/spicy-ambodiya.webp"; IsPrimary = $false }
        )
        Variants = @(
            @{ Name = "Weight: 100 g"; Price = 60.00; Stock = 50; IsDefault = $true },
            @{ Name = "Weight: 200 g"; Price = 120.00; Stock = 50; IsDefault = $false }
        )
    },
    @{
        ProductName = "Tal Alsi"
        ShortDescription = "A nutritious homemade mouth freshener made with roasted sesame and omega-rich flax seeds for crunchy taste and digestive wellness."
        FullDescription = "Our Tal Alsi Mukhwas is a traditional homemade mouth freshener combining slow-roasted white sesame seeds (Tal) and flax seeds (Alsi) seasoned with rock salt and lemon juice.`n`n<!--HIYA_META: {""ingredients"":[""White Sesame Seeds (Tal)"",""Golden Flaxseeds (Alsi)"",""Rock Salt"",""Fresh Lemon Juice"",""Turmeric""],""benefits"":[""Rich in Omega-3 fatty acids & calcium"",""Nutritious daily crunch for heart health"",""Improves digestion and gut health"",""100% Roasted with zero oil added""],""servingSize"":""100g"",""nutritionalInfo"":{""Energy"":""465 kcal"",""Carbohydrates"":""24.5g"",""Protein"":""18.2g"",""Total Fat"":""34.0g"",""Dietary Fiber"":""22.0g""}} -->"
        MainImage = "/uploads/product/tal-alsi-1.webp"
        GalleryImages = @(
            @{ Path = "/uploads/product/tal-alsi-1.webp"; IsPrimary = $true },
            @{ Path = "/uploads/product/tal-alsi.webp"; IsPrimary = $false }
        )
        Variants = @(
            @{ Name = "Weight: 100 g, Packing: Pouch"; Price = 60.00; Stock = 50; IsDefault = $true },
            @{ Name = "Weight: 100 g, Packing: Bottle"; Price = 60.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Pouch"; Price = 120.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Bottle"; Price = 120.00; Stock = 50; IsDefault = $false }
        )
    },
    @{
        ProductName = "Sweet Amla"
        ShortDescription = "Vitamin C rich dried amla candies candied with natural sweeteners and digestive spices for a tangy-sweet daily treat."
        FullDescription = "Our Sweet Amla Mukhwas is a traditional homemade mouth freshener made using premium Indian gooseberries (amla) candied with pure cane jaggery and seasoned with digestive spices.`n`n<!--HIYA_META: {""ingredients"":[""Indian Gooseberry (Amla)"",""Pure Jaggery / Sugar"",""Rock Salt"",""Roasted Cumin"",""Black Pepper""],""benefits"":[""Packed with natural Vitamin C for immunity"",""Strengthens hair, skin, and vision"",""Aids digestive acid balance naturally"",""Chewy, sweet & tangy post-meal snack""],""servingSize"":""100g"",""nutritionalInfo"":{""Energy"":""315 kcal"",""Carbohydrates"":""74.0g"",""Protein"":""2.1g"",""Total Fat"":""0.8g"",""Dietary Fiber"":""8.5g""}} -->"
        MainImage = "/uploads/product/sweet-amla-1.webp"
        GalleryImages = @(
            @{ Path = "/uploads/product/sweet-amla-1.webp"; IsPrimary = $true },
            @{ Path = "/uploads/product/sweet-amla.webp"; IsPrimary = $false }
        )
        Variants = @(
            @{ Name = "Weight: 100 g, Packing: Pouch"; Price = 60.00; Stock = 50; IsDefault = $true },
            @{ Name = "Weight: 100 g, Packing: Bottle"; Price = 60.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Pouch"; Price = 120.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Bottle"; Price = 120.00; Stock = 50; IsDefault = $false }
        )
    },
    @{
        ProductName = "Mango Slice"
        ShortDescription = "A tangy-sweet dried mango mouth freshener made with seasoned mango slices and spices for refreshing flavor anytime."
        FullDescription = "Our Mango Slice Mukhwas is a homemade, tangy-sweet mouth freshener made using sun-dried mango slices, black rock salt, cumin, and mild digestive seasonings.`n`n<!--HIYA_META: {""ingredients"":[""Sun-dried Mango Slices"",""Black Salt"",""Cumin Seeds"",""Sugar"",""Chili Spice Blend""],""benefits"":[""Irresistible sweet and tangy real mango taste"",""Refreshes taste buds instantly"",""Rich in natural fiber and Vitamin A"",""Great post-meal refresher for all ages""],""servingSize"":""100g"",""nutritionalInfo"":{""Energy"":""290 kcal"",""Carbohydrates"":""68.0g"",""Protein"":""2.4g"",""Total Fat"":""1.2g"",""Dietary Fiber"":""7.0g""}} -->"
        MainImage = "/uploads/product/mango-slice-1.webp"
        GalleryImages = @(
            @{ Path = "/uploads/product/mango-slice-1.webp"; IsPrimary = $true },
            @{ Path = "/uploads/product/mango-slice.webp"; IsPrimary = $false }
        )
        Variants = @(
            @{ Name = "Weight: 100 g, Packing: Pouch"; Price = 60.00; Stock = 50; IsDefault = $true },
            @{ Name = "Weight: 100 g, Packing: Bottle"; Price = 60.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Pouch"; Price = 120.00; Stock = 50; IsDefault = $false },
            @{ Name = "Weight: 200 g, Packing: Bottle"; Price = 120.00; Stock = 50; IsDefault = $false }
        )
    },
    @{
        ProductName = "Premium Pan Mukhwas"
        ShortDescription = "A rich blend of sweet rose Gulkand, aromatic spices, and cooling betel leaf essence for authentic royal paan freshness."
        FullDescription = "Our Premium Pan Mukhwas is a homemade, traditional mouth freshener crafted using natural paan leaves essence, rose petals, slivered dates, and cooling aromatic spices. Tobacco & supari free.`n`n<!--HIYA_META: {""ingredients"":[""Betel Leaf Essence"",""Rose Gulkand"",""Fennel Seeds (Saunf)"",""Sweet Coconut"",""Silver Cardamom Pearls"",""Menthol""],""benefits"":[""Royal Banarasi paan aroma and freshness"",""100% Tobacco & Supari free"",""Soothes acidity and cools the mouth"",""Long-lasting oral freshness""],""servingSize"":""100g"",""nutritionalInfo"":{""Energy"":""390 kcal"",""Carbohydrates"":""70.5g"",""Protein"":""5.9g"",""Total Fat"":""9.5g"",""Dietary Fiber"":""13.8g""}} -->"
        MainImage = "/uploads/product/premium-pan-2.webp"
        GalleryImages = @(
            @{ Path = "/uploads/product/premium-pan-2.webp"; IsPrimary = $true },
            @{ Path = "/uploads/product/premium-pan.webp"; IsPrimary = $false }
        )
        Variants = @(
            @{ Name = "Weight: 100 g"; Price = 60.00; Stock = 50; IsDefault = $true },
            @{ Name = "Weight: 200 g"; Price = 120.00; Stock = 50; IsDefault = $false }
        )
    },
    @{
        ProductName = "Tal Gotli"
        ShortDescription = "A crunchy Gujarati heritage mouth freshener made with roasted mango seed kernel (Gotli) and sesame seeds."
        FullDescription = "Tal Gotli is a celebrated Kathiawadi digestive treat lovingly prepared at home using roasted mango kernel (Gotli), white sesame (Tal), rock salt, and spices. Time-honored recipe for gut comfort.`n`n<!--HIYA_META: {""ingredients"":[""Roasted Mango Kernels (Gotli)"",""White Sesame Seeds (Tal)"",""Himalayan Pink Salt"",""Lemon Juice"",""Digestive Herbs""],""benefits"":[""Authentic Gujarati heritage digestive recipe"",""Excellent source of natural tannins & calcium"",""Soothes stomach upset and relieves bloating"",""Crunchy, savory, and satisfying chew""],""servingSize"":""100g"",""nutritionalInfo"":{""Energy"":""410 kcal"",""Carbohydrates"":""38.0g"",""Protein"":""14.5g"",""Total Fat"":""22.0g"",""Dietary Fiber"":""18.0g""}} -->"
        MainImage = "/uploads/product/tal-gotli-1.webp"
        GalleryImages = @(
            @{ Path = "/uploads/product/tal-gotli-1.webp"; IsPrimary = $true },
            @{ Path = "/uploads/product/tal-gotli-2.webp"; IsPrimary = $false }
        )
        Variants = @(
            @{ Name = "Weight: 100 g"; Price = 60.00; Stock = 50; IsDefault = $true },
            @{ Name = "Weight: 200 g"; Price = 120.00; Stock = 50; IsDefault = $false }
        )
    }
)

Write-Host "Starting insertion of 10 Mukhwas products into HiyaGhar DB..."

foreach ($p in $products) {
    # Check if product exists
    $checkCmd = $conn.CreateCommand()
    $checkCmd.CommandText = "SELECT Id FROM dbo.Product WHERE CategoryId = 1 AND ProductName = @pName AND IsDeleted = 0"
    $checkCmd.Parameters.AddWithValue("@pName", $p.ProductName) | Out-Null
    $existingId = $checkCmd.ExecuteScalar()

    $productId = 0

    if ($existingId -and $existingId -gt 0) {
        $productId = [int]$existingId
        Write-Host "Updating existing product: $($p.ProductName) (ID: $productId)"
        $updateCmd = $conn.CreateCommand()
        $updateCmd.CommandText = @"
UPDATE dbo.Product 
SET ShortDescription = @shortDesc,
    FullDescription = @fullDesc,
    MainImagePath = @mainImage,
    BasePrice = 60.00,
    DiscountPrice = 60.00,
    IsActive = 1,
    IsDeleted = 0,
    LastModifiedDate = GETDATE()
WHERE Id = @id
"@
        $updateCmd.Parameters.AddWithValue("@shortDesc", $p.ShortDescription) | Out-Null
        $updateCmd.Parameters.AddWithValue("@fullDesc", $p.FullDescription) | Out-Null
        $updateCmd.Parameters.AddWithValue("@mainImage", $p.MainImage) | Out-Null
        $updateCmd.Parameters.AddWithValue("@id", $productId) | Out-Null
        $updateCmd.ExecuteNonQuery() | Out-Null
    }
    else {
        Write-Host "Inserting new product: $($p.ProductName)"
        $insertCmd = $conn.CreateCommand()
        $insertCmd.CommandText = @"
INSERT INTO dbo.Product (
    CategoryId, ProductName, ShortDescription, FullDescription, 
    MainImagePath, BasePrice, DiscountPrice, Rating, ReviewCount, 
    IsFeatured, IsActive, IsDeleted, CreatedBy, CreatedDate
) 
OUTPUT INSERTED.Id
VALUES (
    1, @pName, @shortDesc, @fullDesc, 
    @mainImage, 60.00, 60.00, 5.00, 0, 
    0, 1, 0, 1, GETDATE()
)
"@
        $insertCmd.Parameters.AddWithValue("@pName", $p.ProductName) | Out-Null
        $insertCmd.Parameters.AddWithValue("@shortDesc", $p.ShortDescription) | Out-Null
        $insertCmd.Parameters.AddWithValue("@fullDesc", $p.FullDescription) | Out-Null
        $insertCmd.Parameters.AddWithValue("@mainImage", $p.MainImage) | Out-Null
        $productId = [int]$insertCmd.ExecuteScalar()
        Write-Host "  -> Created Product with ID: $productId"
    }

    # Soft delete existing variants for this product to prevent duplicate SKUs
    $delVarCmd = $conn.CreateCommand()
    $delVarCmd.CommandText = "UPDATE dbo.ProductVariant SET IsDeleted = 1, LastModifiedDate = GETDATE() WHERE ProductId = @prodId"
    $delVarCmd.Parameters.AddWithValue("@prodId", $productId) | Out-Null
    $delVarCmd.ExecuteNonQuery() | Out-Null

    # Insert variants
    foreach ($v in $p.Variants) {
        $sku = "SKU-" + [System.Guid]::NewGuid().ToString().Substring(0, 5).ToUpper()
        $varCmd = $conn.CreateCommand()
        $varCmd.CommandText = @"
INSERT INTO dbo.ProductVariant (
    ProductId, VariantName, SKU, Price, OriginalPrice, 
    AvailableStock, IsInStock, IsDefault, IsActive, IsDeleted, 
    CreatedBy, CreatedDate, ReservedStock, LowStockThreshold
) VALUES (
    @prodId, @varName, @sku, @price, @price, 
    @stock, 1, @isDef, 1, 0, 
    1, GETDATE(), 0, 10
)
"@
        $varCmd.Parameters.AddWithValue("@prodId", $productId) | Out-Null
        $varCmd.Parameters.AddWithValue("@varName", $v.Name) | Out-Null
        $varCmd.Parameters.AddWithValue("@sku", $sku) | Out-Null
        $varCmd.Parameters.AddWithValue("@price", [decimal]$v.Price) | Out-Null
        $varCmd.Parameters.AddWithValue("@stock", [int]$v.Stock) | Out-Null
        $varCmd.Parameters.AddWithValue("@isDef", [bool]$v.IsDefault) | Out-Null
        $varCmd.ExecuteNonQuery() | Out-Null
        Write-Host "     + Variant: $($v.Name) | Price: $($v.Price) | SKU: $sku"
    }

    # Soft delete existing images for this product
    $delImgCmd = $conn.CreateCommand()
    $delImgCmd.CommandText = "UPDATE dbo.ProductImage SET IsDeleted = 1 WHERE ProductId = @prodId"
    $delImgCmd.Parameters.AddWithValue("@prodId", $productId) | Out-Null
    $delImgCmd.ExecuteNonQuery() | Out-Null

    # Insert gallery images
    $order = 0
    foreach ($img in $p.GalleryImages) {
        $imgCmd = $conn.CreateCommand()
        $imgCmd.CommandText = @"
INSERT INTO dbo.ProductImage (
    ProductId, ImagePath, DisplayOrder, IsPrimary, IsActive, IsDeleted, CreatedDate
) VALUES (
    @prodId, @imgPath, @order, @isPrimary, 1, 0, GETDATE()
)
"@
        $imgCmd.Parameters.AddWithValue("@prodId", $productId) | Out-Null
        $imgCmd.Parameters.AddWithValue("@imgPath", $img.Path) | Out-Null
        $imgCmd.Parameters.AddWithValue("@order", $order) | Out-Null
        $imgCmd.Parameters.AddWithValue("@isPrimary", [bool]$img.IsPrimary) | Out-Null
        $imgCmd.ExecuteNonQuery() | Out-Null
        $order++
        Write-Host "     + Image: $($img.Path) (Primary: $($img.IsPrimary))"
    }
}

$conn.Close()
Write-Host "`nAll 10 Mukhwas products added successfully to HiyaGhar Database!"
