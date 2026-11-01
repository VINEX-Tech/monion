#!/usr/bin/env bash
set -euo pipefail
command -v adb >/dev/null
adb devices -l
adb reverse tcp:3000 tcp:3000
echo 'API available to the USB device at http://127.0.0.1:3000/v1'
