@echo off
setlocal
set ROOT=%~dp0
title HeartBridge - Live Video Checkpoint

echo ============================================================
echo   Live video checkpoint - proves you control this repository
echo ============================================================
echo.

echo Recorded by WU ZhengTao on %date% %time% > "%ROOT%docs\VIDEO-CHECKPOINT.txt"
echo This file is created live during the demonstration video. >> "%ROOT%docs\VIDEO-CHECKPOINT.txt"

git -C "%ROOT%" add docs/VIDEO-CHECKPOINT.txt
git -C "%ROOT%" commit -m "docs: add live video checkpoint (proof of ownership)"
git -C "%ROOT%" push origin main

echo.
echo Done. Refresh the GitHub commits page to see this new commit.
echo.
pause
endlocal
