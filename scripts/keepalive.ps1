# Haelt die vier Demo-Server am Leben: prueft alle 20 s per HTTP, startet einen Server neu, wenn er zweimal
# hintereinander nicht antwortet. Muss mit pwsh (PowerShell 7) laufen; unter Windows PowerShell 5.1 bricht es ab.
# Vom Claude-Code-/IDE-Prozess abkoppeln (ueberlebt das Schliessen der Session), in pwsh ausfuehren:
#   Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '"C:\Program Files\PowerShell\7\pwsh.exe" -NoProfile -NoExit -ExecutionPolicy Bypass -File "<repo>\scripts\keepalive.ps1"' }
# Oder einfach in einem eigenen Terminal: pwsh -NoProfile -ExecutionPolicy Bypass -File scripts\keepalive.ps1
# Log: %TEMP%\hlb_keepalive.log
$root = Split-Path -Parent $PSScriptRoot
$rag  = Join-Path $root 'rag-service'
$ekep = Join-Path (Split-Path -Parent $root) 'expert-knowledge-platform\ekep'
$dash = Join-Path (Split-Path -Parent $root) 'helaba-knowledge-intelligence'
if (-not (Test-Path $dash)) { $dash = Join-Path $root 'dashboard' }
$ragPy = Join-Path $env:USERPROFILE '.venvs\helaba-rag\Scripts\python.exe'
if (-not (Test-Path $ragPy)) { $ragPy = Join-Path $rag '.venv\Scripts\python.exe' }
$log = Join-Path $env:TEMP 'hlb_keepalive.log'

$services = @(
  @{ name='RAG 8001';       port=8001; url='http://127.0.0.1:8001/health';     dir=$rag;                        cmd="& '$ragPy' -m uvicorn app.main:app --port 8001" },
  @{ name='Backend 8000';   port=8000; url='http://127.0.0.1:8000/api/health'; dir=(Join-Path $ekep 'backend');  cmd="& .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000" },
  @{ name='Frontend 3000';  port=3000; url='http://127.0.0.1:3000/';           dir=(Join-Path $ekep 'frontend'); cmd="npm run dev" },
  @{ name='Dashboard 5173'; port=5173; url='http://127.0.0.1:5173/';           dir=$dash;                       cmd="npm run dev -- --host 127.0.0.1 --port 5173" }
)

function Log($m) { $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $m"; Write-Host $line; Add-Content -Path $log -Value $line }
function Healthy($s) {
  try { $r = Invoke-WebRequest -Uri $s.url -UseBasicParsing -TimeoutSec 15; return ($r.StatusCode -eq 200) } catch { return $false }
}
function Kill-Port($port) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { try { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } catch {} }
}
function Launch($s) {
  if ($s.port -eq 3000) { Remove-Item -Recurse -Force (Join-Path $s.dir '.next') -ErrorAction SilentlyContinue }
  Start-Process powershell -WindowStyle Minimized -ArgumentList '-NoExit', '-Command',
    "`$host.UI.RawUI.WindowTitle = '$($s.name)'; Set-Location '$($s.dir)'; `$env:PYTHONIOENCODING='utf-8'; $($s.cmd)"
  Log "started $($s.name)"
}

$fails = @{}
foreach ($s in $services) { $fails[$s.name] = 0 }
Log "keepalive started (root=$root)"
foreach ($s in $services) { if (-not (Healthy $s)) { Kill-Port $s.port; Launch $s; Start-Sleep -Seconds 3 } else { Log "ok $($s.name)" } }

while ($true) {
  Start-Sleep -Seconds 20
  foreach ($s in $services) {
    if (Healthy $s) { $fails[$s.name] = 0; continue }
    $fails[$s.name]++
    Log "unhealthy $($s.name) ($($fails[$s.name]))"
    if ($fails[$s.name] -ge 2) { Kill-Port $s.port; Launch $s; $fails[$s.name] = 0 }
  }
}
