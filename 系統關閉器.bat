@echo off
chcp 65001 >nul
title 關閉庫存管理系統

echo ================================================
echo.
echo        庫存管理系統 - 關閉程式
echo.
echo ================================================
echo.

:: 關閉後端服務
echo 關閉後端服務...
taskkill /f /fi "WINDOWTITLE eq 後端服務*" 2>nul
taskkill /f /im node.exe 2>nul

:: 等待一下
timeout /t 1 /nobreak >nul

:: 關閉前端服務
echo 關閉前端服務...
taskkill /f /fi "WINDOWTITLE eq 前端服務*" 2>nul

:: 等待一下
timeout /t 1 /nobreak >nul

:: 關閉瀏覽器（可選）
echo 關閉瀏覽器...
taskkill /f /im chrome.exe 2>nul

:: 再次確認關閉 Node 進程
taskkill /f /im node.exe 2>nul

echo.
echo ================================================
echo        系統已關閉！
echo ================================================
echo.
echo 按任意鍵結束...
pause >nul