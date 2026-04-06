$dir = 'c:\Users\nisha\OneDrive\Desktop\UNILOOP UPDATES\UNILOOP\client\src\pages\community'
$files = Get-ChildItem $dir -Filter '*.jsx'
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    # Fix var(--bg-dark) -> var(--bg-primary)
    $content = $content -replace [regex]::Escape('var(--bg-dark)'), 'var(--bg-primary)'
    # Fix 30px top padding -> 100px (to clear fixed navbar)
    $content = $content -replace '"30px 20px"', '"100px 20px 40px"'
    Set-Content $f.FullName $content -NoNewline
}
Write-Host "Done"
