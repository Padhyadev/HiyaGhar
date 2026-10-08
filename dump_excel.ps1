$filePath = "d:\Documents\Downloads\HiyaGhar-main\HiyaGhar-main\08-orders-coupons-bug-report.xlsx"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tempZip = "$env:TEMP\xlsx_temp2"
if (Test-Path $tempZip) { Remove-Item -Recurse -Force $tempZip }
[System.IO.Compression.ZipFile]::ExtractToDirectory($filePath, $tempZip)

# Read shared strings
$sharedStringsFile = "$tempZip\xl\sharedStrings.xml"
$sharedStrings = @()
if (Test-Path $sharedStringsFile) {
    [xml]$ssXml = Get-Content $sharedStringsFile -Raw -Encoding UTF8
    foreach ($si in $ssXml.sst.si) {
        if ($null -ne $si.t) {
            $sharedStrings += $si.t
        } elseif ($si.r) {
            $sharedStrings += ($si.r | ForEach-Object { $_.t }) -join ''
        } else {
            $sharedStrings += ""
        }
    }
}

# Read workbook.xml to get sheet names
[xml]$wbXml = Get-Content "$tempZip\xl\workbook.xml" -Raw -Encoding UTF8
$sheetMap = @{}
foreach ($sheet in $wbXml.workbook.sheets.sheet) {
    $sheetMap[$sheet.id] = $sheet.name
}

[xml]$relsXml = Get-Content "$tempZip\xl\_rels\workbook.xml.rels" -Raw -Encoding UTF8
$fileToName = @{}
foreach ($rel in $relsXml.Relationships.Relationship) {
    if ($sheetMap.ContainsKey($rel.Id)) {
        $fileToName[$rel.Target.Replace("worksheets/", "")] = $sheetMap[$rel.Id]
    }
}

$sheets = Get-ChildItem "$tempZip\xl\worksheets\sheet*.xml"
foreach ($sheet in $sheets) {
    $sName = if ($fileToName.ContainsKey($sheet.Name)) { $fileToName[$sheet.Name] } else { $sheet.Name }
    Write-Output "=================================================="
    Write-Output "TAB: $sName"
    Write-Output "=================================================="
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
        if ($rowCells.Count -gt 0) {
            Write-Output ($rowCells -join " | ")
        }
    }
}

Remove-Item -Recurse -Force $tempZip
