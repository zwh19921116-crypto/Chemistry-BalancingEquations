# Chemistry Balancing Equations

Interactive chemistry-only web application for balancing chemical equations.

## Features
- Parse compounds with element counts and parentheses (for example, `Mg3(PO4)2`)
- Balance equations using linear algebra (nullspace solving)
- Return smallest whole-number coefficients
- Preset examples plus a surprise-equation button
- Fun interaction: streak, best streak, solved counter, and celebration effects
- Reaction complexity meter for each balanced equation

## Run
Open `index.html` in a browser.

Or start a simple local server:

```powershell
cd "E:\Edgeducate\Software\Chemistry\Balancing Equations"
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Examples
- `Fe + O2 -> Fe2O3`
- `C3H8 + O2 -> CO2 + H2O`
- `Na3PO4 + MgCl2 -> NaCl + Mg3(PO4)2`
