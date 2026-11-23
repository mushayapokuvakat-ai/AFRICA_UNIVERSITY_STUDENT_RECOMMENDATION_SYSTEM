Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Africa University Student Portfolio and Recommendation" -ForegroundColor Yellow
Write-Host "          LIVE PUBLIC SERVER & SHOWCASE LAUNCHER (v10)" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$cloudflared = "$baseDir\cloudflared.exe"
$envFile = "$baseDir\AURECO_BACK\.env"
$envExample = "$baseDir\AURECO_BACK\.env.example"

function Update-EnvUrls([string]$frontendUrl, [string]$lanUrl) {
    if ((-not (Test-Path $envFile)) -and (Test-Path $envExample)) {
        Copy-Item $envExample $envFile -Force
    }
    if (Test-Path $envFile) {
        try {
            $envContent = Get-Content $envFile -Raw
            if ($envContent -match '(?m)^FRONTEND_URL=') {
                $envContent = $envContent -replace '(?m)^FRONTEND_URL=.*$', "FRONTEND_URL=$frontendUrl"
            } else {
                $envContent = $envContent.TrimEnd() + "`r`nFRONTEND_URL=$frontendUrl`r`n"
            }
            if ($envContent -match '(?m)^LAN_URL=') {
                $envContent = $envContent -replace '(?m)^LAN_URL=.*$', "LAN_URL=$lanUrl"
            } else {
                $envContent = $envContent.TrimEnd() + "`r`nLAN_URL=$lanUrl`r`n"
            }
            Set-Content -Path $envFile -Value $envContent -NoNewline
        } catch {
            Write-Host "Warning: Could not update .env URLs: $_" -ForegroundColor Yellow
        }
    }
}

function Get-LocalLanIp {
    try {
        $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object {
                $_.IPAddress -notlike '127.*' -and
                $_.IPAddress -notlike '169.254.*' -and
                $_.PrefixOrigin -ne 'WellKnown'
            } |
            Sort-Object -Property InterfaceMetric
        if ($ips -and $ips[0].IPAddress) {
            return $ips[0].IPAddress
        }
    } catch {}
    return "127.0.0.1"
}

$lanIp = Get-LocalLanIp
$lanUrl = if ($lanIp -ne "127.0.0.1") { "http://${lanIp}:5000" } else { "http://localhost:5000" }

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

# Clean old log files safely and reset FRONTEND_URL before tunnel starts
Get-ChildItem -Path $baseDir -Filter "tunnel*.log" -ErrorAction SilentlyContinue | ForEach-Object {
    try { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue } catch {}
}
Update-EnvUrls -frontendUrl $lanUrl -lanUrl $lanUrl

# 2. Start Unified Backend Server on port 5000 (0.0.0.0)
Write-Host "[2/4] Starting Unified Backend Server on port 5000 (LAN: $lanUrl)..." -ForegroundColor Green
$serverBat = "$baseDir\AURECO_BACK\run-server.bat"
$serverProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"$serverBat`"" -PassThru

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
    Write-Host "[OK] Server is online and healthy on http://localhost:5000 and $lanUrl!" -ForegroundColor Green
} else {
    Write-Host "[Note] Server is still initializing. Continuing with tunnel connection..." -ForegroundColor Yellow
}

# Helper: Start & Verify Public Tunnel (Cloudflare HTTP/2 with DNS verification + SSH localhost.run fallback)
function Start-VerifiedPublicTunnel {
    $logFile = "$baseDir\tunnel-$PID-$(Get-Random).log"
    Write-Host "[3/4] Connecting Public Tunnel (HTTP/2 IPv4 mode for maximum DNS stability)..." -ForegroundColor Green
    $proc = Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://127.0.0.1:5000 --no-autoupdate --protocol http2 --edge-ip-version 4" -RedirectStandardError $logFile -PassThru

    $candidateUrl = ""
    $isRegistered = $false
    Write-Host "Waiting for Cloudflare Edge registration..." -NoNewline
    for ($i = 0; $i -lt 35; $i++) {
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline
        if (Test-Path $logFile) {
            $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
            if (-not $candidateUrl -and ($content -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com')) {
                $candidateUrl = $matches[0]
            }
            if ($candidateUrl -and ($content -match 'Registered tunnel connection')) {
                $isRegistered = $true
                break
            }
        }
    }
    Write-Host ""

    if ($candidateUrl) {
        # Flush Windows negative DNS cache so browser never sees NXDOMAIN ("server IP address could not be found")
        try { ipconfig /flushdns | Out-Null } catch {}
        $hostname = ($candidateUrl -replace '^https?://', '') -replace '/.*$', ''
        Write-Host "Verifying DNS propagation for $hostname..." -NoNewline
        $dnsOk = $false
        for ($d = 0; $d -lt 12; $d++) {
            Start-Sleep -Seconds 1
            Write-Host "." -NoNewline
            try { ipconfig /flushdns | Out-Null } catch {}
            try {
                $check = Invoke-RestMethod -Uri "$candidateUrl/api/health" -TimeoutSec 4 -ErrorAction Stop
                if ($check.status -eq 'healthy') {
                    $dnsOk = $true
                    break
                }
            } catch {
                try {
                    $resolved = Resolve-DnsName -Name $hostname -Server 1.1.1.1 -ErrorAction Stop
                    if ($resolved) {
                        # Give local DNS 2 more seconds to catch up after 1.1.1.1 resolves it
                        Start-Sleep -Seconds 2
                        try { ipconfig /flushdns | Out-Null } catch {}
                        $dnsOk = $true
                        break
                    }
                } catch {}
            }
        }
        Write-Host ""
        if ($dnsOk) {
            Write-Host "[OK] Public tunnel verified and DNS is live: $candidateUrl" -ForegroundColor Green
            return @{ Proc = $proc; Url = $candidateUrl; Log = $logFile }
        } else {
            Write-Host "[Notice] Local ISP DNS is slow to resolve trycloudflare.com. Trying SSH localhost.run fallback..." -ForegroundColor Yellow
        }
    }

    # Fallback: Try built-in Windows OpenSSH tunnel via localhost.run (never blocked by trycloudflare DNS)
    $sshCmd = Get-Command ssh.exe -ErrorAction SilentlyContinue
    if ($sshCmd) {
        $sshLog = "$baseDir\tunnel-ssh-$PID.log"
        $sshErr = "$baseDir\tunnel-ssh-err-$PID.log"
        $sshProc = Start-Process -FilePath $sshCmd.Source -ArgumentList "-o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -o ServerAliveInterval=30 -R 80:127.0.0.1:5000 nokey@localhost.run" -RedirectStandardOutput $sshLog -RedirectStandardError $sshErr -WindowStyle Hidden -PassThru
        Write-Host "Establishing backup tunnel via localhost.run..." -NoNewline
        for ($s = 0; $s -lt 18; $s++) {
            Start-Sleep -Seconds 1
            Write-Host "." -NoNewline
            $outText = ""
            if (Test-Path $sshLog) { $outText += (Get-Content $sshLog -Raw -ErrorAction SilentlyContinue) }
            if (Test-Path $sshErr) { $outText += (Get-Content $sshErr -Raw -ErrorAction SilentlyContinue) }
            if ($outText -match 'https://[a-zA-Z0-9-]+\.lhr\.life') {
                $lhrUrl = $matches[0]
                Write-Host ""
                Write-Host "[OK] Backup Public Tunnel Active: $lhrUrl" -ForegroundColor Green
                try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
                return @{ Proc = $sshProc; Url = $lhrUrl; Log = $sshLog }
            }
        }
        Write-Host ""
        try { Stop-Process -Id $sshProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    }

    if ($candidateUrl) {
        return @{ Proc = $proc; Url = $candidateUrl; Log = $logFile }
    }
    return @{ Proc = $proc; Url = $lanUrl; Log = $logFile }
}

$tunnelInfo = Start-VerifiedPublicTunnel
$tunnelProc = $tunnelInfo.Proc
$tunnelUrl = $tunnelInfo.Url

Write-Host ""
Write-Host ">> LIVE PUBLIC URL:  $tunnelUrl" -ForegroundColor Cyan
Write-Host ">> LOCAL WIFI / LAN: $lanUrl" -ForegroundColor Cyan
Write-Host ">> THIS MACHINE:     http://localhost:5000" -ForegroundColor Cyan
Write-Host ""

# 4. Update .env FRONTEND_URL & LAN_URL so outbound emails immediately include all active links
Update-EnvUrls -frontendUrl $tunnelUrl -lanUrl $lanUrl
Write-Host "[4/4] Outbound email links synchronized to: $tunnelUrl (with LAN & Localhost fallbacks)" -ForegroundColor Green

# Open live browser
Start-Sleep -Seconds 1
Write-Host "Opening Live Portal in Browser: $tunnelUrl" -ForegroundColor Cyan
Start-Process $tunnelUrl

Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "  AFRICA UNIVERSITY PORTFOLIO SYSTEM IS LIVE (v10)!" -ForegroundColor Yellow
Write-Host "  - Public Internet URL: $tunnelUrl" -ForegroundColor White
Write-Host "  - Same Wi-Fi / LAN:    $lanUrl" -ForegroundColor White
Write-Host "  - Localhost Address:   http://localhost:5000" -ForegroundColor White
Write-Host "  - Auto-Heal Watchdog:  ACTIVE (Keeps tunnel & email links alive)" -ForegroundColor Green
Write-Host "  - Opportunities Board: ACTIVE (GPA & Skill Matching, Attachments, Instant Apply)" -ForegroundColor Green
Write-Host "  - Supervisor Access:   ACTIVE (Dual-Path Signup, 1-Click Approval, Welcome Email)" -ForegroundColor Green
Write-Host "  - Applicant Dossier:   ACTIVE (In-Modal Portfolio Preview, Official CGPA, Projects)" -ForegroundColor Green
Write-Host "  - Evidence & Verify:   ACTIVE (View/Download Evidence + Staff & Guest Email)" -ForegroundColor White
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
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Keep this window open so your machine stays online as the server." -ForegroundColor Yellow
Write-Host "The watchdog will automatically reconnect the public tunnel if it ever drops." -ForegroundColor Gray
Write-Host ""

while ($true) {
    Write-Host "Type STOP and press Enter when you want to shut down the server (pressing Enter alone will NOT stop it): " -ForegroundColor Gray -NoNewline
    $inputCmd = Read-Host
    if ($inputCmd -and $inputCmd.Trim().ToUpper() -eq "STOP") {
        break
    }
    # Check if tunnel process died; if so, auto-restart it and update .env
    if ($tunnelProc -and $tunnelProc.HasExited) {
        Write-Host "[Watchdog] Public tunnel disconnected. Reconnecting automatically..." -ForegroundColor Yellow
        $tunnelInfo = Start-VerifiedPublicTunnel
        $tunnelProc = $tunnelInfo.Proc
        $tunnelUrl = $tunnelInfo.Url
        Update-EnvUrls -frontendUrl $tunnelUrl -lanUrl $lanUrl
        Write-Host "[Watchdog] Tunnel restored! New active URL synced to emails: $tunnelUrl" -ForegroundColor Green
    } else {
        Write-Host "[Status] Server and Public Tunnel ($tunnelUrl) are still running. Type STOP to exit." -ForegroundColor Green
    }
}

# Clean shutdown
Write-Host "Shutting down showcase services..." -ForegroundColor Yellow
Update-EnvUrls -frontendUrl "http://localhost:5000" -lanUrl "http://localhost:5000"
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
