# ============================================================
# SkillGrid Smart Auto-Save Script
# Saves important files every 12 hours IF changes exist
# ============================================================

$path = "C:\SkillGrid"   # Project root
$lastSnapshot = ""
$lastPushTime = Get-Date
$intervalHours = 12

# Important file types
$importantExtensions = @(".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".html")

# Ignore these folders entirely
$ignoredFolders = @("node_modules", ".git", "dist", "build")

Write-Host "SkillGrid Auto-Save Running..."
Write-Host "Watching: $path"
Write-Host "Interval: $intervalHours hours"
Write-Host ""

# ------------------------------------------------------------
# Helper: Determine whether a file is important
# ------------------------------------------------------------
function Should-TrackFile($filePath) {
    $lower = $filePath.ToLower()

    foreach ($folder in $ignoredFolders) {
        if ($lower.Contains("\$folder\")) {
            return $false
        }
    }

    foreach ($ext in $importantExtensions) {
        if ($lower.EndsWith($ext)) {
            return $true
        }
    }

    return $false
}

# ------------------------------------------------------------
# Helper: Generate snapshot hash of tracked files
# ------------------------------------------------------------
function ComputeSnapshotHash {
    $files = Get-ChildItem -Recurse -File $path |
        Where-Object { Should-TrackFile $_.FullName }

    Write-Host ("Tracking " + $files.Count + " important files")

    $combined = ""

    foreach ($f in $files) {
        # Using UTC timestamps for stability
        $combined += "$($f.FullName)-$($f.LastWriteTimeUtc);"
    }

    # Guarantee combined is never null or empty
    if ([string]::IsNullOrEmpty($combined)) {
        $combined = "NO_FILES_FOUND"
    }

    # PowerShell-safe UTF8 encoding
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($combined)

    # SHA256 hashing
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha.ComputeHash([byte[]]$bytes)

    return [BitConverter]::ToString($hashBytes)
}

# ------------------------------------------------------------
# Main Loop
# ------------------------------------------------------------
while ($true) {

    $currentHash = ComputeSnapshotHash
    $now = Get-Date
    $sinceLastPush = ($now - $lastPushTime).TotalHours

    if ($sinceLastPush -ge $intervalHours) {

        if ($currentHash -ne $lastSnapshot) {

            Write-Host "Changes detected. Saving and pushing..."

            Set-Location $path

            git add .

            $msg = "auto-save $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
            git commit -m $msg --allow-empty
            git push

            Write-Host "Auto-saved at $now"

            $lastSnapshot = $currentHash

        } else {

            Write-Host "No important changes in the last 12 hours."

        }

        $lastPushTime = $now
    }

    Start-Sleep -Seconds 30
}
