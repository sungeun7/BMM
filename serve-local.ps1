# BMM 폴더에서 HTTP로 정적 파일 제공 (npm 없이 사용)
# 실행: PowerShell에서 .\serve-local.ps1
# 또는: powershell -ExecutionPolicy Bypass -File .\serve-local.ps1
param(
    [int]$Port = 5173,
    [switch]$LocalOnly
)

# Do not call chcp or force UTF-8 here — broken PATH / mixed shells break chcp,
# and UTF-8 output + CP949 console causes mojibake. Messages below are ASCII-only.

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($PSScriptRoot)

function Get-SafeFilePath {
    param([string]$UrlPath)
    $rel = $UrlPath.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
    $combined = [IO.Path]::GetFullPath((Join-Path $root $rel))
    $rootFull = [IO.Path]::GetFullPath($root) + [IO.Path]::DirectorySeparatorChar
    if (-not ($combined + [IO.Path]::DirectorySeparatorChar).StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase) -and
        -not $combined.Equals($root, [StringComparison]::OrdinalIgnoreCase)) {
        return $null
    }
    return $combined
}

function Get-MimeType {
    param([string]$Path)
    switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        '.html' { return 'text/html; charset=utf-8' }
        '.js' { return 'text/javascript; charset=utf-8' }
        '.css' { return 'text/css; charset=utf-8' }
        '.json' { return 'application/json; charset=utf-8' }
        '.webmanifest' { return 'application/manifest+json; charset=utf-8' }
        '.png' { return 'image/png' }
        '.jpg' { return 'image/jpeg' }
        '.jpeg' { return 'image/jpeg' }
        '.gif' { return 'image/gif' }
        '.svg' { return 'image/svg+xml' }
        '.ico' { return 'image/x-icon' }
        '.woff' { return 'font/woff' }
        '.woff2' { return 'font/woff2' }
        default { return 'application/octet-stream' }
    }
}

function New-ListenerForPort {
    param([int]$Port, [bool]$AllInterfaces)
    $l = New-Object System.Net.HttpListener
    if ($AllInterfaces) {
        $l.Prefixes.Add("http://+:$Port/")
    } else {
        $l.Prefixes.Add("http://127.0.0.1:$Port/")
    }
    return $l
}

$bindAll = -not $LocalOnly
$listener = New-ListenerForPort -Port $Port -AllInterfaces $bindAll
try {
    $listener.Start()
} catch {
    if ($bindAll) {
        Write-Host "LAN listen failed (HTTP.sys URL ACL). Trying localhost only..."
        Write-Host "For phone on same WiFi, run once as Admin:"
        Write-Host "  netsh http add urlacl url=http://+:$Port/ user=Everyone"
        try { $listener.Close() } catch {}
        $listener = New-ListenerForPort -Port $Port -AllInterfaces $false
        try {
            $listener.Start()
        } catch {
            Write-Host "Could not bind port $Port (in use). Try: .\serve-local.ps1 -Port 8080"
            exit 1
        }
    } else {
        Write-Host "Could not bind port $Port (in use or need admin). Try: .\serve-local.ps1 -Port 8080"
        exit 1
    }
}

Write-Host ""
Write-Host "  BMM local server"
Write-Host "  This PC: http://127.0.0.1:$Port/"
$listeningAll = $false
foreach ($p in $listener.Prefixes) { if ($p -like 'http://+*') { $listeningAll = $true; break } }
if ($listeningAll) {
    try {
        $addrs = [System.Net.Dns]::GetHostEntry([System.Net.Dns]::GetHostName()).AddressList
        foreach ($a in $addrs) {
            if ($a.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork) {
                $ip = $a.IPAddressToString
                if ($ip -notlike '127.*') {
                    Write-Host "  Same WiFi / LAN: http://${ip}:$Port/"
                }
            }
        }
    } catch {}
    Write-Host "  If phone cannot connect: Windows Firewall may block port $Port (allow inbound)."
} else {
    Write-Host "  LAN access off (localhost only). Use -LocalOnly:`$false after netsh urlacl (see above)."
}
Write-Host "  Do not use file:// — use http:// above."
Write-Host "  Stop: Ctrl+C in this window"
Write-Host ""

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        try {
            $path = $req.Url.LocalPath
            if ($path -eq '/') { $path = '/index.html' }
            $file = Get-SafeFilePath -UrlPath $path
            if ($null -eq $file -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
                $res.StatusCode = 404
                $msg = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
                $res.ContentLength64 = $msg.Length
                $res.OutputStream.Write($msg, 0, $msg.Length)
            } else {
                $bytes = [IO.File]::ReadAllBytes($file)
                $res.ContentType = Get-MimeType -Path $file
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } finally {
            $res.Close()
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
