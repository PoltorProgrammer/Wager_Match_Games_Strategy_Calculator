# Wager_Match_Games_Strategy_Calculator

[![Play Game](https://img.shields.io/badge/Play-Calculator-brightgreen?style=for-the-badge&logo=html5)](https://poltorprogrammer.github.io/Wager_Match_Games_Strategy_Calculator/)

A professional-grade bankroll management tool designed for **Wager-Match Games**. It uses real-time statistical analysis to help you decide which levels to play based on your historical performance and risk appetite.

## 🚀 Key Features

- **Automated EV Calculation**: Instantly know if a game level is profitable (+EV) or if house fees are working against you.
- **Risk of Ruin (RoR) Analysis**: Calculate exactly how much "cushion" you need to survive variance streaks.
- **Dynamic Recommendations**: Automatically highlights the highest level that is both profitable and safe for your current bankroll.
- **Customizable Stats**: Track your 1st, 2nd, and 3rd place finishes to build an accurate skill profile.
- **Flexible Configuration**: Adjust total players, paid positions, and prize pools to match different game economies.

## 📈 Mathematical Strategy

This tool implements several core betting and statistical concepts:

### 1. Expected Value (EV)
The calculator identifies your mathematical "edge."
> **Formula:** `EV = Σ (Position Probability × Net Profit) - Entry Fee`

### 2. Risk of Ruin
Uses the logarithmic risk formula to determine your safety threshold. Lowering your "Risk Tolerance" percentage increases the required bankroll for each level.
> **Formula:** `Req. Bankroll = (-ln(Risk) × Variance) / (2 × EV)`

### 3. Variance Management
Designed to handle "bad runs" by recommending only levels where you have enough "bullets" (entries) to withstand the natural fluctuations of the game.
