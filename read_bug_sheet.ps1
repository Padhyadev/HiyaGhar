$filePath = "d:\Documents\Downloads\HiyaGhar-main\HiyaGhar-main\08-orders-coupons-bug-report.xlsx"

Add-Type -AssemblyName System.IO.Compression.FileSystem

$tempZip = "$env:TEMP\xlsx_temp"
if (Test-Path $tempZip) { Remove-Item -Recurse -Force $tempZip }
[System.IO.Compression.ZipFile]::ExtractToDirectory($filePath, $tempZip)

# Read shared strings
$sharedStringsFile = "$tempZip\xl\sharedStrings.xml"
$sharedStrings = @()
if (Test-Path $sharedStringsFile) {
    [xml]$ssXml = Get-Content $sharedStringsFile -Raw -Encoding UTF8
    foreach ($si in $ssXml.sst.si) {
        if ($si.t) {
            $sharedStrings += $si.t.'#text'
            if (-not $si.t.'#text') { $sharedStrings += $si.t }
        } elseif ($si.r) {
            $sharedStrings += ($si.r | ForEach-Object { $_.t }) -join ''
        } else {
            $sharedStrings += ""
        }
    }
}

# Read worksheets
$sheets = Get-ChildItem "$tempZip\xl\worksheets\sheet*.xml"
foreach ($sheet in $sheets) {
    Write-Output "=============================="
    Write-Output "SHEET: $($sheet.Name)"
    Write-Output "=============================="
    [xml]$sheetXml = Get-Content $sheet.FullName -Raw -Encoding UTF8
    foreach ($row in $sheetXml.worksheet.sheetData.row) {
        $rowCells = @()
        foreach ($c in $row.c) {
            $val = ""
            if ($c.t -eq "s" -and $c.v) {
                $idx = [int]$c.v
                if ($idx -lt $sharedStrings.Count) {
                    $val = $sharedStrings[$idx]
                }
            } elseif ($c.v) {
                $val = $c.v
            } elseif ($c.is.t) {
                $val = $c.is.t
            }
            $rowCells += "$($c.r): $val"
        }
        Write-Output ($rowCells -join "  |  ")
    }
}

Remove-Item -Recurse -Force $tempZip
