let current = 0;

document.addEventListener("DOMContentLoaded", () => {
    const links = [
        [0, 1], [1, 2], [0, 3], [0, 4], [1, 3],
        [1, 4], [1, 5], [2, 4], [2, 5], [3, 4],
        [4, 5], [3, 6], [3, 7], [4, 6], [4, 7],
        [4, 8], [5, 7], [5, 8], [6, 7], [7, 8]
    ];

    const svgHalf = 20 / 2;
    const positions = [
        [svgHalf - 8, svgHalf - 8], [svgHalf    , svgHalf - 8], [svgHalf + 8, svgHalf - 8],
        [svgHalf - 8, svgHalf    ], [svgHalf    , svgHalf    ], [svgHalf + 8, svgHalf    ],
        [svgHalf - 8, svgHalf + 8], [svgHalf    , svgHalf + 8], [svgHalf + 8, svgHalf + 8],
    ];

    // --- textfield
    const text = document.querySelector("#text");

    function writeCharacter(character) {
        let svg = newSvg(svgHalf*2, svgHalf*2);

        for (let i = 0; i < 20; i++) {
            if (!(character & 1<<i))
                continue;

            drawLine(svg, ...positions[links[i][0]], ...positions[links[i][1]], "#000", 2);
        }

        text.appendChild(svg);
    }

    // --- canvas
    const pad = document.querySelector("#pad");
    const padId = document.querySelector("#pad-id");
    const context = pad.getContext("2d");

    let x = 0, y = 0;
    let click = false;
    let previousClick = click;
    let anchors;
    let realAnchors;

    let size = 50;

    function initPad() {
        pad.width = 150 * window.devicePixelRatio;
        pad.height = 150 * window.devicePixelRatio;

        let half = pad.width / 2;
        let size = 50 * window.devicePixelRatio;
        anchors = [
            [half - size, half - size], [half       , half - size], [half + size, half - size],
            [half - size, half       ], [half       , half       ], [half + size, half       ],
            [half - size, half + size], [half       , half + size], [half + size, half + size],
        ];

        half = 150 / 2;
        size = 50;
        realAnchors = [
            [half - size, half - size], [half       , half - size], [half + size, half - size],
            [half - size, half       ], [half       , half       ], [half + size, half       ],
            [half - size, half + size], [half       , half + size], [half + size, half + size],
        ];
    }

    function getAnchor() {
        for (let i = 0; i < 9; i++) {
            let [ax, ay] = realAnchors[i];
            let distance = Math.hypot(x-ax, y-ay);

            if (distance < 20) {
                return i;
            }
        }

        return -1;
    }

    function updateCurrent(to) {
        current = to;
        padId.innerText = current;
    }

    let startAnchor = -1;
    let nowAnchor = -1;
    let eraseMode = undefined;

    function processWriting() {
        if (nowAnchor === startAnchor || nowAnchor === -1)
            return;

        // check if available
        let [a, b] = [nowAnchor, startAnchor];
        if (a > b) {
            [a, b] = [b, a];
        }

        let valid = false;
        let index = -1;
        for (let i = 0; i < 20; i++) {
            if (links[i][0] == a && links[i][1] == b) {
                valid = true;
                index = i;
                break;
            }
        }

        if (!valid)
            return;

        // apply connection to `current`
        if (eraseMode === undefined) {
            eraseMode = current & 1<<index;
        }

        if (eraseMode) {
            updateCurrent(current & ~(1<<index));
        } else {
            updateCurrent(current | 1<<index);
        }

        // change starting point
        startAnchor = nowAnchor;
    }

    function tick() {
        let startClick = !previousClick && click;
        let endClick = previousClick && !click;

        let anchor = getAnchor();

        if (startClick) {
            startAnchor = anchor;
        }

        if (click) {
            nowAnchor = anchor;

            processWriting();
        }

        if (endClick) {
            startAnchor = -1;
            eraseMode = undefined;
        }

        // post-tick
        previousClick = click;
    }

    function render() {
        // background
        context.fillStyle = "white";
        context.fillRect(0, 0, pad.width, pad.height);

        let half = pad.width / 2;

        // placeholder
        context.strokeStyle = "#0003";
        context.lineWidth = 2 * window.devicePixelRatio;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();

        for (let i = 0; i < 20; i++) {
            context.moveTo(...anchors[links[i][0]]);
            context.lineTo(...anchors[links[i][1]]);
        }

        context.stroke();

        // letter
        context.strokeStyle = "#000";
        context.lineWidth = 10 * window.devicePixelRatio;

        context.beginPath();

        for (let i = 0; i < 20; i++) {
            if (current & 1<<i) {
                context.moveTo(...anchors[links[i][0]]);
                context.lineTo(...anchors[links[i][1]]);
            }
        }

        context.stroke();

        // start anchor
        if (startAnchor !== -1) {
            context.beginPath();
            context.arc(...anchors[startAnchor], 15 * window.devicePixelRatio, 0, 2 * Math.PI);
            context.stroke();
            // context.fillRect(...anchors[startAnchor], 10, 10);
        }
    }

    window.addEventListener("resize", initPad);

    pad.addEventListener("mousemove", e => {
        x = e.offsetX;
        y = e.offsetY;
    });

    pad.addEventListener("mousedown", e => {
        click = true;
    });

    pad.addEventListener("mouseup", e => {
        click = false;
    });

    pad.addEventListener("contextmenu", e => {
        click = false;
    });

    function erase() {
        if (current) {
            updateCurrent(0);
            return;
        }

        if (text.children.length === 0)
            return;

        let last = text.children[text.children.length - 1];
        text.removeChild(last);
    }

    window.addEventListener("keydown", e => {
        if (e.code === "Space") {
            writeCharacter(current);
            updateCurrent(0);
        }

        if (e.code === "Backspace") {
            erase();
        }
    });

    initPad();

    setInterval(() => {
        tick();
        render();
    }, 1000 / 60);
});
