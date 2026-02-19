$ErrorActionPreference = "Stop"
$MAVEN_VERSION = "3.9.6"
$DIST_URL = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$MAVEN_VERSION/apache-maven-$MAVEN_VERSION-bin.zip"
$CACHE_DIR = Join-Path $PSScriptRoot ".mvn\cache"
$MAVEN_DIR = Join-Path $CACHE_DIR "apache-maven-$MAVEN_VERSION"
$MVN_CMD = Join-Path (Join-Path $MAVEN_DIR "bin") "mvn.cmd"

function Find-Maven {
    $mvn = Get-Command mvn -ErrorAction SilentlyContinue
    if ($mvn) { return $mvn.Source }
    if (Test-Path $MVN_CMD) { return $MVN_CMD }
    return $null
}

function Ensure-Maven {
    if (Test-Path $MAVEN_DIR) { return $MVN_CMD }
    Write-Host "Maven not found. Downloading Maven $MAVEN_VERSION (one-time)..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $CACHE_DIR | Out-Null
    $zipPath = Join-Path $CACHE_DIR "maven.zip"
    try {
        Invoke-WebRequest -Uri $DIST_URL -OutFile $zipPath -UseBasicParsing
    } catch {
        Write-Error "Failed to download Maven. Check your internet connection or install Maven and add it to PATH."
    }
    Expand-Archive -Path $zipPath -DestinationPath $CACHE_DIR -Force
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Write-Host "Maven ready." -ForegroundColor Green
    return $MVN_CMD
}

if (-not $env:JAVA_HOME) {
    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if (-not $javaCmd) {
        Write-Error "Java not found. Install JDK 17+ and set JAVA_HOME (or add java to PATH)."
    }
    Write-Host "JAVA_HOME is not set. Java was found at $($javaCmd.Source). Consider setting JAVA_HOME." -ForegroundColor Yellow
}

$mvn = Find-Maven
if (-not $mvn) { $mvn = Ensure-Maven }

# Load .env if exists
if (Test-Path ".env") {
    Write-Host "Loading .env file..." -ForegroundColor Cyan
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        }
    }
    if ($env:GEMINI_API_KEY) {
        Write-Host "GEMINI_API_KEY loaded: $($env:GEMINI_API_KEY.Substring(0, 5))..." -ForegroundColor Green
    } else {
        Write-Host "GEMINI_API_KEY NOT loaded." -ForegroundColor Red
    }
}

# Kill process on port 5000 if exists
$port = 5000
$tcpConnection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($tcpConnection) {
    $pidToKill = $tcpConnection.OwningProcess
    Write-Host "Port $port is in use by PID $pidToKill. Killing process..." -ForegroundColor Yellow
    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Set-Location $PSScriptRoot
& $mvn spring-boot:run @args
