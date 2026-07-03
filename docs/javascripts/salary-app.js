const isHomePage =
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/index.html") ||
    window.location.pathname.endsWith("/local/");

if (isHomePage) {
    document.body.classList.add("is-home");
}

const salaryAppRoot = document.querySelector("[data-salary-app]");

if (salaryAppRoot) {
    const yearSelect = salaryAppRoot.querySelector("[data-year-select]");
    const modeSelect = salaryAppRoot.querySelector("[data-mode-select]");
    const chartHost = salaryAppRoot.querySelector("[data-chart]");
    const chartTitle = salaryAppRoot.querySelector("[data-chart-title]");
    const chartDescription = salaryAppRoot.querySelector(
        "[data-chart-description]",
    );
    const bucketList = salaryAppRoot.querySelector("[data-bucket-list]");
    const timelineHost = salaryAppRoot.querySelector("[data-timeline]");
    const sourceNote = salaryAppRoot.querySelector("[data-source-note]");
    const summaryCards = document.querySelector("[data-summary-cards]");
    const windowButtons = [...salaryAppRoot.querySelectorAll("[data-window]")];

    const state = {
        dataset: null,
        year: null,
        mode: "logarithmic",
        window: "10",
    };

    const formatCurrency = new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    });

    const formatNumber = new Intl.NumberFormat("es-ES", {
        maximumFractionDigits: 0,
    });

    const modeCopy = {
        logarithmic: {
            title: "Distribución logarítmica por salario medio",
            description:
                "El eje horizontal comprime las diferencias altas y abre el tramo bajo para hacer visible la base salarial.",
            axis: "Escala salarial logarítmica",
        },
        equitable: {
            title: "Distribución equitativa por cohorte",
            description:
                "Cada cohorte ocupa el mismo espacio visual para comparar salarios medios sin sesgo espacial.",
            axis: "Cohortes con peso visual uniforme",
        },
        custom: {
            title: "Distribución custom por peso laboral",
            description:
                "La posición horizontal mezcla salario medio y peso de asalariados para mostrar dónde se concentra el empleo.",
            axis: "Espacio ponderado por concentración laboral",
        },
    };

    const loadDataset = async () => {
        const datasetUrl = new URL(
            "./assets/data/salary-distribution.json",
            window.location.href,
        );
        const response = await fetch(datasetUrl);
        if (!response.ok) {
            throw new Error("No se pudo cargar el dataset salarial derivado.");
        }

        state.dataset = await response.json();
        state.year = state.dataset.available_years.at(-1);
        renderControls();
        render();
    };

    const renderControls = () => {
        yearSelect.innerHTML = "";

        state.dataset.available_years.forEach((year) => {
            const option = document.createElement("option");
            option.value = String(year);
            option.textContent = String(year);
            if (year === state.year) {
                option.selected = true;
            }
            yearSelect.append(option);
        });

        modeSelect.value = state.mode;
        windowButtons.forEach((button) => {
            button.classList.toggle(
                "is-active",
                button.dataset.window === state.window,
            );
        });
    };

    const getYearEntry = () =>
        state.dataset.series.find((entry) => entry.year === state.year);

    const normalize = (values, transform = (value) => value) => {
        const transformed = values.map(transform);
        const min = Math.min(...transformed);
        const max = Math.max(...transformed);

        if (max === min) {
            return transformed.map(() => 0.5);
        }

        return transformed.map((value) => (value - min) / (max - min));
    };

    const getBucketPositions = (buckets) => {
        const sorted = [...buckets].sort(
            (left, right) => left.average_salary - right.average_salary,
        );
        const salaryValues = sorted.map((bucket) => bucket.average_salary);
        const shareValues = sorted.map((bucket) => bucket.employee_count);
        const totalEmployees = shareValues.reduce(
            (sum, value) => sum + value,
            0,
        );

        const equitable = sorted.map(
            (_, index) => index / Math.max(sorted.length - 1, 1),
        );
        const logarithmic = normalize(salaryValues, (value) => Math.log(value));

        let cumulative = 0;
        const custom = shareValues.map((share) => {
            const portion = share / totalEmployees;
            const midpoint = cumulative + portion / 2;
            cumulative += portion;
            return midpoint;
        });

        const activePositions = {
            logarithmic,
            equitable,
            custom,
        }[state.mode];

        return sorted.map((bucket, index) => ({
            ...bucket,
            x: activePositions[index],
            y: normalize(salaryValues)[index],
            share: bucket.employee_count / totalEmployees,
        }));
    };

    const renderSummary = (yearEntry) => {
        summaryCards.innerHTML = "";

        const cards = [
            [
                "Salario medio anual",
                formatCurrency.format(yearEntry.average_salary),
            ],
            [
                "Asalariados estimados",
                formatNumber.format(yearEntry.employee_count),
            ],
            [
                "Masa salarial agregada",
                formatCurrency.format(yearEntry.salary_mass),
            ],
        ];

        cards.forEach(([label, value]) => {
            const article = document.createElement("article");
            article.className = "metric-card";
            article.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
            summaryCards.append(article);
        });
    };

    const renderBucketList = (points) => {
        bucketList.innerHTML = "";

        points
            .slice()
            .sort((left, right) => right.average_salary - left.average_salary)
            .forEach((bucket) => {
                const row = document.createElement("article");
                row.className = "bucket-row";
                row.innerHTML = `
          <div>
            <strong>${bucket.label}</strong>
            <span>${Math.round(bucket.share * 100)}% del empleo observado</span>
          </div>
          <strong>${formatCurrency.format(bucket.average_salary)}</strong>
          <span>${formatNumber.format(bucket.employee_count)} personas</span>
        `;
                bucketList.append(row);
            });
    };

    const createSvg = (viewBox) => {
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
        );
        svg.setAttribute("viewBox", viewBox);
        svg.setAttribute("class", "chart-svg");
        svg.setAttribute("role", "img");
        return svg;
    };

    const svgNode = (name, attrs = {}) => {
        const node = document.createElementNS(
            "http://www.w3.org/2000/svg",
            name,
        );
        Object.entries(attrs).forEach(([key, value]) =>
            node.setAttribute(key, String(value)),
        );
        return node;
    };

    const renderMainChart = (yearEntry) => {
        const points = getBucketPositions(yearEntry.buckets);
        const width = 920;
        const height = 420;
        const padding = { top: 30, right: 36, bottom: 70, left: 72 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const svg = createSvg(`0 0 ${width} ${height}`);

        chartTitle.textContent = modeCopy[state.mode].title;
        chartDescription.textContent = modeCopy[state.mode].description;

        for (let tick = 0; tick <= 4; tick += 1) {
            const y = padding.top + (chartHeight / 4) * tick;
            const guide = svgNode("line", {
                x1: padding.left,
                y1: y,
                x2: width - padding.right,
                y2: y,
                class: "guide-line",
            });
            svg.append(guide);
        }

        const linePath = points
            .map((point, index) => {
                const x = padding.left + point.x * chartWidth;
                const y = padding.top + chartHeight - point.y * chartHeight;
                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

        svg.append(svgNode("path", { d: linePath, class: "main-line" }));

        points.forEach((point, index) => {
            const x = padding.left + point.x * chartWidth;
            const y = padding.top + chartHeight - point.y * chartHeight;
            const radius = 14 + point.share * 44;
            const dot = svgNode("circle", {
                cx: x,
                cy: y,
                r: radius,
                class: index % 2 === 0 ? "cohort-dot" : "cohort-dot alt",
            });

            const label = svgNode("text", {
                x,
                y: y - radius - 10,
                "text-anchor": "middle",
                class: "cohort-label",
            });
            label.textContent = point.label;

            const value = svgNode("text", {
                x,
                y: y + 5,
                "text-anchor": "middle",
            });
            value.textContent = formatCurrency.format(point.average_salary);

            svg.append(dot, label, value);
        });

        const axisLabel = svgNode("text", {
            x: width / 2,
            y: height - 18,
            "text-anchor": "middle",
        });
        axisLabel.textContent = modeCopy[state.mode].axis;

        const yLabel = svgNode("text", {
            x: 24,
            y: height / 2,
            transform: `rotate(-90 24 ${height / 2})`,
            "text-anchor": "middle",
        });
        yLabel.textContent = "Salario medio anual";

        svg.append(axisLabel, yLabel);
        chartHost.innerHTML = "";
        chartHost.append(svg);

        renderBucketList(points);
    };

    const getTimelineSeries = () => {
        if (state.window === "all") {
            return state.dataset.series;
        }

        const windowSize = Number(state.window);
        return state.dataset.series.slice(-windowSize);
    };

    const renderTimeline = () => {
        const series = getTimelineSeries();
        const width = 720;
        const height = 220;
        const padding = { top: 20, right: 16, bottom: 40, left: 42 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const salaries = series.map((entry) => entry.average_salary);
        const normalizedY = normalize(salaries);
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
        );

        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("class", "timeline-svg");

        const linePath = series
            .map((entry, index) => {
                const x =
                    padding.left +
                    (index / Math.max(series.length - 1, 1)) * chartWidth;
                const y =
                    padding.top +
                    chartHeight -
                    normalizedY[index] * chartHeight;
                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

        const areaPath = `${linePath} L ${padding.left + chartWidth} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;
        svg.append(svgNode("path", { d: areaPath, class: "timeline-area" }));
        svg.append(svgNode("path", { d: linePath, class: "timeline-line" }));

        series.forEach((entry, index) => {
            const x =
                padding.left +
                (index / Math.max(series.length - 1, 1)) * chartWidth;
            const y =
                padding.top + chartHeight - normalizedY[index] * chartHeight;
            const active = entry.year === state.year;

            svg.append(
                svgNode("circle", {
                    cx: x,
                    cy: y,
                    r: active ? 7 : 4,
                    fill: active ? "#3a6b67" : "#b45f06",
                }),
            );

            const label = svgNode("text", {
                x,
                y: height - 16,
                "text-anchor": "middle",
            });
            label.textContent = String(entry.year);
            svg.append(label);
        });

        timelineHost.innerHTML = "";
        timelineHost.append(svg);
    };

    const render = () => {
        const yearEntry = getYearEntry();
        if (!yearEntry) {
            return;
        }

        renderSummary(yearEntry);
        renderMainChart(yearEntry);
        renderTimeline();
        sourceNote.textContent = state.dataset.source.note;
    };

    yearSelect.addEventListener("change", (event) => {
        state.year = Number(event.target.value);
        render();
    });

    modeSelect.addEventListener("change", (event) => {
        state.mode = event.target.value;
        render();
    });

    windowButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.window = button.dataset.window;
            renderControls();
            renderTimeline();
        });
    });

    loadDataset().catch((error) => {
        chartHost.innerHTML = `<p>${error.message}</p>`;
    });
}
