@echo off
echo.
echo ========================================
echo   RootShare Feed Seed Script
echo ========================================
echo.

REM Try Docker first (most common setup)
docker exec -i rootshare-mongodb mongosh "mongodb://rootshare:rootshare123@localhost:27017/rootshare?authSource=admin" < "%~dp0seed-feed.js"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Docker method failed. Trying direct mongosh...
    mongosh "mongodb://rootshare:rootshare123@localhost:27017/rootshare?authSource=admin" "%~dp0seed-feed.js"
)

echo.
echo ========================================
echo   Seed script completed!
echo ========================================
pause
