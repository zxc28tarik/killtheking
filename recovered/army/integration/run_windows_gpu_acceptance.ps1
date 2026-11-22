<#
.SYNOPSIS
  Kill the King - one-command Windows GPU + physical Escape + 240s FFA check.
.DESCRIPTION
  Builds SHA-pinned October A5 offline source and current isolated candidate;
  launches HEADED Microsoft Edge/Chrome and observes normal RAF rendering.
  Requires Node.js 22+, Python 3.9+, Git, and Edge (or Chrome).
  No password, admin access, or tokens are necessary for public repo cloning.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\recovered\army\integration\run_windows_gpu_acceptance.ps1
.EXAMPLE
  .\recovered\army\integration\run_windows_gpu_acceptance.ps1 -Browser chrome -SkipManualEscape
#>
[CmdletBinding()]
param(
  [ValidateSet("edge","chrome")][string]$Browser = "edge",
  [ValidateRange(5,90)][int]$MaxWallMinutes = 15,
  [switch]$SkipManualEscape,
  [string]$FfaSourceDir = "",
  [string]$CandidateHtml = "",
  [string]$EvidenceDir = ""
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\.."))
$expectedFfaSHA = "18dca2a895763f0955566f2fc90651f1ab1a98f86597e399cbac42ac2fc6f15a"
$expectedCandidateSHA = "6e5cd25ac217d032a190d499c1fb2aac61c5cff1d2a280793caab894c6448ded"
$originalBranch = "codex/a5-meadow-twentyfold-area"
$cloneDir = ""
function Check-Exit([string]$what) {
  if ($LASTEXITCODE -ne 0) { throw "$what failed with exit code $LASTEXITCODE" }
}
function Check-Hash([string]$path,[string]$expected,[string]$title) {
  if (!(Test-Path -LiteralPath $path -PathType Leaf)) { throw "$title not found: $path" }
  $sha = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  if ($sha -ne $expected) {
    throw "$title SHA-256 mismatch! Expected: $expected ; Actual: $sha. Stop, do not trust this build."
  }
  Write-Host "[SHA256 OK] $title $sha" -ForegroundColor Green
}
Push-Location $root
try {
  if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js missing; install Node.js 22+ first."
  }
  if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm missing; install Node.js with npm."
  }
  $nodeMajor = [int]((& node -p "process.versions.node.split('.')[0]").Trim())
  if ($nodeMajor -lt 22) { throw "Node.js 22+ required. Installed major version: $nodeMajor" }
  if ([string]::IsNullOrWhiteSpace($EvidenceDir)) {
    $EvidenceDir = Join-Path $PSScriptRoot ("windows-acceptance-evidence\" + (Get-Date -Format "yyyyMMdd-HHmmss"))
  }
  $EvidenceDir = [System.IO.Path]::GetFullPath($EvidenceDir)
  [System.IO.Directory]::CreateDirectory($EvidenceDir) | Out-Null
  $builtCandidate = Join-Path $PSScriptRoot "dist\KillTheKing_Birlesik_FFA_Ordu_G5_4_Aday.html"
  if (![string]::IsNullOrWhiteSpace($CandidateHtml)) {
    $builtCandidate = [System.IO.Path]::GetFullPath($CandidateHtml)
    Write-Host "Using previously-built candidate, after strict pinned SHA verification."
  } else {
    if ([string]::IsNullOrWhiteSpace($FfaSourceDir)) {
      if (!(Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git missing; install Git for Windows or supply -FfaSourceDir."
      }
      $cloneDir = Join-Path $env:TEMP ("ktk-a5-source-" + $PID)
      Write-Host "Cloning original game source to temporary directory..."
      & git clone --depth 1 --branch $originalBranch "https://github.com/zxc28tarik/killtheking.git" $cloneDir
      Check-Exit "git clone original A5 source"
      $FfaSourceDir = $cloneDir
    }
    $FfaSourceDir = [System.IO.Path]::GetFullPath($FfaSourceDir)
    if (!(Test-Path -LiteralPath (Join-Path $FfaSourceDir "tools\build_offline.py"))) {
      throw "Original A5 source directory incomplete: $FfaSourceDir"
    }
    $python = Get-Command py -ErrorAction SilentlyContinue
    if ($null -ne $python) {
      Write-Host "Building original A5 using py -3..."
      & py -3 (Join-Path $FfaSourceDir "tools\build_offline.py") --out "dist/KillTheKing_Oyna.html"
      Check-Exit "Original A5 builder"
    } else {
      $python = Get-Command python -ErrorAction SilentlyContinue
      if ($null -eq $python) { throw "Python 3.9+ is required." }
      & python (Join-Path $FfaSourceDir "tools\build_offline.py") --out "dist/KillTheKing_Oyna.html"
      Check-Exit "Original A5 builder"
    }
    $original = Join-Path $FfaSourceDir "dist\KillTheKing_Oyna.html"
    Check-Hash $original $expectedFfaSHA "Original October 2026 A5 HTML"
    Write-Host "Building current isolated FFA + G5.4 candidate..."
    & node (Join-Path $PSScriptRoot "build_isolated_launcher.mjs") $original $builtCandidate
    Check-Exit "Current isolated game launcher builder"
  }
  Check-Hash $builtCandidate $expectedCandidateSHA "Approved arena-only 0.5s candidate"
  Write-Host "Installing pinned QA browser driver if needed (Playwright 1.58.2)..."
  & npm install --no-save --no-package-lock "playwright@1.58.2"
  Check-Exit "npm install pinned Playwright"
  $env:KTK_WINDOWS_ACCEPTANCE_OUTPUT = $EvidenceDir
  $argsForNode = @(
    (Join-Path $PSScriptRoot "windows_gpu_acceptance.mjs"),
    $builtCandidate,
    "--browser=$Browser",
    "--max-wall-minutes=$MaxWallMinutes"
  )
  if ($SkipManualEscape) { $argsForNode += "--skip-manual-escape" }
  Write-Host ""
  Write-Host "Windows GPU + physical ESC + native 240 game seconds QA:" -ForegroundColor Cyan
  Write-Host "When Edge/Chrome opens, move mouse and press Escape PHYSICALLY in the game."
  Write-Host "The normal RAF and natural FFA match are measured without fast-forward."
  Write-Host "Evidence path: $EvidenceDir"
  & node @argsForNode
  Check-Exit "Windows browser acceptance"
  Write-Host ""
  Write-Host "QA files: $EvidenceDir" -ForegroundColor Green
  Write-Host "Report: windows-gpu-acceptance.md"
  Write-Host "This test never merges PR #48 or grants publication approval."
} finally {
  Pop-Location
  if (![string]::IsNullOrWhiteSpace($cloneDir) -and
      (Test-Path -LiteralPath $cloneDir -PathType Container)) {
    Remove-Item -LiteralPath $cloneDir -Force -Recurse -ErrorAction SilentlyContinue
  }
}
