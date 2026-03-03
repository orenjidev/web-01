@echo off
setlocal

set SOURCE=G:\WebDevelopment\RanWeb2026\ran-backend\assets\source-dds
set OUTPUT=G:\WebDevelopment\RanWeb2026\ran-backend\public\images\shop

echo SOURCE: %SOURCE%
echo OUTPUT: %OUTPUT%

if not exist "%SOURCE%" (
    echo SOURCE folder not found!
    pause
    exit
)

if not exist "%OUTPUT%" (
    echo Creating output folder...
    mkdir "%OUTPUT%"
)

echo Converting DDS files...

for %%f in ("%SOURCE%\*.dds") do (
    echo Converting %%~nxf ...
    magick "%%f" -quality 85 "%OUTPUT%\%%~nf.webp"
)

echo Done.
pause
