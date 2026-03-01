@echo off
echo Starting Wager Match Game Strategy Calculator on port 2603...
start http://localhost:2603
python -m http.server 2603
