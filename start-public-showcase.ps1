Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Africa University Student Portfolio and Recommendation" -ForegroundColor Yellow
Write-Host "             LIVE PUBLIC SHOWCASE LAUNCHER (v9)" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$cloudflared = "$baseDir\cloudflared.exe"
$logFile = "$baseDir\tunnel-$PID.log"

# 0. Auto-setup after fresh git clone (install node_modules and cloudflared.exe if missing)
if (-not (Test-Path "$baseDir\AURECO_BACK\node_modules")) {
    Write-Host "[Setup] First-time run detected: Installing backend dependencies (npm install)..." -ForegroundColor Cyan
    Push-Location "$baseDir\AURECO_BACK"
    npm install
    Pop-Location
}

if (-not (Test-Path $cloudflared)) {
    Write-Host "[Setup] Downloading Cloudflare Tunnel binary (cloudflared.exe)..." -ForegroundColor Cyan
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflared
}

# 1. Cleanly stop prior instances and ensure port 5000 is free
Write-Host "[1/4] Ensuring clean ports and stopping prior instances..." -ForegroundColor Yellow
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue

try {
    $connections = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 4 }
        foreach ($procId in $pids) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
} catch {}

Start-Sleep -Milliseconds 500

# Clean old log files safely
Get-ChildItem -Path $baseDir -Filter "tunnel*.log" -ErrorAction SilentlyContinue | ForEach-Object {
    try { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue } catch {}
}

# 2. Start Unified Backend Server FIRST on port 5000 so endpoints are hot before tunneling
Write-Host "[2/4] Starting Unified Backend Server on port 5000..." -ForegroundColor Green
$serverBat = "$baseDir\AURECO_BACK\run-server.bat"
$serverProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"$serverBat`"" -PassThru

# Wait for server health verification
Write-Host "Verifying server readiness..." -NoNewline
$serverReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/health" -TimeoutSec 2 -ErrorAction Stop
        if ($res.status -eq 'healthy') {
            $serverReady = $true
            break
        }
    } catch {}
}
Write-Host ""

if ($serverReady) {
    Write-Host "[OK] Server is online and healthy on http://127.0.0.1:5000!" -ForegroundColor Green
} else {
    Write-Host "[Note] Server is still initializing. Continuing with tunnel connection..." -ForegroundColor Yellow
}

# 3. Start Cloudflare Public Tunnel connecting to the live server
Write-Host "[3/4] Connecting Cloudflare Public Tunnel to server..." -ForegroundColor Green
$tunnelProc = Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://127.0.0.1:5000 --no-autoupdate" -RedirectStandardError $logFile -PassThru

$tunnelUrl = ""
Write-Host "Establishing Cloudflare Global Edge Route..." -NoNewline
for ($i = 0; $i -lt 35; $i++) {
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
            $tunnelUrl = $matches[0]
            break
        }
    }
}
Write-Host ""

if (-not $tunnelUrl) {
    Write-Host "WARNING: Cloudflare tunnel took longer than expected." -ForegroundColor Yellow
    Write-Host "You can access the system locally right now at: http://localhost:5000" -ForegroundColor Cyan
    Start-Process "http://localhost:5000"
    Read-Host "Press Enter when done presenting to stop all services"
    try { Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    exit 0
}

Write-Host ">> LIVE PUBLIC URL: $tunnelUrl" -ForegroundColor Cyan
Write-Host ""

# 4. Update .env FRONTEND_URL so outbound emails include the active public link
$envFile = "$baseDir\AURECO_BACK\.env"
$envExample = "$baseDir\AURECO_BACK\.env.example"
if ((-not (Test-Path $envFile)) -and (Test-Path $envExample)) {
    Copy-Item $envExample $envFile -Force
}
if (Test-Path $envFile) {
    try {
        $envContent = Get-Content $envFile -Raw
        $envContent = $envContent -replace 'FRONTEND_URL=.*', "FRONTEND_URL=$tunnelUrl"
        Set-Content -Path $envFile -Value $envContent -NoNewline
        Write-Host "[4/4] Outbound email links synchronized to: $tunnelUrl" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Could not update .env FRONTEND_URL: $_" -ForegroundColor Yellow
    }
}

# Open live browser to the public URL
Start-Sleep -Seconds 1
Write-Host "Opening Live Portal in Browser: $tunnelUrl" -ForegroundColor Cyan
Start-Process $tunnelUrl

Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "  AFRICA UNIVERSITY PORTFOLIO SYSTEM IS LIVE (v9)!" -ForegroundColor Yellow
Write-Host "  - Public Showcase URL: $tunnelUrl" -ForegroundColor White
Write-Host "  - Local Address:       http://localhost:5000" -ForegroundColor White
Write-Host "  - Opportunities Board: ACTIVE (GPA & Skill Matching, Attachments, Instant Apply)" -ForegroundColor Green
Write-Host "  - Supervisor Access:   ACTIVE (Dual-Path Signup, 1-Click Approval, Welcome Email)" -ForegroundColor Green
Write-Host "  - Applicant Dossier:   ACTIVE (In-Modal Portfolio Preview, Official CGPA, Projects)" -ForegroundColor Green
Write-Host "  - AU Transcripts:      ACTIVE (Semester Courses + PDF + QR Verification)" -ForegroundColor White
Write-Host "  - Evidence & Verify:   ACTIVE (View/Download Evidence + Staff & Guest Email)" -ForegroundColor White
Write-Host "  - Responsive Design:   ACTIVE (Mobile, Tablet, and Laptop)" -ForegroundColor White
Write-Host "  - Direct File Upload:  ACTIVE (Drag and drop in textbox)" -ForegroundColor White
Write-Host "  - Real-time Gmail:     ACTIVE (mushayapokuvakat@africau.edu)" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "DEMO CREDENTIALS QUICK REFERENCE (Password for all: demo1234):" -ForegroundColor Cyan
Write-Host "  [Supervisor] careers@econet.co.zw        (Eng. Farai Chirume - Econet)" -ForegroundColor White
Write-Host "  [Supervisor] casey.brooks@acme.example   (Casey Brooks - Cassava / Acme)" -ForegroundColor White
Write-Host "  [Staff]      riley.adams@school.edu      (Dr. Riley Adams - CS Dept)" -ForegroundColor White
Write-Host "  [Staff]      innovation@africau.edu      (Prof. Simba Muronda - AgriTech)" -ForegroundColor White
Write-Host "  [Admin]      scholarships@africau.edu    (AU Scholarships & Aid Office)" -ForegroundColor White
Write-Host "  [Admin]      quinn.moyer@school.edu      (Quinn Moyer - Registry)" -ForegroundColor White
Write-Host "  [Student]    2023-0148                   (Jordan Lee - Year 3 CS)" -ForegroundColor White
Write-Host "  *(Role auto-detection is active: signing in routes to your role automatically)*" -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Keep this window open while presenting or testing." -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter when you are done presenting to stop all services"

# Clean shutdown
Write-Host "Shutting down showcase services..." -ForegroundColor Yellow
try { Stop-Process -Id $tunnelProc.Id -Force -ErrorAction SilentlyContinue } catch {}
try { Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue } catch {}
try {
    $connections = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 4 }
        foreach ($procId in $pids) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
} catch {}
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
Write-Host "Showcase stopped cleanly." -ForegroundColor Green
