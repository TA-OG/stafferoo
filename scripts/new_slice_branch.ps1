# new_slice_branch.ps1
# Usage: powershell -ExecutionPolicy Bypass -File scripts\new_slice_branch.ps1 <SliceNumber> <Slug>
# Example: powershell -ExecutionPolicy Bypass -File scripts\new_slice_branch.ps1 001 catch_up_baseline
# Creates and switches to a branch named slice_<number>_<slug>

param(
    [Parameter(Mandatory=$true)][string]$SliceNumber,
    [Parameter(Mandatory=$true)][string]$Slug
)

$branchName = "slice_${SliceNumber}_${Slug}"

Write-Host "Creating branch: $branchName" -ForegroundColor Cyan

git checkout -b $branchName
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create branch $branchName" -ForegroundColor Red
    exit 1
}

Write-Host "Switched to branch: $branchName" -ForegroundColor Green
