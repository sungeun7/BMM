@echo off
setlocal
cd /d "%~dp0"

REM PATH에 powershell이 없어도 동작하도록 전체 경로 사용 (32비트 CMD에서 Sysnative)
set "PS1=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "PS2=%SystemRoot%\Sysnative\WindowsPowerShell\v1.0\powershell.exe"
set "PS3=%ProgramFiles%\PowerShell\7\pwsh.exe"

if exist "%PS1%" set "PS=%PS1%"
if not defined PS if exist "%PS2%" set "PS=%PS2%"
if not defined PS if exist "%PS3%" set "PS=%PS3%"

if defined PS (
  "%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-local.ps1"
  goto END
)

where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
  echo Using Node (serve-simple.js^)...
  node "%~dp0serve-simple.js"
  goto END
)

echo.
echo ERROR: Neither PowerShell nor node found.
echo.
echo 1) Install Node.js LTS: https://nodejs.org
echo    Then run: node serve-simple.js
echo.
echo 2) Check PowerShell exists:
echo    %SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe
echo.
pause
exit /b 1

:END
pause
