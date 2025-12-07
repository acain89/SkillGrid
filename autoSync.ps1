# Auto Git Sync Script for SkillGrid
$repo = "C:\SkillGrid"
Write-Host "Auto-sync started for $repo"

while ($true) {
    Start-Sleep -Seconds 3

    $status = git -C $repo status --porcelain

    if ($status) {
        git -C $repo add .
        git -C $repo commit -m "Auto-sync update"
        git -C $repo push
        Write-Host "Auto-sync: pushed changes at $(Get-Date)"
    }
}
