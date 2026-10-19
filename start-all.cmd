@echo off
setlocal
set ROOT=%~dp0
title HeartBridge - Start All

echo ============================================================
echo   HeartBridge Charity Events - one-click start
echo   MySQL + REST API (3000) + Website (8080)
echo ============================================================
echo.

REM ---- configurable paths (edit if your install differs) ----
set MYSQLD=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe
set MYSQLINI=C:\Users\30758\Doubao\mysql\my.ini

REM ---- check Node.js ----
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found on this computer.
  echo Install Node.js LTS from https://nodejs.org ^(choose "Add to PATH"^), then run this file again.
  echo.
  pause
  exit /b 1
)

REM ---- 1. start MySQL if port 3306 is not listening ----
powershell -NoProfile -Command "if((Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue).TcpTestSucceeded){exit 0}else{exit 1}"
if errorlevel 1 (
  echo [1/3] Starting MySQL...
  if not exist "%MYSQLD%" (
    echo [ERROR] mysqld.exe not found at "%MYSQLD%". Edit the MYSQLD path at the top of this file.
    pause
    exit /b 1
  )
  start "HeartBridge MySQL" "%MYSQLD%" --defaults-file="%MYSQLINI%" --console
) else (
  echo [1/3] MySQL already running.
)

REM ---- 2. start the REST API on port 3000 ----
if not exist "%ROOT%api\node_modules" (
  echo       Installing API dependencies ^(first run only^)...
  pushd "%ROOT%api"
  call npm install
  popd
)
powershell -NoProfile -Command "if((Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded){exit 0}else{exit 1}"
if errorlevel 1 (
  echo [2/3] Starting REST API on http://localhost:3000 ...
  start "HeartBridge API (3000)" /D "%ROOT%api" cmd /k npm start
) else (
  echo [2/3] REST API already running.
)

REM ---- 3. start the website on port 8080 ----
if not exist "%ROOT%clientside\node_modules" (
  echo       Installing website dependencies ^(first run only^)...
  pushd "%ROOT%clientside"
  call npm install
  popd
)
powershell -NoProfile -Command "if((Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue).TcpTestSucceeded){exit 0}else{exit 1}"
if errorlevel 1 (
  echo [3/3] Starting website on http://localhost:8080 ...
  start "HeartBridge Website (8080)" /D "%ROOT%clientside" cmd /k npm start
) else (
  echo [3/3] Website already running.
)

REM ---- wait until the API confirms the database is connected ----
echo.
echo Waiting for the API and database to become ready...
powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 40;$i++){ try { $j=(Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing -TimeoutSec 2).Content | ConvertFrom-Json; if($j.status -eq 'ok'){ $ok=$true; break } } catch {}; Start-Sleep -Milliseconds 800 }; if($ok){exit 0}else{exit 1}"
if errorlevel 1 (
  echo.
  echo [ERROR] The API/database did not become ready within ~30 seconds.
  echo Look at the "HeartBridge MySQL" and "HeartBridge API" windows for the reason.
  echo.
  pause
  exit /b 1
)

REM ---- open the website in the default browser ----
echo.
echo Everything is ready. Opening the website in your browser...
start "" "http://localhost:8080"
echo.
echo IMPORTANT: leave the three windows ^(MySQL / API / Website^) open while you use the site.
echo Close those windows when you are done.
echo.
timeout /t 8 >nul
endlocal
