@echo off
REM Start the local MySQL server used by the HeartBridge project.
REM Uses the local config and data directory; safe to run on this machine.

set MYSQLD="C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
set INI=C:\Users\30758\Doubao\mysql\my.ini

if not exist %MYSQLD% (
  echo mysqld.exe not found at %MYSQLD%
  echo Please edit start-mysql.cmd to point at your MySQL install.
  pause
  exit /b 1
)

echo Starting MySQL using %INI% ...
start "HeartBridge MySQL" %MYSQLD% --defaults-file="%INI%" --console
echo MySQL starting in a separate window. Wait a few seconds, then run the API and client.
exit /b 0
