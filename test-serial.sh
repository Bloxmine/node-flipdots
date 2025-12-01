#!/bin/bash
# Test script to verify serial communication without real hardware

echo "Creating virtual serial ports..."

# Install socat if needed
if ! command -v socat &> /dev/null; then
    echo "Installing socat..."
    sudo apt-get update && sudo apt-get install -y socat
fi

# Create virtual serial port pair
# This creates /dev/ttyACM0 (for the app) and /dev/ttyACM1 (for monitoring)
sudo socat -d -d pty,raw,echo=0,link=/dev/ttyACM0 pty,raw,echo=0,link=/dev/ttyACM1 &
SOCAT_PID=$!

echo "Virtual serial ports created!"
echo "  - /dev/ttyACM0 (for flipdot app)"
echo "  - /dev/ttyACM1 (for monitoring)"
echo ""
echo "In another terminal, run:"
echo "  sudo cat /dev/ttyACM1 | xxd"
echo ""
echo "Then start your app with: npm run dev"
echo ""
echo "Press Ctrl+C to stop virtual ports..."

# Wait for interrupt
trap "sudo kill $SOCAT_PID 2>/dev/null; echo 'Virtual ports closed.'" EXIT
wait $SOCAT_PID
