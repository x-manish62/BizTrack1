$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $projectRoot 'frontend'
Write-Host 'BizTrack first-time setup' -ForegroundColor Cyan
Write-Host 'Paste the Supabase Project URL and publishable/anon key. These are required for real login.'
$url = Read-Host 'Supabase Project URL (https://...supabase.co)'
$key = Read-Host 'Supabase publishable/anon key'
if ([string]::IsNullOrWhiteSpace($url) -or [string]::IsNullOrWhiteSpace($key)) {
  Write-Host 'Both values are required. Setup cancelled.' -ForegroundColor Yellow
  exit 1
}
$envContent = "VITE_SUPABASE_URL=$url`r`nVITE_SUPABASE_ANON_KEY=$key`r`n"
Set-Content -Path (Join-Path $frontend '.env.local') -Value $envContent -Encoding UTF8
Write-Host 'Configuration saved in frontend/.env.local' -ForegroundColor Green
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host 'Node.js/npm not detected. Install Node.js LTS from https://nodejs.org/ and rerun START_BIZTRACK_WINDOWS.bat' -ForegroundColor Yellow
  exit 1
}
Set-Location $frontend
Write-Host 'Installing project dependencies (first run may take a few minutes)...' -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Setup complete. Run START_BIZTRACK_WINDOWS.bat to launch BizTrack.' -ForegroundColor Green
