document.addEventListener('DOMContentLoaded', () => {
    const parser = new MathParser();
    const canvas = document.getElementById('graph-canvas');
    const calc = new GraphingCalculator(canvas);

    let functions = [];
    let variables = {}; // { 'a': 1, 'b': 2 }
    let nextId = 1;
    let activeInput = null;

    const colors = [
        '#60a5fa', // Blue
        '#10b981', // Green
        '#f472b6', // Pink
        '#fbbf24', // Amber
        '#a78bfa', // Violet
        '#22d3ee', // Cyan
        '#f87171'  // Red
    ];

    const presets = [
        {
            title: "Harmonic Oscillations",
            desc: "Sine wave with variable amplitude and frequency.",
            xmin: -10, xmax: 10, ymin: -5, ymax: 5,
            formulas: [
                { formula: "a * sin(b * x)", color: colors[0] }
            ],
            vars: { a: 2, b: 1 }
        },
        {
            title: "Polynomial Exploration",
            desc: "Quadratic function with adjustable coefficients.",
            xmin: -5, xmax: 5, ymin: -10, ymax: 10,
            formulas: [
                { formula: "a*x^2 + b*x + c", color: colors[1] }
            ],
            vars: { a: 1, b: 0, c: -2 }
        },
        {
            title: "Damped Vibrations",
            desc: "Exponential decay affecting a periodic wave.",
            xmin: -2, xmax: 12, ymin: -4, ymax: 4,
            formulas: [
                { formula: "a * exp(-b * x) * cos(5x)", color: colors[2] }
            ],
            vars: { a: 3, b: 0.2 }
        },
        {
            title: "Gaussian Bell",
            desc: "The normal distribution curve with adjustable spread.",
            xmin: -5, xmax: 5, ymin: -0.5, ymax: 1.5,
            formulas: [
                { formula: "exp(-(x/s)^2)", color: colors[5] }
            ],
            vars: { s: 1 }
        }
    ];

    // UI Elements
    const sidebar = document.getElementById('main-sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const tabsContainer = document.querySelector('.tabs');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const functionsList = document.getElementById('functions-list');
    const addFunctionBtn = document.getElementById('add-function-btn');
    const presetsContainer = document.getElementById('presets-container');
    const variablesContainer = document.getElementById('variables-container');

    const inputXmin = document.getElementById('setting-xmin');
    const inputXmax = document.getElementById('setting-xmax');
    const inputYmin = document.getElementById('setting-ymin');
    const inputYmax = document.getElementById('setting-ymax');
    const btnUpdateViewport = document.getElementById('update-viewport-btn');
    const btnResetViewport = document.getElementById('reset-viewport-btn');
    const btnClearAll = document.getElementById('clear-all-btn');
    const btnExport = document.getElementById('export-btn');
    const chkTrace = document.getElementById('toggle-trace');
    const chkSpecialPoints = document.getElementById('toggle-special-pts');

    const tableFnSelect = document.getElementById('table-fn-select');
    const inputTableStart = document.getElementById('table-start');
    const inputTableEnd = document.getElementById('table-end');
    const inputTableStep = document.getElementById('table-step');
    const btnGenerateTable = document.getElementById('generate-table-btn');
    const tableOutputWrap = document.getElementById('table-output-wrap');
    const tableBody = document.getElementById('values-table-body');
    const specialPointsList = document.getElementById('special-points-list-container');

    const kbTriggerBtn = document.getElementById('keyboard-trigger-btn');
    const kbPanel = document.getElementById('virtual-keyboard-panel');
    const kbCloseBtn = document.getElementById('close-keyboard-btn');
    const kbGrid = document.querySelector('.keyboard-grid');

    // Sidebar Logic
    const toggleSidebar = (show) => {
        if (show) {
            sidebar.classList.remove('collapsed');
        } else {
            sidebar.classList.add('collapsed');
        }
        
        // Trigger resize after transition starts and finishes
        const resizeInterval = setInterval(() => calc.resize(), 16);
        setTimeout(() => clearInterval(resizeInterval), 450); // Sidebar transition is 0.4s
    };

    sidebar.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'width' || e.propertyName === 'transform') {
            calc.resize();
        }
    });

    openSidebarBtn.addEventListener('click', () => toggleSidebar(true));
    closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));

    // Tabs Logic
    tabsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.tab-btn');
        if (!target) return;

        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        target.classList.add('active');
        const activeTabId = target.getAttribute('data-tab');
        document.getElementById(activeTabId).classList.add('active');
    });

    const updateSettingsInputs = () => {
        inputXmin.value = Number(calc.xmin.toFixed(4));
        inputXmax.value = Number(calc.xmax.toFixed(4));
        inputYmin.value = Number(calc.ymin.toFixed(4));
        inputYmax.value = Number(calc.ymax.toFixed(4));
    };

    const originalViewportSetter = calc.setViewport;
    calc.setViewport = function(xmin, xmax, ymin, ymax) {
        originalViewportSetter.call(calc, xmin, xmax, ymin, ymax);
        updateSettingsInputs();
        updateAnalysisList();
    };

    btnUpdateViewport.addEventListener('click', () => {
        const xmin = parseFloat(inputXmin.value);
        const xmax = parseFloat(inputXmax.value);
        const ymin = parseFloat(inputYmin.value);
        const ymax = parseFloat(inputYmax.value);

        if (!isNaN(xmin) && !isNaN(xmax) && !isNaN(ymin) && !isNaN(ymax)) {
            calc.setViewport(xmin, xmax, ymin, ymax);
        }
    });

    document.getElementById('hud-zoom-in').addEventListener('click', () => {
        const rangeX = calc.xmax - calc.xmin;
        const rangeY = calc.ymax - calc.ymin;
        const midX = (calc.xmin + calc.xmax) / 2;
        const midY = (calc.ymin + calc.ymax) / 2;
        calc.setViewport(midX - rangeX * 0.35, midX + rangeX * 0.35, midY - rangeY * 0.35, midY + rangeY * 0.35);
    });

    document.getElementById('hud-zoom-out').addEventListener('click', () => {
        const rangeX = calc.xmax - calc.xmin;
        const rangeY = calc.ymax - calc.ymin;
        const midX = (calc.xmin + calc.xmax) / 2;
        const midY = (calc.ymin + calc.ymax) / 2;
        calc.setViewport(midX - rangeX * 0.65, midX + rangeX * 0.65, midY - rangeY * 0.65, midY + rangeY * 0.65);
    });

    document.getElementById('hud-reset').addEventListener('click', () => calc.resetZoom());
    btnResetViewport.addEventListener('click', () => calc.resetZoom());

    chkTrace.addEventListener('change', () => {
        calc.showTrace = chkTrace.checked;
        calc.draw();
    });

    chkSpecialPoints.addEventListener('change', () => {
        calc.showSpecialPoints = chkSpecialPoints.checked;
        calc.calculateSpecialPoints();
        calc.draw();
        updateAnalysisList();
    });

    // Variable Management
    const detectVariables = () => {
        const detected = new Set();
        functions.forEach(f => {
            if (f.rawString) {
                // Use a simple regex to find letters that are not functions or the 'x' variable
                const matches = f.rawString.match(/[a-zA-Z_][a-zA-Z0-9_]*/g);
                if (matches) {
                    matches.forEach(m => {
                        const lower = m.toLowerCase();
                        if (lower !== 'x' && !parser.functions.has(lower) && !(lower in parser.constants)) {
                            detected.add(m);
                        }
                    });
                }
            }
        });
        return Array.from(detected).sort();
    };

    let variableSettings = {}; // { 'a': { min: -10, max: 10, playing: false } }
    let animationId = null;

    const updateVariablesUI = () => {
        const currentVars = detectVariables();
        
        // Clean up variables object - remove ones no longer present
        Object.keys(variables).forEach(v => {
            if (!currentVars.includes(v)) {
                delete variables[v];
                delete variableSettings[v];
            }
        });

        if (currentVars.length === 0) {
            variablesContainer.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px;">Add a variable like 'a' in your function to see a slider here.</p>`;
            return;
        }

        variablesContainer.innerHTML = '';
        currentVars.forEach(v => {
            if (variables[v] === undefined) variables[v] = 1;
            if (variableSettings[v] === undefined) {
                variableSettings[v] = { min: -10, max: 10, playing: false, direction: 1 };
            }

            const settings = variableSettings[v];
            const card = document.createElement('div');
            card.className = 'variable-card';
            card.innerHTML = `
                <div class="variable-info">
                    <span class="variable-name">${v}</span>
                    <div class="variable-controls">
                        <button type="button" class="play-btn ${settings.playing ? 'active' : ''}" id="play-${v}" title="Animate Variable">
                            ${settings.playing ? '⏸' : '▶'}
                        </button>
                        <input type="number" class="variable-input" value="${variables[v].toFixed(2)}" step="0.1" id="val-${v}">
                    </div>
                </div>
                <div class="slider-container">
                    <input type="range" min="${settings.min}" max="${settings.max}" step="0.01" value="${variables[v]}" id="slider-${v}">
                </div>
                <div class="variable-range-settings">
                    <div class="range-input-group">
                        <label>Min</label>
                        <input type="number" class="range-input" value="${settings.min}" id="min-${v}">
                    </div>
                    <div class="range-input-group">
                        <label>Max</label>
                        <input type="number" class="range-input" value="${settings.max}" id="max-${v}">
                    </div>
                </div>
            `;
            variablesContainer.appendChild(card);

            const slider = card.querySelector(`#slider-${v}`);
            const input = card.querySelector(`#val-${v}`);
            const minInput = card.querySelector(`#min-${v}`);
            const maxInput = card.querySelector(`#max-${v}`);
            const playBtn = card.querySelector(`#play-${v}`);

            const updateValue = (newVal) => {
                variables[v] = newVal;
                input.value = newVal.toFixed(2);
                slider.value = newVal;
                calc.setVars(variables);
            };

            slider.addEventListener('input', (e) => updateValue(parseFloat(e.target.value)));
            input.addEventListener('change', (e) => updateValue(parseFloat(e.target.value)));

            minInput.addEventListener('change', (e) => {
                settings.min = parseFloat(e.target.value);
                slider.min = settings.min;
            });

            maxInput.addEventListener('change', (e) => {
                settings.max = parseFloat(e.target.value);
                slider.max = settings.max;
            });

            playBtn.addEventListener('click', () => {
                settings.playing = !settings.playing;
                playBtn.classList.toggle('active', settings.playing);
                playBtn.innerHTML = settings.playing ? '⏸' : '▶';
                
                if (settings.playing && !animationId) {
                    startAnimationLoop();
                }
            });
        });
        calc.setVars(variables);
    };

    const startAnimationLoop = () => {
        const animate = () => {
            let stillPlaying = false;
            Object.keys(variableSettings).forEach(v => {
                const s = variableSettings[v];
                if (s.playing) {
                    stillPlaying = true;
                    const range = s.max - s.min;
                    const step = range / 200; // Complete cycle in ~3 seconds at 60fps
                    
                    variables[v] += step * s.direction;
                    
                    if (variables[v] >= s.max) {
                        variables[v] = s.max;
                        s.direction = -1;
                    } else if (variables[v] <= s.min) {
                        variables[v] = s.min;
                        s.direction = 1;
                    }

                    const input = document.getElementById(`val-${v}`);
                    const slider = document.getElementById(`slider-${v}`);
                    if (input) input.value = variables[v].toFixed(2);
                    if (slider) slider.value = variables[v];
                }
            });

            if (stillPlaying) {
                calc.setVars(variables);
                animationId = requestAnimationFrame(animate);
            } else {
                animationId = null;
            }
        };
        animationId = requestAnimationFrame(animate);
    };

    // Function Row Management
    const addFunctionRow = (exprText = '', colorHex = null) => {
        const id = `fn-${nextId++}`;
        const color = colorHex || colors[functions.length % colors.length];

        const fnObj = {
            id: id,
            rawString: exprText,
            ast: null,
            color: color,
            visible: true,
            error: null
        };

        functions.push(fnObj);

        const row = document.createElement('div');
        row.className = 'function-row';
        row.id = `row-${id}`;
        row.innerHTML = `
            <div class="function-meta">
                <div class="function-left">
                    <input type="checkbox" class="visibility-checkbox" checked id="vis-${id}">
                    <div class="color-picker-wrapper" style="background-color: ${color};">
                        <input type="color" class="color-input" value="${color}" id="color-${id}">
                    </div>
                    <span class="function-name">${id.replace('-', '')}(x)</span>
                </div>
                <button type="button" class="delete-btn" id="del-${id}">×</button>
            </div>
            <div class="input-group">
                <span class="math-prefix">=</span>
                <input type="text" class="formula-input" value="${exprText}" placeholder="e.g. sin(x)" id="input-${id}">
            </div>
        `;

        functionsList.appendChild(row);

        const inputEl = row.querySelector('.formula-input');
        const colorPicker = row.querySelector('.color-input');
        const colorWrapper = row.querySelector('.color-picker-wrapper');
        const visCheckbox = row.querySelector('.visibility-checkbox');
        const deleteBtn = row.querySelector('.delete-btn');

        inputEl.addEventListener('focus', () => activeInput = inputEl);

        const compileFunction = () => {
            const val = inputEl.value;
            fnObj.rawString = val;

            if (val.trim() === '') {
                fnObj.ast = null;
                fnObj.error = null;
                updateCalculator();
                updateVariablesUI();
                return;
            }

            try {
                const ast = parser.parse(val);
                fnObj.ast = ast;
                fnObj.error = null;
            } catch (err) {
                fnObj.ast = null;
                fnObj.error = err.message;
            }

            updateCalculator();
            updateVariablesUI();
        };

        inputEl.addEventListener('input', compileFunction);

        colorPicker.addEventListener('input', (e) => {
            const newColor = e.target.value;
            colorWrapper.style.backgroundColor = newColor;
            fnObj.color = newColor;
            updateCalculator();
        });

        visCheckbox.addEventListener('change', () => {
            fnObj.visible = visCheckbox.checked;
            updateCalculator();
        });

        deleteBtn.addEventListener('click', () => {
            functions = functions.filter(f => f.id !== id);
            row.remove();
            if (activeInput === inputEl) activeInput = null;
            updateCalculator();
            updateVariablesUI();
        });

        if (exprText) compileFunction();
        return inputEl;
    };

    addFunctionBtn.addEventListener('click', () => {
        const input = addFunctionRow();
        input.focus();
    });

    const updateCalculator = () => {
        calc.setFunctions(functions);
        calc.setVars(variables);
        syncDropdownSelect();
        updateAnalysisList();
    };

    const syncDropdownSelect = () => {
        const prevVal = tableFnSelect.value;
        tableFnSelect.innerHTML = '';
        const activeFuncs = functions.filter(f => f.ast);

        if (activeFuncs.length === 0) {
            tableFnSelect.innerHTML = `<option value="">-- No Functions --</option>`;
            btnGenerateTable.disabled = true;
            return;
        }

        btnGenerateTable.disabled = false;
        activeFuncs.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = `${f.id.replace('-', '')}(x) = ${f.rawString}`;
            tableFnSelect.appendChild(opt);
        });
        if (prevVal) tableFnSelect.value = prevVal;
    };

    const updateAnalysisList = () => {
        specialPointsList.innerHTML = '';
        if (!calc.showSpecialPoints) {
            specialPointsList.innerHTML = `<div style="font-size: 12px; color: var(--text-muted);">Points disabled in Settings.</div>`;
            return;
        }
        if (calc.specialPoints.length === 0) {
            specialPointsList.innerHTML = `<div style="font-size: 12px; color: var(--text-muted);">No critical points in view.</div>`;
            return;
        }

        [...calc.specialPoints].sort((a,b) => a.x - b.x).forEach(pt => {
            const item = document.createElement('div');
            item.className = 'special-point-item'; // CSS handles colors via type labels
            item.innerHTML = `
                <div style="font-weight: 600; font-size: 11px; color: ${pt.color};">${pt.type.toUpperCase()}</div>
                <div style="font-family: 'Fira Code', monospace; font-size: 12px; color: var(--text-secondary);">(${pt.x.toFixed(4)}, ${pt.y.toFixed(4)})</div>
            `;
            specialPointsList.appendChild(item);
        });
    };

    btnGenerateTable.addEventListener('click', () => {
        const fnId = tableFnSelect.value;
        const targetFn = functions.find(f => f.id === fnId);
        if (!targetFn || !targetFn.ast) return;

        const start = parseFloat(inputTableStart.value);
        const end = parseFloat(inputTableEnd.value);
        const step = parseFloat(inputTableStep.value);

        if (isNaN(start) || isNaN(end) || isNaN(step) || step <= 0 || start > end) {
            alert("Invalid table parameters.");
            return;
        }

        tableBody.innerHTML = '';
        tableOutputWrap.style.display = 'block';

        for (let x = start; x <= end + 1e-9; x += step) {
            let y;
            try { y = targetFn.ast.evaluate(x, variables); } catch(e) { y = NaN; }
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${x.toFixed(4)}</td><td>${isNaN(y) ? 'Undef' : y.toFixed(4)}</td>`;
            tableBody.appendChild(tr);
        }
    });

    const loadPreset = (preset) => {
        functions = [];
        functionsList.innerHTML = '';
        variables = preset.vars || {};
        preset.formulas.forEach(f => addFunctionRow(f.formula, f.color));
        calc.setViewport(preset.xmin, preset.xmax, preset.ymin, preset.ymax);
        updateVariablesUI();
    };

    const renderPresets = () => {
        presetsContainer.innerHTML = '';
        presets.forEach(p => {
            const card = document.createElement('button');
            card.className = 'preset-card';
            card.innerHTML = `<h4>${p.title}</h4><p>${p.desc}</p>`;
            card.addEventListener('click', () => {
                loadPreset(p);
                document.getElementById('btn-tab-functions').click();
            });
            presetsContainer.appendChild(card);
        });
    };

    btnExport.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'graph_calculator_export.png';
        link.href = calc.exportPNG();
        link.click();
    });

    btnClearAll.addEventListener('click', () => {
        functions = [];
        functionsList.innerHTML = '';
        variables = {};
        updateVariablesUI();
        updateCalculator();
    });

    // Keyboard Logic
    kbTriggerBtn.addEventListener('click', () => kbPanel.classList.toggle('open'));
    kbCloseBtn.addEventListener('click', () => kbPanel.classList.remove('open'));

    kbGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.key-btn');
        if (!btn) return;
        const val = btn.getAttribute('data-val');

        if (!activeInput) {
            if (functions.length === 0) addFunctionRow();
            activeInput = document.getElementById(`input-${functions[0].id}`);
        }

        activeInput.focus();
        const start = activeInput.selectionStart;
        const end = activeInput.selectionEnd;
        const orig = activeInput.value;

        if (val === 'clear') {
            activeInput.value = '';
        } else if (val === 'backspace') {
            activeInput.value = orig.substring(0, start === end ? start - 1 : start) + orig.substring(end);
        } else {
            activeInput.value = orig.substring(0, start) + val + orig.substring(end);
            activeInput.selectionStart = activeInput.selectionEnd = start + val.length;
        }
        activeInput.dispatchEvent(new Event('input'));
    });

    renderPresets();
    loadPreset(presets[0]);
    updateSettingsInputs();
});
