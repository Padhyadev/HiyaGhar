$connStr = 'Server=winsome.grabweb.in,5691;Database=Padhyasoft_Hiyaghar;User Id=Hiyaghar;Password=3VSLb8ByZza6$DX;TrustServerCertificate=True;'
$conn = New-Object Microsoft.Data.SqlClient.SqlConnection($connStr)
if (-not $conn) {
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
}
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ShippingSetting') AND name = 'FssaiLicenseNumber')
    ALTER TABLE dbo.ShippingSetting ADD FssaiLicenseNumber NVARCHAR(50) NOT NULL DEFAULT N'10723026001148';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ShippingSetting') AND name = 'EnableFssaiDisplay')
    ALTER TABLE dbo.ShippingSetting ADD EnableFssaiDisplay BIT NOT NULL DEFAULT 1;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ShippingSetting') AND name = 'ContactEmail')
    ALTER TABLE dbo.ShippingSetting ADD ContactEmail NVARCHAR(150) NOT NULL DEFAULT N'support@hiyaghar.com';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ShippingSetting') AND name = 'ContactPhone')
    ALTER TABLE dbo.ShippingSetting ADD ContactPhone NVARCHAR(50) NOT NULL DEFAULT N'+91 95102 12154';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ShippingSetting') AND name = 'ContactAddress')
    ALTER TABLE dbo.ShippingSetting ADD ContactAddress NVARCHAR(200) NOT NULL DEFAULT N'Ahmedabad, Gujarat, India';
"@
$res = $cmd.ExecuteNonQuery()
Write-Host "Columns added successfully! Result: $res"
$conn.Close()
