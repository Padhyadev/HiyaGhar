$connStr = 'Server=winsome.grabweb.in,5691;Database=Padhyasoft_Hiyaghar;User Id=Hiyaghar;Password=3VSLb8ByZza6$DX;TrustServerCertificate=True;'
$conn = New-Object Microsoft.Data.SqlClient.SqlConnection($connStr)
if (-not $conn) {
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
}
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
UPDATE Category SET CategoryName = 'Mukhwas' WHERE CategoryName = 'Mukhwash';
UPDATE Product SET ShortDescription = REPLACE(ShortDescription, 'Mukhwash', 'Mukhwas'), FullDescription = REPLACE(FullDescription, 'Mukhwash', 'Mukhwas'), ProductName = REPLACE(ProductName, 'Mukhwash', 'Mukhwas');
"@
$res = $cmd.ExecuteNonQuery()
Write-Host "Updated rows: $res"
$conn.Close()
