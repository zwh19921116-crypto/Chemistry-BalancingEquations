const form = document.getElementById("balance-form");
const input = document.getElementById("equation-input");
const resultNode = document.getElementById("result");
const statusNode = document.getElementById("status");
const detailsNode = document.getElementById("details");
const leftElementsNode = document.getElementById("left-elements");
const rightElementsNode = document.getElementById("right-elements");
const leftGuideNode = document.getElementById("left-guide");
const rightGuideNode = document.getElementById("right-guide");
const middleEquationNode = document.getElementById("middle-equation");
const middleStatusNode = document.getElementById("middle-status");
const compoundControlsNode = document.getElementById("compound-controls");
const solveButton = document.getElementById("solve-btn");
const surpriseButton = document.getElementById("surprise-btn");
const clearButton = document.getElementById("clear-btn");
const complexityFill = document.getElementById("complexity-fill");
const periodicGridNode = document.getElementById("periodic-grid");
const selectedElementNode = document.getElementById("selected-element");

const presetButtons = document.querySelectorAll(".chip");
const presetEquations = [...presetButtons].map((button) => button.dataset.equation).filter(Boolean);

const periodicSymbols = [
  "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar",
  "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr",
  "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe",
  "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu",
  "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac",
  "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh",
  "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og",
];

const state = {
  analysis: null,
  solved: null,
  coefficients: [],
  selectedElement: null,
};

buildPeriodicGrid();
resetBoard();

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.equation || "";
    loadEquation();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadEquation();
});

surpriseButton.addEventListener("click", () => {
  if (presetEquations.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * presetEquations.length);
  input.value = presetEquations[randomIndex];
  loadEquation();
});

solveButton.addEventListener("click", () => {
  if (!state.solved) {
    return;
  }

  state.coefficients = [...state.solved.coefficients];
  renderCompoundControls();
  renderBoard();
});

clearButton.addEventListener("click", () => {
  input.value = "";
  state.analysis = null;
  state.solved = null;
  state.coefficients = [];
  state.selectedElement = null;
  statusNode.textContent = "Load an equation, then click coefficients to balance.";
  resultNode.textContent = "";
  resultNode.className = "result";
  detailsNode.textContent = "";
  complexityFill.style.width = "0%";
  compoundControlsNode.innerHTML = "";
  resetBoard();
  renderPeriodicAvailability();
});

function loadEquation() {
  const equation = input.value.trim();

  if (!equation) {
    showError("Please enter an equation.");
    return;
  }

  try {
    state.analysis = analyzeEquationParts(equation);
    state.solved = solveEquation(equation);
    state.coefficients = Array(state.analysis.allCompounds.length).fill(1);

    if (!state.selectedElement || !state.analysis.elements.includes(state.selectedElement)) {
      state.selectedElement = state.analysis.elements[0] || null;
    }

    statusNode.textContent = "Click +/- on compounds to balance.";
    resultNode.textContent = "Equation loaded.";
    resultNode.className = "result";
    detailsNode.textContent = "Select an element at the bottom for focused guidance.";
    updateComplexity(state.solved);

    renderCompoundControls();
    renderPeriodicAvailability();
    renderBoard();
  } catch (error) {
    showError(error.message);
  }
}

function renderCompoundControls() {
  if (!state.analysis) {
    compoundControlsNode.innerHTML = "";
    return;
  }

  compoundControlsNode.innerHTML = state.analysis.allCompounds
    .map((compound, index) => {
      const side = index < state.analysis.leftCount ? "L" : "R";
      return `
        <div class="compound-row">
          <span class="compound-term">${side}: ${compound}</span>
          <div class="coef-controls">
            <button class="coef-btn" data-action="dec" data-index="${index}" type="button">-</button>
            <span class="coef-value" id="coef-${index}">${state.coefficients[index]}</span>
            <button class="coef-btn" data-action="inc" data-index="${index}" type="button">+</button>
          </div>
          <span class="compound-term">coef</span>
        </div>
      `;
    })
    .join("");

  compoundControlsNode.querySelectorAll(".coef-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const action = button.dataset.action;

      if (action === "inc") {
        state.coefficients[index] += 1;
      }

      if (action === "dec") {
        state.coefficients[index] = Math.max(1, state.coefficients[index] - 1);
      }

      renderCompoundControls();
      renderBoard();
    });
  });
}

function renderBoard() {
  if (!state.analysis || state.coefficients.length === 0) {
    resetBoard();
    return;
  }

  const totals = computeSideTotals(state.analysis, state.coefficients);
  const selected = state.selectedElement;

  middleEquationNode.textContent = `${formatEquationWithCoefficients(state.analysis.left, state.coefficients.slice(0, state.analysis.leftCount))} -> ${formatEquationWithCoefficients(state.analysis.right, state.coefficients.slice(state.analysis.leftCount))}`;

  const balanced = state.analysis.elements.every((element) => totals.left.get(element) === totals.right.get(element));
  middleStatusNode.textContent = `Status: ${balanced ? "Balanced" : "Unbalanced"}`;
  middleStatusNode.className = `balance-state ${balanced ? "ok" : "bad"}`;

  leftElementsNode.innerHTML = renderElementRows(state.analysis.elements, totals.left, selected);
  rightElementsNode.innerHTML = renderElementRows(state.analysis.elements, totals.right, selected);

  if (selected) {
    const leftTotal = totals.left.get(selected) || 0;
    const rightTotal = totals.right.get(selected) || 0;
    const leftContains = compoundsContaining(state.analysis, selected, "left");
    const rightContains = compoundsContaining(state.analysis, selected, "right");

    if (leftTotal === rightTotal) {
      leftGuideNode.textContent = `${selected} is balanced on LEFT.`;
      rightGuideNode.textContent = `${selected} is balanced on RIGHT.`;
    } else if (leftTotal < rightTotal) {
      leftGuideNode.textContent = `Add more ${selected} on LEFT. Try + on: ${leftContains}`;
      rightGuideNode.textContent = `Add less ${selected} on RIGHT. Try - on: ${rightContains}`;
    } else {
      leftGuideNode.textContent = `Add less ${selected} on LEFT. Try - on: ${leftContains}`;
      rightGuideNode.textContent = `Add more ${selected} on RIGHT. Try + on: ${rightContains}`;
    }
  } else {
    leftGuideNode.textContent = "Pick an element below.";
    rightGuideNode.textContent = "Pick an element below.";
  }

  if (balanced) {
    resultNode.textContent = "Balanced. Nice work.";
    resultNode.className = "result success";
    statusNode.textContent = "Balanced.";
  } else {
    resultNode.textContent = "Unbalanced. Keep clicking +/- controls.";
    resultNode.className = "result error";
    statusNode.textContent = "Unbalanced.";
  }

  if (selected) {
    const delta = (totals.left.get(selected) || 0) - (totals.right.get(selected) || 0);
    detailsNode.textContent = `${selected} difference (left - right): ${delta}`;
  } else {
    detailsNode.textContent = "Select an element for directional help.";
  }

  renderPeriodicAvailability();
}

function buildPeriodicGrid() {
  periodicGridNode.innerHTML = periodicSymbols
    .map((symbol) => `<button class="el-btn" data-el="${symbol}" type="button">${symbol}</button>`)
    .join("");

  periodicGridNode.querySelectorAll(".el-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedElement = button.dataset.el;
      renderPeriodicAvailability();
      renderBoard();
    });
  });
}

function renderPeriodicAvailability() {
  const activeElements = state.analysis ? new Set(state.analysis.elements) : new Set();

  periodicGridNode.querySelectorAll(".el-btn").forEach((button) => {
    const symbol = button.dataset.el;
    button.classList.toggle("active", state.selectedElement === symbol);
    button.classList.toggle("dim", state.analysis ? !activeElements.has(symbol) : false);
  });

  selectedElementNode.textContent = `Selected element: ${state.selectedElement || "none"}`;
}

function resetBoard() {
  leftElementsNode.innerHTML = "";
  rightElementsNode.innerHTML = "";
  leftGuideNode.textContent = "Pick an element below.";
  rightGuideNode.textContent = "Pick an element below.";
  middleEquationNode.textContent = "Enter equation and click Load Equation.";
  middleStatusNode.textContent = "Status: Waiting";
  middleStatusNode.className = "balance-state";
  selectedElementNode.textContent = "Selected element: none";
}

function showError(message) {
  resultNode.textContent = message;
  resultNode.className = "result error";
  statusNode.textContent = "Unable to process equation.";
  detailsNode.textContent = "Check syntax and compound format.";
}

function renderElementRows(elements, totals, selected) {
  return elements
    .map((element) => {
      const selectedClass = selected === element ? " selected" : "";
      return `<div class="element-row${selectedClass}"><span>${element}</span><strong>${totals.get(element)}</strong></div>`;
    })
    .join("");
}

function compoundsContaining(analysis, element, side) {
  const start = side === "left" ? 0 : analysis.leftCount;
  const end = side === "left" ? analysis.leftCount : analysis.allCompounds.length;
  const names = [];

  for (let i = start; i < end; i += 1) {
    if ((analysis.compoundMaps[i].get(element) || 0) > 0) {
      names.push(analysis.allCompounds[i]);
    }
  }

  return names.length > 0 ? names.join("/") : "none";
}

function computeSideTotals(analysis, coefficients) {
  const left = new Map();
  const right = new Map();

  analysis.elements.forEach((element) => {
    left.set(element, 0);
    right.set(element, 0);
  });

  analysis.compoundMaps.forEach((compoundMap, index) => {
    const coef = coefficients[index];
    analysis.elements.forEach((element) => {
      const amount = (compoundMap.get(element) || 0) * coef;
      if (index < analysis.leftCount) {
        left.set(element, left.get(element) + amount);
      } else {
        right.set(element, right.get(element) + amount);
      }
    });
  });

  return { left, right };
}

function updateComplexity(solved) {
  const raw = solved.elementsCount * 7 + solved.compoundsCount * 8 + solved.maxCoefficient * 2;
  const normalized = Math.min(100, Math.max(8, raw));
  complexityFill.style.width = `${normalized}%`;
}

function solveEquation(rawEquation) {
  const analysis = analyzeEquationParts(rawEquation);
  const solution = nullspaceVector(analysis.matrix);
  const coefficients = normalizeToIntegers(solution);

  if (!coefficients.some((value) => value > 0)) {
    throw new Error("Could not determine valid coefficients.");
  }

  const leftBalanced = formatEquationWithCoefficients(analysis.left, coefficients.slice(0, analysis.leftCount));
  const rightBalanced = formatEquationWithCoefficients(analysis.right, coefficients.slice(analysis.leftCount));

  return {
    balanced: `${leftBalanced} -> ${rightBalanced}`,
    coefficients,
    elementsCount: analysis.elements.length,
    compoundsCount: analysis.allCompounds.length,
    maxCoefficient: Math.max(...coefficients),
  };
}

function formatEquationWithCoefficients(compounds, coefficients) {
  return compounds
    .map((compound, index) => renderTerm(coefficients[index], compound))
    .join(" + ");
}

function analyzeEquationParts(rawEquation) {
  const { left, right } = splitEquation(rawEquation);

  if (left.length === 0 || right.length === 0) {
    throw new Error("Equation must have compounds on both sides.");
  }

  const allCompounds = [...left, ...right];
  const compoundMaps = allCompounds.map(parseCompound);
  const elements = uniqueElements(compoundMaps);

  if (elements.length === 0) {
    throw new Error("No valid elements found.");
  }

  const matrix = buildMatrix(elements, compoundMaps, left.length);

  return {
    left,
    right,
    allCompounds,
    compoundMaps,
    leftCount: left.length,
    elements,
    matrix,
  };
}

function renderTerm(coef, compound) {
  return coef === 1 ? compound : `${coef}${compound}`;
}

function splitEquation(inputEquation) {
  const normalized = inputEquation.replace(/\s+/g, "");
  const arrowMatch = normalized.includes("->") ? "->" : null;

  if (!arrowMatch) {
    throw new Error("Use '->' between left and right sides.");
  }

  const [leftRaw, rightRaw] = normalized.split(arrowMatch);
  if (rightRaw === undefined) {
    throw new Error("Equation format is invalid.");
  }

  const left = splitCompounds(leftRaw);
  const right = splitCompounds(rightRaw);

  return { left, right };
}

function splitCompounds(side) {
  if (!side) {
    return [];
  }

  return side
    .split("+")
    .map((compound) => compound.trim())
    .filter(Boolean);
}

function parseCompound(compound) {
  const tokenRegex = /([A-Z][a-z]?|\(|\)|\d+)/g;
  const tokens = compound.match(tokenRegex);

  if (!tokens || tokens.join("") !== compound) {
    throw new Error(`Invalid compound: ${compound}`);
  }

  let index = 0;

  function parseGroup() {
    const counts = new Map();

    while (index < tokens.length) {
      const token = tokens[index];

      if (token === ")") {
        break;
      }

      if (token === "(") {
        index += 1;
        const inner = parseGroup();

        if (tokens[index] !== ")") {
          throw new Error(`Missing ')' in ${compound}`);
        }

        index += 1;
        const multiplier = readNumber();
        mergeCounts(counts, inner, multiplier);
        continue;
      }

      if (!/^([A-Z][a-z]?)$/.test(token)) {
        throw new Error(`Unexpected token '${token}' in ${compound}`);
      }

      index += 1;
      const multiplier = readNumber();
      counts.set(token, (counts.get(token) || 0) + multiplier);
    }

    return counts;
  }

  function readNumber() {
    const token = tokens[index];

    if (token && /^\d+$/.test(token)) {
      index += 1;
      return Number(token);
    }

    return 1;
  }

  const result = parseGroup();

  if (index !== tokens.length) {
    throw new Error(`Invalid structure in ${compound}`);
  }

  return result;
}

function mergeCounts(target, source, multiplier) {
  for (const [element, count] of source.entries()) {
    target.set(element, (target.get(element) || 0) + count * multiplier);
  }
}

function uniqueElements(compoundMaps) {
  const set = new Set();

  compoundMaps.forEach((counts) => {
    for (const element of counts.keys()) {
      set.add(element);
    }
  });

  return [...set];
}

function buildMatrix(elements, compounds, leftCount) {
  return elements.map((element) => {
    return compounds.map((counts, index) => {
      const amount = counts.get(element) || 0;
      return index < leftCount ? amount : -amount;
    });
  });
}

function nullspaceVector(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const fractions = matrix.map((row) => row.map((v) => frac(v, 1)));

  let pivotRow = 0;
  const pivotCols = [];

  for (let col = 0; col < cols && pivotRow < rows; col += 1) {
    let selected = pivotRow;
    while (selected < rows && isZero(fractions[selected][col])) {
      selected += 1;
    }

    if (selected === rows) {
      continue;
    }

    [fractions[pivotRow], fractions[selected]] = [fractions[selected], fractions[pivotRow]];

    const pivotVal = fractions[pivotRow][col];
    for (let j = col; j < cols; j += 1) {
      fractions[pivotRow][j] = divFrac(fractions[pivotRow][j], pivotVal);
    }

    for (let r = 0; r < rows; r += 1) {
      if (r === pivotRow || isZero(fractions[r][col])) {
        continue;
      }

      const factor = fractions[r][col];
      for (let j = col; j < cols; j += 1) {
        fractions[r][j] = subFrac(fractions[r][j], mulFrac(factor, fractions[pivotRow][j]));
      }
    }

    pivotCols.push(col);
    pivotRow += 1;
  }

  const freeCols = [];
  for (let c = 0; c < cols; c += 1) {
    if (!pivotCols.includes(c)) {
      freeCols.push(c);
    }
  }

  if (freeCols.length === 0) {
    throw new Error("No free variable found; equation may be invalid.");
  }

  const solution = Array(cols).fill(frac(0, 1));
  const freeCol = freeCols[0];
  solution[freeCol] = frac(1, 1);

  for (let r = pivotCols.length - 1; r >= 0; r -= 1) {
    const col = pivotCols[r];
    let sum = frac(0, 1);

    for (let c = col + 1; c < cols; c += 1) {
      if (!isZero(fractions[r][c])) {
        sum = addFrac(sum, mulFrac(fractions[r][c], solution[c]));
      }
    }

    solution[col] = mulFrac(sum, frac(-1, 1));
  }

  return solution;
}

function normalizeToIntegers(fracVector) {
  const denominators = fracVector.map((f) => f.den);
  const commonDenominator = denominators.reduce((acc, den) => lcm(acc, den), 1);

  let ints = fracVector.map((f) => (f.num * commonDenominator) / f.den);
  if (ints.every((v) => v <= 0)) {
    ints = ints.map((v) => -v);
  }

  const nonZero = ints.filter((v) => v !== 0).map((v) => Math.abs(v));
  if (nonZero.length === 0) {
    throw new Error("Unable to compute non-zero coefficients.");
  }

  const divisor = nonZero.reduce((acc, value) => gcd(acc, value), nonZero[0]);
  ints = ints.map((v) => v / divisor);

  if (ints.some((v) => !Number.isFinite(v) || !Number.isInteger(v))) {
    throw new Error("Coefficient conversion failed.");
  }

  if (ints.some((v) => v < 0)) {
    ints = ints.map((v) => -v);
  }

  return ints;
}

function frac(num, den) {
  if (den === 0) {
    throw new Error("Internal math error: division by zero.");
  }

  const sign = den < 0 ? -1 : 1;
  const n = num * sign;
  const d = Math.abs(den);
  const factor = gcd(Math.abs(n), d);

  return {
    num: n / factor,
    den: d / factor,
  };
}

function addFrac(a, b) {
  return frac(a.num * b.den + b.num * a.den, a.den * b.den);
}

function subFrac(a, b) {
  return frac(a.num * b.den - b.num * a.den, a.den * b.den);
}

function mulFrac(a, b) {
  return frac(a.num * b.num, a.den * b.den);
}

function divFrac(a, b) {
  return frac(a.num * b.den, a.den * b.num);
}

function isZero(value) {
  return value.num === 0;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    [x, y] = [y, x % y];
  }

  return x || 1;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}
