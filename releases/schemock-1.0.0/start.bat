@echo off
title Schemock Mock Server
echo Starting Schemock Mock Server...
echo.
echo Usage:
echo   schemock.exe start [schema-file.json]
echo   schemock.exe --help
echo.
echo Starting with example schema...
schemock.exe start examples/user-schema.json
pause
