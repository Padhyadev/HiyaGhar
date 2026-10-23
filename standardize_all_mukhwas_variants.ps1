$connStr = 'Server=winsome.grabweb.in,5691;Database=Padhyasoft_Hiyaghar;User Id=Hiyaghar;Password=3VSLb8ByZza6$DX;TrustServerCertificate=True;'
Add-Type -AssemblyName System.Data
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

# Standard compulsory 4 variants for all Mukhwas
$standardVariants = @(
    @{ Name = "Weight: 100 g, Packing: Pouch"; Price = 60.00; Stock = 50; IsDefault = $true },
    @{ Name = "Weight: 100 g, Packing: Bottle"; Price = 60.00; Stock = 50; IsDefault = $false },
    @{ Name = "Weight: 200 g, Packing: Pouch"; Price = 120.00; Stock = 50; IsDefault = $false },
    @{ Name = "Weight: 200 g, Packing: Bottle"; Price = 120.00; Stock = 50; IsDefault = $false }
)

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, ProductName FROM dbo.Product WHERE CategoryId = 1 AND IsDeleted = 0 ORDER BY Id"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null

Write-Host "Updating all $($dt.Rows.Count) Mukhwas products to have compulsory 4 variants..."

foreach ($row in $dt.Rows) {
    $currentProductId = [int]$row['Id']
    $productTitle = $row['ProductName']
    Write-Host "`nProcessing Product ${currentProductId} - $productTitle"

    # Soft delete existing non-matching variants for this product
    $softDelCmd = $conn.CreateCommand()
    $softDelCmd.CommandText = @"
UPDATE dbo.ProductVariant 
SET IsDeleted = 1, IsActive = 0, LastModifiedDate = GETDATE()
WHERE ProductId = @targetProdId AND VariantName NOT IN (
    'Weight: 100 g, Packing: Pouch',
    'Weight: 100 g, Packing: Bottle',
    'Weight: 200 g, Packing: Pouch',
    'Weight: 200 g, Packing: Bottle'
)
"@
    $softDelCmd.Parameters.AddWithValue("@targetProdId", $currentProductId) | Out-Null
    $softDelCmd.ExecuteNonQuery() | Out-Null

    # For each of the 4 standard variants, check if already exists
    foreach ($sv in $standardVariants) {
        $checkVarCmd = $conn.CreateCommand()
        $checkVarCmd.CommandText = "SELECT Id FROM dbo.ProductVariant WHERE ProductId = @targetProdId AND VariantName = @vName AND IsDeleted = 0"
        $checkVarCmd.Parameters.AddWithValue("@targetProdId", $currentProductId) | Out-Null
        $checkVarCmd.Parameters.AddWithValue("@vName", $sv.Name) | Out-Null
        $existingVarId = $checkVarCmd.ExecuteScalar()

        if ($existingVarId) {
            # Update price, stock, isDefault
            $updateVarCmd = $conn.CreateCommand()
            $updateVarCmd.CommandText = @"
UPDATE dbo.ProductVariant
SET Price = @price,
    OriginalPrice = @price,
    AvailableStock = CASE WHEN AvailableStock > 0 THEN AvailableStock ELSE 50 END,
    IsInStock = 1,
    IsActive = 1,
    IsDefault = @isDef,
    LastModifiedDate = GETDATE()
WHERE Id = @varId
"@
            $updateVarCmd.Parameters.AddWithValue("@price", [decimal]$sv.Price) | Out-Null
            $updateVarCmd.Parameters.AddWithValue("@isDef", [bool]$sv.IsDefault) | Out-Null
            $updateVarCmd.Parameters.AddWithValue("@varId", [int]$existingVarId) | Out-Null
            $updateVarCmd.ExecuteNonQuery() | Out-Null
            Write-Host "   [OK] Updated: $($sv.Name) (Rs.$($sv.Price))"
        }
        else {
            # Insert missing variant
            $sku = "SKU-" + [System.Guid]::NewGuid().ToString().Substring(0, 5).ToUpper()
            $insertVarCmd = $conn.CreateCommand()
            $insertVarCmd.CommandText = @"
INSERT INTO dbo.ProductVariant (
    ProductId, VariantName, SKU, Price, OriginalPrice,
    AvailableStock, IsInStock, IsDefault, IsActive, IsDeleted,
    CreatedBy, CreatedDate, ReservedStock, LowStockThreshold
) VALUES (
    @targetProdId, @vName, @sku, @price, @price,
    50, 1, @isDef, 1, 0,
    1, GETDATE(), 0, 10
)
"@
            $insertVarCmd.Parameters.AddWithValue("@targetProdId", $currentProductId) | Out-Null
            $insertVarCmd.Parameters.AddWithValue("@vName", $sv.Name) | Out-Null
            $insertVarCmd.Parameters.AddWithValue("@sku", $sku) | Out-Null
            $insertVarCmd.Parameters.AddWithValue("@price", [decimal]$sv.Price) | Out-Null
            $insertVarCmd.Parameters.AddWithValue("@isDef", [bool]$sv.IsDefault) | Out-Null
            $insertVarCmd.ExecuteNonQuery() | Out-Null
            Write-Host "   [+] Inserted: $($sv.Name) (Rs.$($sv.Price)) | SKU: $sku"
        }
    }
}

$conn.Close()
Write-Host "`nAll 17 Mukhwas products successfully updated to have 4 compulsory variants!"
