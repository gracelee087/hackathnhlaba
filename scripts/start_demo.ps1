# Startet die vier Demo-Server in eigenen PowerShell-Fenstern (unabhängig von Claude Code / IDE).
# Erwartete Ordner: dieses Repo, daneben ..\expert-knowledge-platform\ekep und ..\helaba-knowledge-intelligence
# (oder dashboard\ in diesem Repo), Python-venv fuer den RAG-Service unter %USERPROFILE%\.venvs\helaba-rag
# (oder rag-service\.venv). Reihenfolge: 8001 -> 8000 -> 3000 -> 5173. Fenster offen lassen.
$root = Split-Path -Parent $PSScriptRoot
$rag = Join-Path $root 'rag-service'
$ekep = Join-Path (Split-Path -Parent $root) 'expert-knowledge-platform\ekep'
$dash = Join-Path (Split-Path -Parent $root) 'helaba-knowledge-intelligence'
if (-not (Test-Path $dash)) { $dash = Join-Path $root 'dashboard' }
$ragPy = Join-Path $env:USERPROFILE '.venvs\helaba-rag\Scripts\python.exe'
if (-not (Test-Path $ragPy)) { $ragPy = Join-Path $rag '.venv\Scripts\python.exe' }

function Open-Server($title, $dir, $cmd) {
  Start-Process powershell -ArgumentList '-NoExit', '-Command',
    "`$host.UI.RawUI.WindowTitle = '$title'; Set-Location '$dir'; `$env:PYTHONIOENCODING='utf-8'; $cmd"
}

Open-Server 'RAG 8001'      $rag                        "& '$ragPy' -m uvicorn app.main:app --port 8001"
Start-Sleep -Seconds 3
Open-Server 'Backend 8000'  (Join-Path $ekep 'backend')  "& .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"
Start-Sleep -Seconds 3
Open-Server 'Frontend 3000' (Join-Path $ekep 'frontend') "npm run dev"
Open-Server 'Dashboard 5173' $dash                      "npm run dev"
Write-Host "Vier Fenster gestartet. Pruefen: http://localhost:8001/health  http://localhost:8000/api/health  http://localhost:3000  http://localhost:5173"
