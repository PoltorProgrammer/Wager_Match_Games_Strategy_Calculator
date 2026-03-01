let CONFIG = {
    totalPlayers: 6,
    numPaidPositions: 3
};

let LEVELS = [
    { level: 1, fee: 90, prizes: [210, 150, 90] },
    { level: 2, fee: 225, prizes: [550, 388, 225] },
    { level: 3, fee: 700, prizes: [1700, 1200, 700] },
    { level: 4, fee: 1900, prizes: [4500, 3200, 1900] },
    { level: 5, fee: 3000, prizes: [7100, 5050, 3000] },
    { level: 6, fee: 3600, prizes: [8500, 6050, 3600] },
    { level: 7, fee: 4000, prizes: [9500, 6750, 4000] },
    { level: 8, fee: 5000, prizes: [12000, 8500, 5000] },
    { level: 9, fee: 6000, prizes: [15000, 10500, 6000] },
    { level: 10, fee: 7000, prizes: [17000, 12000, 7000] },
    { level: 11, fee: 8000, prizes: [19500, 13750, 8000] },
    { level: 12, fee: 10000, prizes: [24000, 17000, 10000] },
    { level: 13, fee: 12000, prizes: [29200, 20600, 12000] },
    { level: 14, fee: 13000, prizes: [32050, 22525, 13000] },
    { level: 15, fee: 50000, prizes: [133300, 91650, 50000] },
];

let HISTORICAL_DATA = [1, 1, 1, 3]; // Default for top 3 paid, 6 total (1st, 2nd, 3rd, Loss)

const DEFAULT_LEVELS = JSON.parse(JSON.stringify(LEVELS));

// DOM Elements
const inputs = {
    bankroll: document.getElementById('bankroll'),
    risk: document.getElementById('risk'),
};

const containers = {
    historyGrid: document.getElementById('history-grid'),
    recordButtons: document.getElementById('record-buttons'),
    headerRow: document.getElementById('header-row'),
    gameConfig: document.getElementById('game-config'),
    inputsConfig: {
        totalPlayers: document.getElementById('total-players-input'),
        numPaidPositions: document.getElementById('paid-positions-input')
    }
};

const output = {
    totalGames: document.getElementById('total-games'),
    winRate: document.getElementById('win-rate'),
    tableBody: document.querySelector('#level-table tbody'),
    recLevel: document.getElementById('rec-level'),
    recDesc: document.getElementById('rec-desc'),
    rorLabel: document.getElementById('ror-label'),
    recRor: document.getElementById('rec-ror'),
    explRor: document.getElementById('expl-ror'),
    explRorVal: document.getElementById('expl-ror-val'),
    activeLevelDisplay: document.getElementById('active-level-name'),
};

let activeLevel = LEVELS[0];
let editStats = false;
let editTable = false;

// Event Listeners
Object.values(inputs).forEach(input => {
    input.addEventListener('input', updateCalculator);
});

// Initialization
loadData();
renderDynamicUI();
updateCalculator();

function loadData() {
    const saved = localStorage.getItem('wager-match-data-v2');
    if (saved) {
        const data = JSON.parse(saved);
        if (data.bankroll !== undefined) inputs.bankroll.value = data.bankroll;
        if (data.risk !== undefined) inputs.risk.value = data.risk;
        if (data.config) CONFIG = data.config;
        if (data.historyData) HISTORICAL_DATA = data.historyData;
        if (data.customLevels) LEVELS = data.customLevels;

        editStats = !!data.editStats;
        editTable = !!data.editTable;

        if (editStats) document.getElementById('stats-panel').classList.add('edit-mode');
        if (editTable) document.getElementById('table-panel').classList.add('edit-mode');
    }
}

function saveData() {
    const data = {
        bankroll: inputs.bankroll.value,
        risk: inputs.risk.value,
        config: CONFIG,
        historyData: HISTORICAL_DATA,
        customLevels: LEVELS,
        editStats,
        editTable
    };
    localStorage.setItem('wager-match-data-v2', JSON.stringify(data));
}

function updateConfig(key, value) {
    CONFIG[key] = parseInt(value) || 0;

    // Validate: numPaidPositions < totalPlayers
    if (CONFIG.numPaidPositions >= CONFIG.totalPlayers) {
        CONFIG.numPaidPositions = CONFIG.totalPlayers - 1;
        containers.inputsConfig.numPaidPositions.value = CONFIG.numPaidPositions;
    }

    // Adjust HISTORICAL_DATA length if needed
    const requiredHistoryLength = CONFIG.numPaidPositions + 1; // Paid spots + 1 "Loss" spot
    while (HISTORICAL_DATA.length < requiredHistoryLength) {
        HISTORICAL_DATA.push(0);
    }
    if (HISTORICAL_DATA.length > requiredHistoryLength) {
        HISTORICAL_DATA.splice(requiredHistoryLength);
    }

    // Adjust LEVELS prizes length if needed
    LEVELS.forEach(level => {
        while (level.prizes.length < CONFIG.numPaidPositions) {
            level.prizes.push(level.fee); // Default to breakeven
        }
        if (level.prizes.length > CONFIG.numPaidPositions) {
            level.prizes.splice(CONFIG.numPaidPositions);
        }
    });

    renderDynamicUI();
    updateCalculator();
}

function renderDynamicUI() {
    // 1. History Grid
    containers.historyGrid.innerHTML = '';
    for (let i = 0; i <= CONFIG.numPaidPositions; i++) {
        const isLoss = i === CONFIG.numPaidPositions;
        const labelText = isLoss ?
            `${CONFIG.numPaidPositions + 1}-${CONFIG.totalPlayers} Place` :
            `${getOrdinal(i + 1)} Place`;
        const className = isLoss ? 'pos-loss' : `pos-${Math.min(i + 1, 3)}`;

        const group = document.createElement('div');
        group.className = 'input-group';
        group.innerHTML = `
            <label class="${className}">${labelText}</label>
            <input type="number" value="${HISTORICAL_DATA[i]}" min="0" oninput="updateHistory(${i}, this.value)">
        `;
        containers.historyGrid.appendChild(group);
    }

    // 2. Record Buttons
    containers.recordButtons.innerHTML = '';
    for (let i = 0; i <= CONFIG.numPaidPositions; i++) {
        const isLoss = i === CONFIG.numPaidPositions;
        const className = isLoss ? 'pos-loss' : `pos-${Math.min(i + 1, 3)}`;
        const buttonLabel = isLoss ? 'Loss' : getOrdinal(i + 1);

        const btn = document.createElement('button');
        btn.className = `btn ${className}`;
        btn.textContent = buttonLabel;
        btn.onclick = () => recordResult(i);
        containers.recordButtons.appendChild(btn);
    }

    // 3. Table Headers
    containers.headerRow.innerHTML = `
        <th>Level</th>
        <th>Fee</th>
        ${Array.from({ length: CONFIG.numPaidPositions }, (_, i) => `<th>${getOrdinal(i + 1)}</th>`).join('')}
        <th>Entries</th>
        <th>EV</th>
        <th>Req. Bankroll (<span id="ror-label">${inputs.risk.value}%</span> RoR)</th>
    `;

    // 4. Update config inputs values
    containers.inputsConfig.totalPlayers.value = CONFIG.totalPlayers;
    containers.inputsConfig.numPaidPositions.value = CONFIG.numPaidPositions;
    if (containers.gameConfig) containers.gameConfig.style.display = editStats ? 'block' : 'none';
}

function updateHistory(index, value) {
    HISTORICAL_DATA[index] = parseInt(value) || 0;
    updateCalculator();
}

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function calculateProbabilities() {
    const total = HISTORICAL_DATA.reduce((a, b) => a + b, 0);
    const winCount = HISTORICAL_DATA.slice(0, CONFIG.numPaidPositions).reduce((a, b) => a + b, 0);

    if (total === 0) {
        // Balanced initial guess
        const probs = HISTORICAL_DATA.map(() => 0);
        for (let i = 0; i < CONFIG.numPaidPositions; i++) probs[i] = 1 / CONFIG.totalPlayers;
        const lossProb = (CONFIG.totalPlayers - CONFIG.numPaidPositions) / CONFIG.totalPlayers;
        probs[CONFIG.numPaidPositions] = lossProb;

        return {
            actualTotal: 0,
            actualWinRate: 0,
            probs: probs,
            total: 0
        };
    }

    return {
        actualTotal: total,
        actualWinRate: winCount / total,
        probs: HISTORICAL_DATA.map(h => h / total),
        total: total
    };
}

function calculateExpectation(level, probsObj) {
    const prizes = level.prizes;
    const fee = level.fee;
    const probs = probsObj.probs;

    // EV = sum(P(x) * Profit(x))
    let ev = 0;
    for (let i = 0; i < CONFIG.numPaidPositions; i++) {
        ev += probs[i] * (prizes[i] - fee);
    }
    // Add loss cases
    ev += probs[CONFIG.numPaidPositions] * (-fee);

    // Variance = sum(P(x) * (Profit(x) - EV)^2)
    let variance = 0;
    for (let i = 0; i < CONFIG.numPaidPositions; i++) {
        variance += probs[i] * Math.pow((prizes[i] - fee) - ev, 2);
    }
    variance += probs[CONFIG.numPaidPositions] * Math.pow((-fee) - ev, 2);

    let riskPercentage = parseFloat(inputs.risk.value) / 100;
    if (isNaN(riskPercentage) || riskPercentage <= 0) riskPercentage = 0.0001;

    let requiredBankroll = Infinity;
    if (ev > 0) {
        requiredBankroll = (-Math.log(riskPercentage) * variance) / (2 * ev);
    }

    return { ev, requiredBankroll };
}

function updateCalculator() {
    const bankroll = parseFloat(inputs.bankroll.value) || 0;
    const probs = calculateProbabilities();
    saveData();

    output.totalGames.textContent = probs.total;
    const winRate = probs.actualWinRate * 100;
    output.winRate.textContent = `${winRate.toFixed(1)}%`;

    const riskVal = inputs.risk.value || 0;
    const currentRisk = riskVal + '%';
    if (output.rorLabel) output.rorLabel.textContent = currentRisk;
    if (output.recRor) output.recRor.textContent = currentRisk;
    if (output.explRor) output.explRor.textContent = currentRisk;
    if (output.explRorVal) output.explRorVal.textContent = currentRisk;

    if (output.tableBody) output.tableBody.innerHTML = '';
    let bestLevelFound = null;

    LEVELS.forEach(level => {
        const stats = calculateExpectation(level, probs);
        const minSafetyBankroll = level.fee * 3;
        const finalRequired = Math.max(stats.requiredBankroll, minSafetyBankroll);

        const evClass = stats.ev > 0 ? 'positive' : 'negative';
        const evDisplay = stats.ev > 0 ? `+${formatCurrency(stats.ev)}` : formatCurrency(stats.ev);
        const reqBrDisplay = stats.ev > 0 ? formatCurrency(finalRequired) : 'N/A (-EV)';

        const entriesLeft = Math.floor(bankroll / level.fee);
        const entriesClass = entriesLeft >= 3 ? 'positive' : (entriesLeft > 0 ? 'warning' : 'negative');

        const isAllowed = stats.ev > 0 && bankroll >= finalRequired;
        if (isAllowed) bestLevelFound = level;

        const tr = document.createElement('tr');
        tr.id = `row-level-${level.level}`;
        if (isAllowed) tr.classList.add('row-allowed');

        let prizesHTML = '';
        for (let i = 0; i < CONFIG.numPaidPositions; i++) {
            prizesHTML += `<td><input type="number" class="table-input" value="${level.prizes[i]}" oninput="updateLevelPrize(${level.level}, ${i}, this.value)"></td>`;
        }

        tr.innerHTML = `
            <td>#${level.level}</td>
            <td><input type="number" class="table-input" value="${level.fee}" oninput="updateLevelValue(${level.level}, 'fee', this.value)"></td>
            ${prizesHTML}
            <td class="${entriesClass}">${entriesLeft}</td>
            <td class="${evClass}">${evDisplay}</td>
            <td class="${stats.ev > 0 ? 'neutral' : 'negative'}">${reqBrDisplay}</td>
        `;
        output.tableBody.appendChild(tr);
    });

    if (bestLevelFound) {
        activeLevel = bestLevelFound;
    } else {
        activeLevel = LEVELS[0];
    }
    output.activeLevelDisplay.textContent = `Level ${activeLevel.level}`;

    const anyLevelIsPositive = LEVELS.some(l => calculateExpectation(l, probs).ev > 0);

    if (bestLevelFound) {
        const row = document.getElementById(`row-level-${bestLevelFound.level}`);
        if (row) row.classList.add('row-recommended');
        output.recLevel.textContent = `Level ${bestLevelFound.level}`;
        output.recLevel.style.color = 'var(--success)';
        output.recDesc.textContent = `Based on your bankroll of ${formatCurrency(bankroll)} and positive EV, Level ${bestLevelFound.level} is the maximum level you can comfortably play with a ${inputs.risk.value}% risk of ruin.`;
    } else if (anyLevelIsPositive) {
        output.recLevel.textContent = `Build Bankroll`;
        output.recLevel.style.color = 'var(--warning)';
        const firstPositiveLevel = LEVELS.find(l => calculateExpectation(l, probs).ev > 0);
        const stats = calculateExpectation(firstPositiveLevel, probs);
        const req = Math.max(stats.requiredBankroll, firstPositiveLevel.fee * 3);
        output.recDesc.textContent = `You have a mathematical edge at Level ${firstPositiveLevel.level}+, but your bankroll is too small to handle the variance. Accummulate ${formatCurrency(req)} to play safely.`;
    } else {
        if (probs.total > 0) {
            output.recLevel.textContent = `Do Not Play`;
            output.recLevel.style.color = 'var(--danger)';
            output.recDesc.textContent = `Your historical win rate indicates a negative Expected Value (-EV) at all levels. Playing is a mathematical loss over time.`;
        } else {
            output.recLevel.textContent = `Awaiting Data`;
            output.recLevel.style.color = 'var(--neutral)';
            output.recDesc.textContent = `Enter your game history to see your personalized strategy.`;
        }
    }
}

function recordResult(index) {
    let br = parseFloat(inputs.bankroll.value) || 0;
    let profit = 0;

    if (index < CONFIG.numPaidPositions) {
        profit = activeLevel.prizes[index] - activeLevel.fee;
    } else {
        profit = -activeLevel.fee;
    }

    HISTORICAL_DATA[index] = (HISTORICAL_DATA[index] || 0) + 1;
    inputs.bankroll.value = Math.max(0, br + profit);

    renderDynamicUI();
    updateCalculator();
}

function updateLevelValue(levelNum, field, value) {
    const levelIndex = LEVELS.findIndex(l => l.level === levelNum);
    if (levelIndex !== -1) {
        LEVELS[levelIndex][field] = parseFloat(value) || 0;
        updateCalculator();
    }
}

function updateLevelPrize(levelNum, prizeIndex, value) {
    const levelIndex = LEVELS.findIndex(l => l.level === levelNum);
    if (levelIndex !== -1) {
        LEVELS[levelIndex].prizes[prizeIndex] = parseFloat(value) || 0;
        updateCalculator();
    }
}

function toggleLocalEditor(type) {
    if (type === 'stats') {
        editStats = !editStats;
        document.getElementById('stats-panel').classList.toggle('edit-mode');
        if (containers.gameConfig) containers.gameConfig.style.display = editStats ? 'block' : 'none';
    } else if (type === 'table') {
        editTable = !editTable;
        document.getElementById('table-panel').classList.toggle('edit-mode');
    }
    saveData();
}

function resetToDefaults() {
    if (confirm('Are you sure you want to reset all game levels and configuration to defaults? This will overwrite any custom prizes you have entered.')) {
        CONFIG = {
            totalPlayers: 6,
            numPaidPositions: 3
        };
        LEVELS = JSON.parse(JSON.stringify(DEFAULT_LEVELS));

        // Match HISTORICAL_DATA length
        const requiredHistoryLength = CONFIG.numPaidPositions + 1;
        while (HISTORICAL_DATA.length < requiredHistoryLength) HISTORICAL_DATA.push(0);
        if (HISTORICAL_DATA.length > requiredHistoryLength) HISTORICAL_DATA.splice(requiredHistoryLength);

        renderDynamicUI();
        updateCalculator();
        saveData();
    }
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}