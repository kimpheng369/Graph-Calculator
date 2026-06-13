class GraphingCalculator {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.xmin = options.xmin || -10;
        this.xmax = options.xmax || 10;
        this.ymin = options.ymin || -10;
        this.ymax = options.ymax || 10;

        this.defaultXmin = this.xmin;
        this.defaultXmax = this.xmax;
        this.defaultYmin = this.ymin;
        this.defaultYmax = this.ymax;

        this.functions = [];
        this.vars = {}; // Custom parameters/variables

        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        this.traceX = null;
        this.showTrace = true;
        this.showSpecialPoints = true;
        this.specialPoints = [];
        this.initEvents();
    }

    mathToScreenX(mx) {
        return this.canvas.width * (mx - this.xmin) / (this.xmax - this.xmin);
    }

    mathToScreenY(my) {
        return this.canvas.height * (1 - (my - this.ymin) / (this.ymax - this.ymin));
    }

    screenToMathX(cx) {
        return this.xmin + cx * (this.xmax - this.xmin) / this.canvas.width;
    }

    screenToMathY(cy) {
        return this.ymax - cy * (this.ymax - this.ymin) / this.canvas.height;
    }
    setViewport(xmin, xmax, ymin, ymax) {
        this.xmin = xmin;
        this.xmax = xmax;
        this.ymin = ymin;
        this.ymax = ymax;
        this.calculateSpecialPoints();
        this.draw();
    }
    resetZoom() {
        this.setViewport(this.defaultXmin, this.defaultXmax, this.defaultYmin, this.defaultYmax);
    }
    setFunctions(funcs) {
        this.functions = funcs;
        this.calculateSpecialPoints();
        this.draw();
    }
    setVars(vars) {
        this.vars = vars;
        this.calculateSpecialPoints();
        this.draw();
    }
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        const ctx = this.canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
        ctx.scale(dpr, dpr);
        this.draw();
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        setTimeout(() => this.resize(), 0);
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            this.isPanning = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isPanning) {
                const dx = e.clientX - this.startX;
                const dy = e.clientY - this.startY;

                this.startX = e.clientX;
                this.startY = e.clientY;

                const mathDx = dx * (this.xmax - this.xmin) / rect.width;
                const mathDy = dy * (this.ymax - this.ymin) / rect.height;

                this.xmin -= mathDx;
                this.xmax -= mathDx;
                this.ymin += mathDy;
                this.ymax += mathDy;

                if (mouseX >= 0 && mouseX <= rect.width) {
                    this.traceX = this.screenToMathX(mouseX);
                }

                this.calculateSpecialPoints();
                this.draw();
            } else {
                if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
                    this.traceX = this.screenToMathX(mouseX);
                    this.draw();
                } else if (this.traceX !== null) {
                    this.traceX = null;
                    this.draw();
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                this.canvas.style.cursor = 'crosshair';
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const zoomCenterMathX = this.screenToMathX(mouseX);
            const zoomCenterMathY = this.screenToMathY(mouseY);

            const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;

            const newRangeX = (this.xmax - this.xmin) * zoomFactor;
            const newRangeY = (this.ymax - this.ymin) * zoomFactor;

            const pctX = (zoomCenterMathX - this.xmin) / (this.xmax - this.xmin);
            const pctY = (zoomCenterMathY - this.ymin) / (this.ymax - this.ymin);

            this.xmin = zoomCenterMathX - pctX * newRangeX;
            this.xmax = zoomCenterMathX + (1 - pctX) * newRangeX;
            this.ymin = zoomCenterMathY - pctY * newRangeY;
            this.ymax = zoomCenterMathY + (1 - pctY) * newRangeY;

            this.calculateSpecialPoints();
            this.draw();
        }, { passive: false });

        let lastTouchX = 0;
        let lastTouchY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isPanning = true;
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isPanning && e.touches.length === 1) {
                const rect = this.canvas.getBoundingClientRect();
                const dx = e.touches[0].clientX - lastTouchX;
                const dy = e.touches[0].clientY - lastTouchY;

                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;

                const mathDx = dx * (this.xmax - this.xmin) / rect.width;
                const mathDy = dy * (this.ymax - this.ymin) / rect.height;

                this.xmin -= mathDx;
                this.xmax -= mathDx;
                this.ymin += mathDy;
                this.ymax += mathDy;

                this.calculateSpecialPoints();
                this.draw();
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.isPanning = false;
        });
    }

    // Main Draw Function
    draw() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        // Clear canvas
        this.ctx.fillStyle = '#020617'; // Deep dark background
        this.ctx.fillRect(0, 0, width, height);

        // Draw adaptive Grid and Axis Lines
        this.drawGrid(width, height);
        this.drawAxes(width, height);

        // Plot each function curve
        this.functions.forEach((f) => {
            if (f.visible && f.ast) {
                this.plotFunction(f, width, height);
            }
        });

        // Draw numerical analysis points (roots, intercepts, extrema)
        if (this.showSpecialPoints) {
            this.drawSpecialPoints();
        }

        // Draw tracer cursor and coordinates tooltip
        if (this.showTrace && this.traceX !== null && this.traceX >= this.xmin && this.traceX <= this.xmax) {
            this.drawTracer(width, height);
        }
    }

    // Calculate adaptive grid increment
    calculateGridStep(range) {
        const targetDivisions = 10;
        const rawStep = range / targetDivisions;
        const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const ratio = rawStep / orderOfMagnitude;

        let step;
        if (ratio < 1.5) step = orderOfMagnitude;
        else if (ratio < 3.5) step = 2 * orderOfMagnitude;
        else if (ratio < 7.5) step = 5 * orderOfMagnitude;
        else step = 10 * orderOfMagnitude;

        return step;
    }

    // Draw grid lines and labels
    drawGrid(width, height) {
        const xStep = this.calculateGridStep(this.xmax - this.xmin);
        const yStep = this.calculateGridStep(this.ymax - this.ymin);

        this.ctx.lineWidth = 0.5;
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '10px "Inter", sans-serif';

        // 1. Vertical Grid Lines (along X-axis)
        let xStart = Math.ceil(this.xmin / xStep) * xStep;
        for (let x = xStart; x <= this.xmax; x += xStep) {
            if (Math.abs(x) < 1e-10) continue;
            
            const cx = this.mathToScreenX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(cx, 0);
            this.ctx.lineTo(cx, height);
            this.ctx.stroke();

            const yZeroScreen = this.mathToScreenY(0);
            let labelY = yZeroScreen + 15;
            if (labelY < 15) labelY = 15;
            if (labelY > height - 10) labelY = height - 10;

            const valStr = Number(x.toFixed(6)).toString();
            this.ctx.textAlign = 'center';
            this.ctx.fillText(valStr, cx, labelY);
        }

        // 2. Horizontal Grid Lines (along Y-axis)
        let yStart = Math.ceil(this.ymin / yStep) * yStep;
        for (let y = yStart; y <= this.ymax; y += yStep) {
            if (Math.abs(y) < 1e-10) continue;

            const cy = this.mathToScreenY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, cy);
            this.ctx.lineTo(width, cy);
            this.ctx.stroke();

            const xZeroScreen = this.mathToScreenX(0);
            let labelX = xZeroScreen + 8;
            if (labelX < 8) labelX = 8;
            if (labelX > width - 35) labelX = width - 35;

            const valStr = Number(y.toFixed(6)).toString();
            this.ctx.textAlign = 'left';
            this.ctx.fillText(valStr, labelX, cy + 3);
        }
    }

    // Draw primary X & Y axes
    drawAxes(width, height) {
        this.ctx.lineWidth = 1.2;
        this.ctx.strokeStyle = '#334155';

        const xZero = this.mathToScreenX(0);
        const yZero = this.mathToScreenY(0);

        if (xZero >= 0 && xZero <= width) {
            this.ctx.beginPath();
            this.ctx.moveTo(xZero, 0);
            this.ctx.lineTo(xZero, height);
            this.ctx.stroke();
        }

        if (yZero >= 0 && yZero <= height) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, yZero);
            this.ctx.lineTo(width, yZero);
            this.ctx.stroke();
        }
    }

    // Plots the curve of a specific mathematical function f
    plotFunction(f, width, height) {
        this.ctx.save();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = f.color;
        
        // Glow effect
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = f.color;
        
        let pathActive = false;
        this.ctx.beginPath();

        const stepSize = 1; 
        let prevMathY = null;

        for (let cx = 0; cx <= width; cx += stepSize) {
            const mx = this.screenToMathX(cx);
            let my;
            
            try {
                my = f.ast.evaluate(mx, this.vars);
            } catch (e) {
                my = NaN;
            }

            if (isNaN(my) || !isFinite(my)) {
                pathActive = false;
                prevMathY = null;
                continue;
            }

            const cy = this.mathToScreenY(my);

            let isAsymptote = false;
            if (prevMathY !== null && pathActive) {
                const diffMathY = Math.abs(my - prevMathY);
                const mathYScale = this.ymax - this.ymin;
                const signChanged = (my > 0 && prevMathY < 0) || (my < 0 && prevMathY > 0);
                
                if (signChanged && diffMathY > mathYScale * 1.5) {
                    isAsymptote = true;
                }
            }

            if (isAsymptote) {
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(cx, cy);
                pathActive = true;
            } else {
                if (!pathActive) {
                    this.ctx.moveTo(cx, cy);
                    pathActive = true;
                } else {
                    this.ctx.lineTo(cx, cy);
                }
            }
            prevMathY = my;
        }

        if (pathActive) {
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    // Perform numerical analysis for roots, extrema, and intersections in the active viewport
    calculateSpecialPoints() {
        if (!this.showSpecialPoints) {
            this.specialPoints = [];
            return;
        }

        const points = [];
        const samples = 400; 
        const dx = (this.xmax - this.xmin) / samples;
        
        const solveRoot = (fn, x1, x2) => {
            let y1 = fn(x1);
            let y2 = fn(x2);
            if (isNaN(y1) || isNaN(y2) || y1 * y2 > 0) return null;
            
            let a = x1, b = x2;
            for (let i = 0; i < 30; i++) {
                let mid = (a + b) / 2;
                let ymid = fn(mid);
                if (ymid === 0) return mid;
                if (y1 * ymid < 0) {
                    b = mid;
                    y2 = ymid;
                } else {
                    a = mid;
                    y1 = ymid;
                }
            }
            return (a + b) / 2;
        };

        const solveExtremum = (fn, x1, x2, isMax) => {
            let a = x1, b = x2;
            for (let i = 0; i < 40; i++) {
                let m1 = a + (b - a) / 3;
                let m2 = b - (b - a) / 3;
                let y1 = fn(m1), y2 = fn(m2);
                if (isNaN(y1) || isNaN(y2)) return null;
                
                if (isMax) {
                    if (y1 < y2) a = m1;
                    else b = m2;
                } else {
                    if (y1 > y2) a = m1;
                    else b = m2;
                }
            }
            const resX = (a + b) / 2;
            return { x: resX, y: fn(resX) };
        };

        const activeFuncs = this.functions.filter(f => f.visible && f.ast);

        activeFuncs.forEach((f) => {
            const evaluator = (x) => f.ast.evaluate(x, this.vars);

            if (this.xmin <= 0 && this.xmax >= 0) {
                try {
                    const yIntercept = evaluator(0);
                    if (!isNaN(yIntercept) && isFinite(yIntercept) && yIntercept >= this.ymin && yIntercept <= this.ymax) {
                        points.push({
                            type: 'intercept-y',
                            x: 0,
                            y: yIntercept,
                            label: `y-intercept: (0, ${yIntercept.toFixed(4)})`,
                            color: f.color
                        });
                    }
                } catch (e) {}
            }

            let prevXVal = this.xmin;
            let prevYVal = NaN;
            try { prevYVal = evaluator(prevXVal); } catch(e){}

            for (let i = 1; i <= samples; i++) {
                const curXVal = this.xmin + i * dx;
                let curYVal = NaN;
                try { curYVal = evaluator(curXVal); } catch(e){}

                if (isNaN(prevYVal) || !isFinite(prevYVal) || isNaN(curYVal) || !isFinite(curYVal)) {
                    prevXVal = curXVal;
                    prevYVal = curYVal;
                    continue;
                }

                if (prevYVal * curYVal <= 0) {
                    const rootX = solveRoot(evaluator, prevXVal, curXVal);
                    if (rootX !== null) {
                        points.push({
                            type: 'root',
                            x: rootX,
                            y: 0,
                            label: `root: (${rootX.toFixed(4)}, 0)`,
                            color: f.color
                        });
                    }
                }

                if (i > 1 && i < samples) {
                    const nextXVal = curXVal + dx;
                    let nextYVal = NaN;
                    try { nextYVal = evaluator(nextXVal); } catch(e){}

                    if (!isNaN(nextYVal) && isFinite(nextYVal)) {
                        const isPeak = curYVal > prevYVal && curYVal > nextYVal;
                        const isValley = curYVal < prevYVal && curYVal < nextYVal;

                        if (isPeak || isValley) {
                            const res = solveExtremum(evaluator, prevXVal, nextXVal, isPeak);
                            if (res && res.y >= this.ymin && res.y <= this.ymax) {
                                points.push({
                                    type: isPeak ? 'max' : 'min',
                                    x: res.x,
                                    y: res.y,
                                    label: `${isPeak ? 'max' : 'min'}: (${res.x.toFixed(4)}, ${res.y.toFixed(4)})`,
                                    color: f.color
                                });
                            }
                        }
                    }
                }
                prevXVal = curXVal;
                prevYVal = curYVal;
            }
        });

        for (let idx1 = 0; idx1 < activeFuncs.length; idx1++) {
            for (let idx2 = idx1 + 1; idx2 < activeFuncs.length; idx2++) {
                const f1 = activeFuncs[idx1];
                const f2 = activeFuncs[idx2];
                const diffEvaluator = (x) => f1.ast.evaluate(x, this.vars) - f2.ast.evaluate(x, this.vars);

                let prevXVal = this.xmin;
                let prevDiff = NaN;
                try { prevDiff = diffEvaluator(prevXVal); } catch(e){}

                for (let i = 1; i <= samples; i++) {
                    const curXVal = this.xmin + i * dx;
                    let curDiff = NaN;
                    try { curDiff = diffEvaluator(curXVal); } catch(e){}

                    if (isNaN(prevDiff) || !isFinite(prevDiff) || isNaN(curDiff) || !isFinite(curDiff)) {
                        prevXVal = curXVal;
                        prevDiff = curDiff;
                        continue;
                    }

                    if (prevDiff * curDiff <= 0) {
                        const intersectX = solveRoot(diffEvaluator, prevXVal, curXVal);
                        if (intersectX !== null) {
                            const intersectY = f1.ast.evaluate(intersectX, this.vars);
                            if (intersectY >= this.ymin && intersectY <= this.ymax) {
                                points.push({
                                    type: 'intersection',
                                    x: intersectX,
                                    y: intersectY,
                                    label: `intersect: (${intersectX.toFixed(4)}, ${intersectY.toFixed(4)})`,
                                    color: '#ffffff'
                                });
                            }
                        }
                    }
                    prevXVal = curXVal;
                    prevDiff = curDiff;
                }
            }
        }

        this.specialPoints = points.filter((pt, index, self) => 
            index === self.findIndex((p) => 
                p.type === pt.type && 
                Math.abs(p.x - pt.x) < 1e-4 && 
                Math.abs(p.y - pt.y) < 1e-4
            )
        );
    }

    drawSpecialPoints() {
        this.specialPoints.forEach((pt) => {
            const cx = this.mathToScreenX(pt.x);
            const cy = this.mathToScreenY(pt.y);

            if (cx < 0 || cx > this.canvas.width || cy < 0 || cy > this.canvas.height) return;

            let color = pt.color;
            if (pt.type === 'intersection') color = '#e2e8f0';

            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
            this.ctx.fillStyle = color;
            this.ctx.fill();

            if (this.traceX !== null) {
                const mouseCx = this.mathToScreenX(this.traceX);
                const dx = mouseCx - cx;
                if (Math.abs(dx) < 15) {
                    this.drawPointTooltip(pt.label, cx, cy, color);
                }
            }
        });
    }

    drawPointTooltip(text, cx, cy, color) {
        this.ctx.save();
        this.ctx.font = '11px "Inter", sans-serif';
        const padding = 8;
        const textWidth = this.ctx.measureText(text).width;
        const width = textWidth + padding * 2;
        const height = 24;

        const boxX = Math.max(10, Math.min(this.canvas.width / devicePixelRatio - width - 10, cx - width / 2));
        const boxY = Math.max(10, cy - height - 12);

        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.roundRect(boxX, boxY, width, height, 6);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#f8fafc';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(text, boxX + padding, boxY + 16);
        this.ctx.restore();
    }

    drawTracer(width, height) {
        const cx = this.mathToScreenX(this.traceX);
        if (cx < 0 || cx > width) return;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(cx, 0);
        this.ctx.lineTo(cx, height);
        this.ctx.stroke();
        this.ctx.restore();

        const tooltips = [];
        this.functions.forEach((f) => {
            if (f.visible && f.ast) {
                try {
                    const my = f.ast.evaluate(this.traceX, this.vars);
                    if (!isNaN(my) && isFinite(my)) {
                        const cy = this.mathToScreenY(my);
                        if (cy >= 0 && cy <= height) {
                            this.ctx.beginPath();
                            this.ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
                            this.ctx.fillStyle = f.color;
                            this.ctx.fill();
                            
                            tooltips.push({
                                text: `(x: ${this.traceX.toFixed(4)}, y: ${my.toFixed(4)})`,
                                cy: cy,
                                color: f.color
                            });
                        }
                    }
                } catch (e) {}
            }
        });

        tooltips.forEach((tt) => {
            this.drawPointTooltip(tt.text, cx, tt.cy, tt.color);
        });
    }

    exportPNG() {
        return this.canvas.toDataURL('image/png');
    }
}

// Make globally available
window.GraphingCalculator = GraphingCalculator;
alculator;
