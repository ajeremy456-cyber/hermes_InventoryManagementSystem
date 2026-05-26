@echo off
chcp 65001 >nul
title 庫存管理系統安裝與啟動中...

:: 取得腳本所在目錄
set SCRIPT_DIR=%~dp0
set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

:: 設定路徑
set SERVER_DIR=%SCRIPT_DIR%\server
set CLIENT_DIR=%SCRIPT_DIR%\client

echo ================================================
echo.
echo        庫存管理系統 - 自動安裝與啟動程式
echo.
echo ================================================
echo.

:: 檢查 Node.js 是否已安裝
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [檢測] Node.js 未安裝，開始自動安裝...
    echo.
    echo 請稍候，這會下載並安裝 Node.js（約 30MB）
    echo.

    :: 下載 Node.js 14 LTS
    echo [1/4] 下載 Node.js...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v14.21.3/node-v14.21.3-x64.msi' -OutFile '%TEMP%\node-setup.msi'"
    
    :: 安裝 Node.js（靜默安裝）
    echo [2/4] 安裝 Node.js...
    msiexec /i "%TEMP%\node-setup.msi" /quiet /norestart
    
    :: 等待安裝完成
    echo [3/4] 等待安裝完成...
    timeout /t 10 /nobreak >nul
    
    :: 刪除安裝檔
    del "%TEMP%\node-setup.msi" 2>nul
    
    :: 重新整理環境變數
    echo [4/4] 設定環境...
    set PATH=C:\Program Files\nodejs;%PATH%
    
    echo.
    echo [完成] Node.js 安裝成功！
    echo.
) else (
    echo [檢測] Node.js 已安裝
    for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
    echo        版本：%NODE_VERSION%
    echo.
)

:: 設定 Node 路徑
set PATH=C:\Program Files\nodejs;%PATH%

:: 安裝後端依賴
echo ================================================
echo [1/3] 檢查後端依賴...
echo ================================================
cd /d "%SERVER_DIR%"
if not exist "node_modules" (
    echo        正在安裝後端依賴...
    call npm install
) else (
    echo        後端依賴已就緒
)
echo.

:: 安裝前端依賴
echo ================================================
echo [2/3] 檢查前端依賴...
echo ================================================
cd /d "%CLIENT_DIR%"
if not exist "node_modules" (
    echo        正在安裝前端依賴...
    call npm install
) else (
    echo        前端依賴已就緒
)
echo.

:: 啟動後端
echo ================================================
echo [3/3] 啟動系統服務...
echo ================================================
echo.
echo 啟動後端服務（資料庫）...
cd /d "%SERVER_DIR%"
start "後端服務" cmd /k "cd /d %SERVER_DIR% && node server.js"

timeout /t 3 /nobreak >nul

echo 啟動前端服務（網站）...
cd /d "%CLIENT_DIR%"
start "前端服務" cmd /k "cd /d %CLIENT_DIR% && npm run dev"

timeout /t 8 /nobreak >nul

:: 開啟瀏覽器
echo.
echo ================================================
echo        系統啟動完成！
echo ================================================
echo.
echo 正在開啟瀏覽器...
start http://localhost:5174

echo.
echo ================================================
echo.
echo        使用說明：
echo.
echo   1. 看到登入頁面了嗎？如果沒有，
echo      手動打開瀏覽器，訪問 http://localhost:3000
echo.
echo   2. 預設帳號密碼：
echo      帳號：admin
echo      密碼：admin123
echo.
echo   3. 用完後，關閉所有開啟的視窗即可
echo.
echo ================================================
echo.
echo 按任意鍵結束（系統會繼續在背景運行）
pause >nul