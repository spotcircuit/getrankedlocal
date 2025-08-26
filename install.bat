@echo off
echo Installing Sales Funnel App dependencies...
echo.

REM Clean install
if exist node_modules (
    echo Cleaning old installation...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    del package-lock.json
)

echo Installing packages...
npm install

echo.
echo Installation complete!
echo To start the app, run: start.bat
pause