(function () {
  const outcomesListEl = document.getElementById('outcomesList');
  const addOutcomeBtn = document.getElementById('addOutcomeBtn');
  const inputModeEl = document.getElementById('inputMode');
  const totalStakeEl = document.getElementById('totalStake');
  const stakeSliderEl = document.getElementById('stakeSlider');
  const calculateBtn = document.getElementById('calculateBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const resetBtn = document.getElementById('resetBtn');
  const arbIndicatorEl = document.getElementById('arbIndicator');
  const marginTextEl = document.getElementById('marginText');
  const resultsTableEl = document.getElementById('resultsTable');

  let outcomeIdCounter = 0;
  /** @type {{id:number, nameInput: HTMLInputElement, priceInput: HTMLInputElement}[]} */
  const outcomeRows = [];

  function createOutcomeRow(name = '', price = '') {
    const row = document.createElement('div');
    row.className = 'outcome-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Outcome name';
    nameInput.value = name;

    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.inputMode = 'decimal';
    priceInput.min = '0';
    priceInput.step = '0.01';
    priceInput.placeholder = inputModeEl.value === 'cents' ? 'e.g. 60 or 60%' : 'e.g. 0.60';
    priceInput.value = price;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.title = 'Remove';
    removeBtn.textContent = '✕';

    row.appendChild(nameInput);
    row.appendChild(priceInput);
    row.appendChild(removeBtn);

    const id = outcomeIdCounter++;
    const record = { id, nameInput, priceInput };
    outcomeRows.push(record);

    outcomesListEl.appendChild(row);

    const onChange = () => {
      scheduleAutoCalculate();
    };
    nameInput.addEventListener('input', onChange);
    priceInput.addEventListener('input', onChange);
    removeBtn.addEventListener('click', () => {
      const idx = outcomeRows.findIndex(o => o.id === id);
      if (idx !== -1) {
        outcomeRows.splice(idx, 1);
      }
      row.remove();
      scheduleAutoCalculate();
    });
  }

  function initDefaultOutcomes() {
    outcomesListEl.innerHTML = '';
    outcomeRows.splice(0, outcomeRows.length);
    outcomeIdCounter = 0;
    createOutcomeRow('Outcome A', '60');
    createOutcomeRow('Outcome B', '40');
  }

  function parsePriceToDecimal(raw, mode) {
    if (raw == null) return NaN;
    let s = String(raw).trim();
    if (s === '') return NaN;
    // Allow trailing % in cents mode
    if (mode === 'cents' && s.endsWith('%')) {
      s = s.slice(0, -1).trim();
    }
    let n = Number(s);
    if (!isFinite(n)) return NaN;
    if (mode === 'cents') {
      // Interpret 0-100 as cents/percent
      return n / 100;
    } else {
      // Decimal 0-1
      return n;
    }
  }

  function formatCurrency(n) {
    if (!isFinite(n)) return '-';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  }
  function formatPercent(n) {
    if (!isFinite(n)) return '-';
    return new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 2 }).format(n);
  }

  function collectInputs() {
    const mode = inputModeEl.value;
    const outcomes = outcomeRows.map((row, idx) => {
      const name = row.nameInput.value.trim() || `Outcome ${idx + 1}`;
      const priceDecimal = parsePriceToDecimal(row.priceInput.value, mode);
      return { name, priceDecimal, raw: row.priceInput.value };
    }).filter(o => isFinite(o.priceDecimal) && o.priceDecimal >= 0);
    const totalStake = Number(totalStakeEl.value);
    return { mode, outcomes, totalStake };
  }

  function calculate() {
    const { outcomes, totalStake } = collectInputs();
    if (!Array.isArray(outcomes) || outcomes.length < 2) {
      renderEmpty('Add at least two outcomes to calculate.');
      return;
    }

    const sumP = outcomes.reduce((acc, o) => acc + o.priceDecimal, 0);
    if (sumP <= 0) {
      renderEmpty('Enter prices greater than 0.');
      return;
    }

    const equalizedGrossReturn = totalStake / sumP; // G = T / sum(p)
    const profitEach = equalizedGrossReturn - totalStake; // same across outcomes

    const rows = outcomes.map(o => {
      const stake = totalStake * (o.priceDecimal / sumP); // s_i = T * p_i / sum(p)
      const profit = profitEach;
      return { name: o.name, input: o.raw, stake, profit };
    });

    const margin = 1 - sumP; // negative when sumP>1 (no arb), positive when sumP<1 (arb)
    const hasArb = sumP < 1; // arbitrage exists if total price is less than 1

    renderResults({ rows, totalStake, profitEach, margin, hasArb });
  }

  function renderEmpty(message) {
    exportCsvBtn.disabled = true;
    arbIndicatorEl.textContent = 'Waiting for inputs';
    arbIndicatorEl.className = 'badge';
    marginTextEl.textContent = '';
    resultsTableEl.innerHTML = `<div class="muted">${message}</div>`;
  }

  function renderResults({ rows, totalStake, profitEach, margin, hasArb }) {
    exportCsvBtn.disabled = rows.length === 0;

    arbIndicatorEl.textContent = hasArb ? 'Arbitrage found' : 'No arbitrage';
    arbIndicatorEl.className = `badge ${hasArb ? 'good' : 'bad'}`;
    marginTextEl.textContent = `Arb margin: ${formatPercent(margin)}`;

    const header = `
      <table>
        <thead>
          <tr>
            <th>Outcome</th>
            <th>Input</th>
            <th>Stake</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
    `;

    const body = rows.map(r => {
      const profitClass = r.profit > 0 ? 'p-profit' : (r.profit < 0 ? 'p-loss' : '');
      return `
        <tr>
          <td style="text-align:left">${escapeHtml(r.name)}</td>
          <td>${escapeHtml(String(r.input))}</td>
          <td>${formatCurrency(r.stake)}</td>
          <td class="${profitClass}">${formatCurrency(r.profit)}</td>
        </tr>
      `;
    }).join('');

    const footer = `
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td></td>
            <td>${formatCurrency(totalStake)}</td>
            <td class="${profitEach > 0 ? 'p-profit' : (profitEach < 0 ? 'p-loss' : '')}">${formatCurrency(profitEach)}</td>
          </tr>
        </tfoot>
      </table>
    `;

    resultsTableEl.innerHTML = header + body + footer;
  }

  function scheduleAutoCalculate() {
    // Debounce immediate recalculation
    if (scheduleAutoCalculate._t) cancelAnimationFrame(scheduleAutoCalculate._t);
    scheduleAutoCalculate._t = requestAnimationFrame(calculate);
  }

  function escapeHtml(s) {
    return s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function exportCsv() {
    const { outcomes, totalStake } = collectInputs();
    if (outcomes.length < 2) return;

    const sumP = outcomes.reduce((acc, o) => acc + o.priceDecimal, 0);
    if (sumP <= 0) return;

    const equalizedGrossReturn = totalStake / sumP;
    const profitEach = equalizedGrossReturn - totalStake;

    const rows = outcomes.map((o, idx) => {
      const stake = totalStake * (o.priceDecimal / sumP);
      return { Outcome: o.name || `Outcome ${idx + 1}`, Input: o.raw, Stake: stake, Profit: profitEach };
    });

    const header = ['Outcome', 'Input', 'Stake', 'Profit'];
    const csv = [header.join(',')]
      .concat(rows.map(r => [r.Outcome, r.Input, r.Stake.toFixed(2), r.Profit.toFixed(2)].map(csvEscape).join(',')))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replaceAll(':', '').replaceAll('.', '');
    a.download = `arbitrage_results_${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  function csvEscape(v) {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) {
      return '"' + s.replaceAll('"', '""') + '"';
    }
    return s;
  }

  // Wire events
  addOutcomeBtn.addEventListener('click', () => {
    createOutcomeRow();
  });

  inputModeEl.addEventListener('change', () => {
    // Update placeholders to hint at expected format
    outcomeRows.forEach(r => {
      r.priceInput.placeholder = inputModeEl.value === 'cents' ? 'e.g. 60 or 60%' : 'e.g. 0.60';
    });
    scheduleAutoCalculate();
  });

  totalStakeEl.addEventListener('input', () => {
    const v = Number(totalStakeEl.value);
    if (isFinite(v)) {
      stakeSliderEl.value = String(Math.max(0, Math.min(10000, Math.round(v))));
    }
    scheduleAutoCalculate();
  });
  stakeSliderEl.addEventListener('input', () => {
    totalStakeEl.value = Number(stakeSliderEl.value).toFixed(2);
    scheduleAutoCalculate();
  });

  calculateBtn.addEventListener('click', calculate);
  exportCsvBtn.addEventListener('click', exportCsv);
  resetBtn.addEventListener('click', () => {
    totalStakeEl.value = '100.00';
    stakeSliderEl.value = '100';
    inputModeEl.value = 'cents';
    initDefaultOutcomes();
    renderEmpty('Ready');
  });

  // Init
  initDefaultOutcomes();
  scheduleAutoCalculate();
})();