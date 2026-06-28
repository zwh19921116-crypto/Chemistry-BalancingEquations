const form = document.getElementById("balance-form");
const input = document.getElementById("equation-input");
const resultNode = document.getElementById("result");
const statusNode = document.getElementById("status");
const detailsNode = document.getElementById("details");
const leftEquationNode = document.getElementById("left-equation-controls");
const rightEquationNode = document.getElementById("right-equation-controls");
const middleEquationNode = document.getElementById("middle-equation");
const middleStatusNode = document.getElementById("middle-status");
const middleVisualNode = document.getElementById("middle-visual");
const middleAtomTableNode = document.getElementById("middle-atom-table");
const middleLegendNode = document.getElementById("middle-legend");
const leftAddButton = document.getElementById("left-add-btn");
const leftClearButton = document.getElementById("left-clear-btn");
const rightAddButton = document.getElementById("right-add-btn");
const rightClearButton = document.getElementById("right-clear-btn");
const solveButton = document.getElementById("solve-btn");
const surpriseButton = document.getElementById("surprise-btn");
const clearButton = document.getElementById("clear-btn");
const complexityFill = document.getElementById("complexity-fill");
const periodicGridNode = document.getElementById("periodic-grid");
const selectedElementNode = document.getElementById("selected-element");

const presetButtons = document.querySelectorAll(".chip");
const presetEquations = [...presetButtons].map((button) => button.dataset.equation).filter(Boolean);

const periodicLayout = [
  ["H", 1, 1], ["He", 1, 18],
  ["Li", 2, 1], ["Be", 2, 2], ["B", 2, 13], ["C", 2, 14], ["N", 2, 15], ["O", 2, 16], ["F", 2, 17], ["Ne", 2, 18],
  ["Na", 3, 1], ["Mg", 3, 2], ["Al", 3, 13], ["Si", 3, 14], ["P", 3, 15], ["S", 3, 16], ["Cl", 3, 17], ["Ar", 3, 18],
  ["K", 4, 1], ["Ca", 4, 2], ["Sc", 4, 3], ["Ti", 4, 4], ["V", 4, 5], ["Cr", 4, 6], ["Mn", 4, 7], ["Fe", 4, 8], ["Co", 4, 9], ["Ni", 4, 10], ["Cu", 4, 11], ["Zn", 4, 12], ["Ga", 4, 13], ["Ge", 4, 14], ["As", 4, 15], ["Se", 4, 16], ["Br", 4, 17], ["Kr", 4, 18],
  ["Rb", 5, 1], ["Sr", 5, 2], ["Y", 5, 3], ["Zr", 5, 4], ["Nb", 5, 5], ["Mo", 5, 6], ["Tc", 5, 7], ["Ru", 5, 8], ["Rh", 5, 9], ["Pd", 5, 10], ["Ag", 5, 11], ["Cd", 5, 12], ["In", 5, 13], ["Sn", 5, 14], ["Sb", 5, 15], ["Te", 5, 16], ["I", 5, 17], ["Xe", 5, 18],
  ["Cs", 6, 1], ["Ba", 6, 2], ["La", 6, 3], ["Hf", 6, 4], ["Ta", 6, 5], ["W", 6, 6], ["Re", 6, 7], ["Os", 6, 8], ["Ir", 6, 9], ["Pt", 6, 10], ["Au", 6, 11], ["Hg", 6, 12], ["Tl", 6, 13], ["Pb", 6, 14], ["Bi", 6, 15], ["Po", 6, 16], ["At", 6, 17], ["Rn", 6, 18],
  ["Fr", 7, 1], ["Ra", 7, 2], ["Ac", 7, 3], ["Rf", 7, 4], ["Db", 7, 5], ["Sg", 7, 6], ["Bh", 7, 7], ["Hs", 7, 8], ["Mt", 7, 9], ["Ds", 7, 10], ["Rg", 7, 11], ["Cn", 7, 12], ["Nh", 7, 13], ["Fl", 7, 14], ["Mc", 7, 15], ["Lv", 7, 16], ["Ts", 7, 17], ["Og", 7, 18],
  ["Ce", 8, 4], ["Pr", 8, 5], ["Nd", 8, 6], ["Pm", 8, 7], ["Sm", 8, 8], ["Eu", 8, 9], ["Gd", 8, 10], ["Tb", 8, 11], ["Dy", 8, 12], ["Ho", 8, 13], ["Er", 8, 14], ["Tm", 8, 15], ["Yb", 8, 16], ["Lu", 8, 17],
  ["Th", 9, 4], ["Pa", 9, 5], ["U", 9, 6], ["Np", 9, 7], ["Pu", 9, 8], ["Am", 9, 9], ["Cm", 9, 10], ["Bk", 9, 11], ["Cf", 9, 12], ["Es", 9, 13], ["Fm", 9, 14], ["Md", 9, 15], ["No", 9, 16], ["Lr", 9, 17],
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
  renderSideControls();
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
  leftEquationNode.innerHTML = "";
  rightEquationNode.innerHTML = "";
  resetBoard();
  renderPeriodicAvailability();
});

leftAddButton.addEventListener("click", () => {
  detailsNode.textContent = "Use the equation input to add new molecules, then click Load Equation.";
});

rightAddButton.addEventListener("click", () => {
  detailsNode.textContent = "Use the equation input to add new molecules, then click Load Equation.";
});

leftClearButton.addEventListener("click", () => {
  if (!state.analysis) {
    return;
  }

  for (let i = 0; i < state.analysis.leftCount; i += 1) {
    state.coefficients[i] = 1;
  }

  renderSideControls();
  renderBoard();
});

rightClearButton.addEventListener("click", () => {
  if (!state.analysis) {
    return;
  }

  for (let i = state.analysis.leftCount; i < state.analysis.allCompounds.length; i += 1) {
    state.coefficients[i] = 1;
  }

  renderSideControls();
  renderBoard();
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
    detailsNode.textContent = "Click +/- in left and right panels to balance.";
    updateComplexity(state.solved);

    renderSideControls();
    renderPeriodicAvailability();
    renderBoard();
  } catch (error) {
    showError(error.message);
  }
}

function renderSideControls() {
  if (!state.analysis) {
    leftEquationNode.innerHTML = "";
    rightEquationNode.innerHTML = "";
    return;
  }

  leftEquationNode.innerHTML = renderSideRows(0, state.analysis.leftCount);
  rightEquationNode.innerHTML = renderSideRows(state.analysis.leftCount, state.analysis.allCompounds.length);

  document.querySelectorAll(".coef-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const action = button.dataset.action;

      if (action === "inc") {
        state.coefficients[index] += 1;
      }

      if (action === "dec") {
        state.coefficients[index] = Math.max(1, state.coefficients[index] - 1);
      }

      renderSideControls();
      renderBoard();
    });
  });
}

function renderSideRows(start, end) {
  const rows = [];

  for (let i = start; i < end; i += 1) {
    const plus = i === start ? "" : "+";
    rows.push(`
      <div class="side-row">
        <span class="side-plus">${plus}</span>
        <div class="coef-controls spinner-box">
          <span class="coef-value">${state.coefficients[i]}</span>
          <div class="spin-btns">
            <button class="coef-btn spin-btn" data-action="inc" data-index="${i}" type="button" aria-label="Increase coefficient">▲</button>
            <button class="coef-btn spin-btn" data-action="dec" data-index="${i}" type="button" aria-label="Decrease coefficient">▼</button>
          </div>
        </div>
        <span class="side-compound">${state.analysis.allCompounds[i]}</span>
      </div>
    `);
  }

  return rows.join("");
}

function renderBoard() {
  if (!state.analysis || state.coefficients.length === 0) {
    resetBoard();
    return;
  }

  const totals = computeSideTotals(state.analysis, state.coefficients);

  middleEquationNode.textContent = `${formatEquationWithCoefficients(state.analysis.left, state.coefficients.slice(0, state.analysis.leftCount))} -> ${formatEquationWithCoefficients(state.analysis.right, state.coefficients.slice(state.analysis.leftCount))}`;

  const balanced = state.analysis.elements.every((element) => totals.left.get(element) === totals.right.get(element));
  middleStatusNode.textContent = `Status: ${balanced ? "Balanced" : "Unbalanced"}`;
  middleStatusNode.className = `balance-state ${balanced ? "ok" : "bad"}`;
  middleVisualNode.innerHTML = renderMoleculeVisual(state.analysis, state.coefficients);
  middleAtomTableNode.innerHTML = renderAtomTable(state.analysis.elements, totals, state.selectedElement);
  middleLegendNode.innerHTML = renderMiddleLegend(state.analysis.elements);

  if (balanced) {
    resultNode.textContent = "Balanced. Nice work.";
    resultNode.className = "result success";
    statusNode.textContent = "Balanced.";
  } else {
    resultNode.textContent = "Unbalanced. Keep clicking +/- controls.";
    resultNode.className = "result error";
    statusNode.textContent = "Unbalanced.";
  }

  if (state.selectedElement) {
    const delta = (totals.left.get(state.selectedElement) || 0) - (totals.right.get(state.selectedElement) || 0);
    detailsNode.textContent = `${state.selectedElement} difference (before - after): ${delta}`;
  } else {
    detailsNode.textContent = "Select an element for directional help.";
  }

  renderPeriodicAvailability();
}

function renderAtomTable(elements, totals, selectedElement) {
  const head = "<div class=\"atom-head\"><span>ATOM</span><span>Before</span><span>After</span><span>OK?</span></div>";
  const rows = elements
    .map((element) => {
      const left = totals.left.get(element) || 0;
      const right = totals.right.get(element) || 0;
      const ok = left === right;
      const rowClass = selectedElement === element ? "atom-row highlight" : "atom-row";
      return `<div class=\"${rowClass}\"><span>${element}</span><span>${left}</span><span>${right}</span><span class=\"${ok ? "atom-ok" : "atom-bad"}\">${ok ? "Yes" : "No"}</span></div>`;
    })
    .join("");

  return `${head}${rows}`;
}

function renderMoleculeVisual(analysis, coefficients) {
  const leftVisual = analysis.left
    .map((compound, index) => renderVisualMolecule(compound, coefficients[index], "Reactant"))
    .join("");

  const rightVisual = analysis.right
    .map((compound, index) => renderVisualMolecule(compound, coefficients[analysis.leftCount + index], "Product"))
    .join("");

  return `
    <div class="visual-block">
      <div class="visual-col">
        <div class="visual-side-label">Before</div>
        ${leftVisual}
      </div>
      <div class="visual-arrow">→</div>
      <div class="visual-col">
        <div class="visual-side-label">After</div>
        ${rightVisual}
      </div>
    </div>
  `;
}

function renderVisualMolecule(compound, coefficient, sideLabel) {
  const atoms = expandCompoundAtoms(compound);
  const countLabel = coefficient > 1 ? `×${coefficient}` : "1";
  const moleculeLabel = renderCompoundStructure(compound);

  return `
    <div class="visual-row">
      <div class="visual-label">${sideLabel}</div>
      <div class="visual-molecule molecule-card">
        <div class="molecule-topline">
          <span class="molecule-formula">${renderTerm(coefficient, compound)}</span>
          <span class="molecule-count">${countLabel}</span>
        </div>
        <div class="molecule-structure">${moleculeLabel}</div>
        <div class="molecule-foot">${atoms.length} atom${atoms.length === 1 ? "" : "s"}</div>
      </div>
    </div>
  `;
}

function renderCompoundStructure(compound) {
  const nodes = parseCompoundStructure(compound);
  const center = pickCenterNode(nodes);
  const branches = nodes.filter((node) => node !== center);

  return `
    <span class="molecule-tree">
      <span class="tree-core">${renderStructureNode(center)}</span>
      <span class="tree-branches">
        ${branches.map((node) => renderBranchNode(node)).join("")}
      </span>
    </span>
  `;
}

function pickCenterNode(nodes) {
  const atomNodes = nodes.filter((node) => node.type === "atom");
  const symbolCounts = new Map();

  atomNodes.forEach((node) => {
    symbolCounts.set(node.symbol, (symbolCounts.get(node.symbol) || 0) + 1);
  });

  const preferredAtom = atomNodes.find((node) => symbolCounts.get(node.symbol) === 1 && node.symbol !== "H" && node.symbol !== "O")
    || atomNodes.find((node) => symbolCounts.get(node.symbol) === 1 && node.symbol !== "H")
    || atomNodes.find((node) => node.symbol !== "H" && node.symbol !== "O")
    || atomNodes.find((node) => node.symbol !== "H")
    || atomNodes[0];

  return preferredAtom || nodes[0];
}

function renderBranchNode(node) {
  const body = renderStructureNode(node);
  return `<span class="branch-node"><span class="branch-line"></span>${body}</span>`;
}

function renderStructureNode(node) {
  if (!node) {
    return "";
  }

  if (node.type === "atom") {
    return renderAtomNode(node.symbol);
  }

  return renderGroupNode(node.children, node.multiplier);
}

function renderAtomNode(symbol) {
  const tone = elementTone(symbol);
  return `<span class="atom-dot ${tone}"><span class="atom-symbol">${symbol}</span></span>`;
}

function renderGroupNode(children, multiplier) {
  const badge = multiplier > 1 ? `<span class="group-multiplier">x${multiplier}</span>` : "";
  const center = pickCenterNode(children);
  const branches = children.filter((node) => node !== center);

  return `
    <span class="structure-group">
      <span class="group-paren">(</span>
      <span class="group-tree">
        <span class="group-core">${renderStructureNode(center)}</span>
        <span class="group-branches">
          ${branches.map((node) => renderBranchNode(node)).join("")}
        </span>
      </span>
      <span class="group-paren">)</span>
      ${badge}
    </span>
  `;
}

function parseCompoundStructure(compound) {
  const tokenRegex = /([A-Z][a-z]?|\(|\)|\d+)/g;
  const tokens = compound.match(tokenRegex) || [];
  let index = 0;

  function parseSequence() {
    const nodes = [];

    while (index < tokens.length) {
      const token = tokens[index];

      if (token === ")") {
        break;
      }

      if (token === "(") {
        index += 1;
        const children = parseSequence();

        if (tokens[index] !== ")") {
          throw new Error(`Missing ')' in ${compound}`);
        }

        index += 1;
        const multiplier = readMultiplier();
        nodes.push({ type: "group", children, multiplier });
        continue;
      }

      if (/^[A-Z][a-z]?$/.test(token)) {
        index += 1;
        const multiplier = readMultiplier();
        for (let repeat = 0; repeat < multiplier; repeat += 1) {
          nodes.push({ type: "atom", symbol: token });
        }
        continue;
      }

      index += 1;
    }

    return nodes;
  }

  function readMultiplier() {
    const token = tokens[index];

    if (token && /^\d+$/.test(token)) {
      index += 1;
      return Number(token);
    }

    return 1;
  }

  return parseSequence();
}


function expandCompoundAtoms(compound) {
  const tokenRegex = /([A-Z][a-z]?|\(|\)|\d+)/g;
  const tokens = compound.match(tokenRegex) || [];
  let index = 0;

  function parseSequence() {
    const sequence = [];

    while (index < tokens.length) {
      const token = tokens[index];

      if (token === ")") {
        break;
      }

      if (token === "(") {
        index += 1;
        const inner = parseSequence();

        if (tokens[index] !== ")") {
          break;
        }

        index += 1;
        const multiplier = readMultiplier();
        for (let repeat = 0; repeat < multiplier; repeat += 1) {
          sequence.push(...inner);
        }
        continue;
      }

      if (/^[A-Z][a-z]?$/.test(token)) {
        index += 1;
        const multiplier = readMultiplier();
        for (let repeat = 0; repeat < multiplier; repeat += 1) {
          sequence.push(token);
        }
        continue;
      }

      index += 1;
    }

    return sequence;
  }

  function readMultiplier() {
    const token = tokens[index];
    if (token && /^\d+$/.test(token)) {
      index += 1;
      return Number(token);
    }
    return 1;
  }

  return parseSequence();
}

function renderMiddleLegend(elements) {
  return elements.slice(0, 6).map((el) => {
    const tone = elementTone(el);
    return `<span class="legend-chip"><span class="legend-dot ${tone}"></span>${el}</span>`;
  }).join("");
}

function elementTone(symbol) {
  if (symbol === "O") {
    return "tone-red";
  }

  if (symbol === "N") {
    return "tone-blue";
  }

  if (symbol === "H") {
    return "tone-white";
  }

  if (symbol === "Cl" || symbol === "F") {
    return "tone-green";
  }

  return "tone-white";
}

function buildPeriodicGrid() {
  periodicGridNode.innerHTML = periodicLayout
    .map(([symbol, row, col]) => `<button class="el-btn" style="grid-row:${row};grid-column:${col};" data-el="${symbol}" type="button">${symbol}</button>`)
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
  leftEquationNode.innerHTML = "";
  rightEquationNode.innerHTML = "";
  middleEquationNode.textContent = "Enter equation and click Load Equation.";
  middleStatusNode.textContent = "Status: Waiting";
  middleStatusNode.className = "balance-state";
  middleVisualNode.innerHTML = "";
  middleAtomTableNode.innerHTML = "";
  middleLegendNode.innerHTML = "";
  selectedElementNode.textContent = "Selected element: none";
}

function showError(message) {
  resultNode.textContent = message;
  resultNode.className = "result error";
  statusNode.textContent = "Unable to process equation.";
  detailsNode.textContent = "Check syntax and compound format.";
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
