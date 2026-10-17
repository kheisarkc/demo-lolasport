@echo off
cd /d "%~dp0"
codex -C "%~dp0."
if errorlevel 1 pause
