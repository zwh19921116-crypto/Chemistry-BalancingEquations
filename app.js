const form = document.getElementById("balance-form");
const input = document.getElementById("equation-input");
const resultNode = document.getElementById("result");
const statusNode = document.getElementById("status");
const detailsNode = document.getElementById("details");
const streakNode = document.getElementById("streak");
const bestNode = document.getElementById("best-streak");
const solvedNode = document.getElementById("solved-count");
const complexityFill = document.getElementById("complexity-fill");
const surpriseButton = document.getElementById("surprise-btn");
const clearButton = document.getElementById("clear-btn");
const celebrateLayer = document.getElementById("celebrate");

const presetButtons = document.querySelectorAll(".chip");
const presetEquations = [...presetButtons].map((button) => button.dataset.equation).filter(Boolean);

const stats = {
  streak: 0,
  best: 0,
  solved: 0,
};

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.equation || "";
    balanceNow();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  balanceNow();
});

surpriseButton.addEventListener("click", () => {
  if (presetEquations.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * presetEquations.length);
  input.value = presetEquations[randomIndex];
  balanceNow();
});

clearButton.addEventListener("click", () => {
  input.value = "";
  resultNode.textContent = "";
  resultNode.className = "result";
  statusNode.textContent = "Ready to balance.";
  detailsNode.textContent = "";
  complexityFill.style.width = "0%";
  input.focus();
});

function balanceNow() {
  const equation = input.value.trim();

  if (!equation) {
    showError("Please enter an equation.");
    return;
  }

  try {
    const solved = solveEquation(equation);
    resultNode.textContent = solved.balanced;
    resultNode.className = "result success flash";
    statusNode.textContent = "Balanced successfully.";
    detailsNode.textContent = `Coefficients: ${solved.coefficients.join(", ")} | Elements: ${solved.elementsCount}`;
    updateStats(true);
    updateComplexity(solved);
    celebrate();

    setTimeout(() => {
      resultNode.classList.remove("flash");
    }, 450);
  } catch (error) {
    showError(error.message);
  }
}

function showError(message) {
  resultNode.textContent = message;
  resultNode.className = "result error";
  statusNode.textContent = "Unable to balance this equation.";
  detailsNode.textContent = "Check syntax and ensure both sides contain valid compounds.";
  updateStats(false);
}

function updateStats(success) {
  if (success) {
    stats.streak += 1;
    stats.solved += 1;
    stats.best = Math.max(stats.best, stats.streak);
  } else {
    stats.streak = 0;
  }

  streakNode.textContent = String(stats.streak);
  bestNode.textContent = String(stats.best);
  solvedNode.textContent = String(stats.solved);
}

function updateComplexity(solved) {
  const raw = solved.elementsCount * 7 + solved.compoundsCount * 8 + solved.maxCoefficient * 2;
  const normalized = Math.min(100, Math.max(8, raw));
  complexityFill.style.width = `${normalized}%`;
}

function celebrate() {
  const colorSet = ["#00a089", "#f2a324", "#1583b6", "#7ed957"];
  const count = 22;

  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.style.left = `${35 + Math.random() * 30}%`;
    spark.style.top = `${20 + Math.random() * 26}%`;
    spark.style.background = colorSet[i % colorSet.length];
    spark.style.setProperty("--tx", `${(Math.random() - 0.5) * 220}px`);
    spark.style.setProperty("--ty", `${(Math.random() - 0.5) * 200}px`);
    celebrateLayer.appendChild(spark);

    setTimeout(() => {
      spark.remove();
    }, 820);
  }
}

function solveEquation(rawEquation) {
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
  const solution = nullspaceVector(matrix);
  const coefficients = normalizeToIntegers(solution);

  if (!coefficients.some((value) => value > 0)) {
    throw new Error("Could not determine valid coefficients.");
  }

  const leftBalanced = left
    .map((compound, index) => renderTerm(coefficients[index], compound))
    .join(" + ");

  const rightBalanced = right
    .map((compound, index) => renderTerm(coefficients[left.length + index], compound))
    .join(" + ");

  return {
    balanced: `${leftBalanced} -> ${rightBalanced}`,
    coefficients,
    elementsCount: elements.length,
    compoundsCount: allCompounds.length,
    maxCoefficient: Math.max(...coefficients),
  };
}

function renderTerm(coef, compound) {
  return coef === 1 ? compound : `${coef}${compound}`;
}

function splitEquation(inputEquation) {
  const normalized = inputEquation.replace(/\s+/g, "");
  const arrowMatch = normalized.includes("->")
    ? "->"
    : normalized.includes("=")
      ? "="
      : null;

  if (!arrowMatch) {
    throw new Error("Use '->' or '=' between reactants and products.");
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
