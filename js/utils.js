export function computeCanvasSize(node, size) {
	if (node.widgets[0].last_y == null) return;

	const MIN_SIZE = 64;

	const inputs = node.inputs === undefined ? 0 : node.inputs.length
	const outputs = node.outputs === undefined ? 0 : node.outputs.length

	let y = LiteGraph.NODE_WIDGET_HEIGHT * Math.max(inputs, outputs) + 5;
	let freeSpace = size[1] - y;

	// Compute the height of all non customtext widgets
	let widgetHeight = 0;
	for (let i = 0; i < node.widgets.length; i++) {
		const w = node.widgets[i];
		if (w.type !== "customCanvas") {
			if (w.computeSize) {
				widgetHeight += w.computeSize()[1] + 4;
			} else {
				widgetHeight += LiteGraph.NODE_WIDGET_HEIGHT + 5;
			}
		}
	}

	// See how large the canvas can be
	freeSpace -= widgetHeight;

	// There isnt enough space for all the widgets, increase the size of the node
	if (freeSpace < MIN_SIZE) {
		freeSpace = MIN_SIZE;
		node.size[1] = y + widgetHeight + freeSpace;
		node.graph.setDirtyCanvas(true);
	}

	// Position each of the widgets
	for (const w of node.widgets) {
		w.y = y;
		if (w.type === "customCanvas") {
			y += freeSpace;
		} else if (w.computeSize) {
			y += w.computeSize()[1] + 4;
		} else {
			y += LiteGraph.NODE_WIDGET_HEIGHT + 4;
		}
	}

	node.canvasHeight = freeSpace;
}

function gcd(a, b) {
    // Функция для вычисления наибольшего общего делителя (НОД)
    while (b !== 0) {
        let t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function lcm(a, b) {
    // Функция для вычисления наименьшего общего кратного (НОК)
    return (a * b) / gcd(a, b);
}

function findPatternLength(rules) {
    // Вычисление длины цикла как НОК всех process_every
    return rules.map(rule => rule.process_every).reduce((acc, val) => lcm(acc, val), 1);
}

export function generatePattern(rules) {
    let length = findPatternLength(rules); // Определение длины паттерна
    let pattern = new Array(length).fill(0);

    rules.forEach(rule => {
        let offset = rule.offset % rule.process_every;

        for (let i = 0; i < length; i++) {
			let value = ((i + offset) % rule.process_every === 0) === (rule.mode === "process_every") ? 1 : 0;
			pattern[i] = pattern[i] || value;
        }
    });

    return pattern;
}

export function recursiveLinkUpstream(node, slot_type, node_type, depth) {
	depth += 1
	let connections = []
	const inputList = [...Array(node.inputs.length).keys()]
	for (let i of inputList) {
		const link = node.inputs[i].link
		if (link) {
			const nodeID = node.graph.links[link].origin_id
			const slotID = node.graph.links[link].origin_slot
			const connectedNode = node.graph._nodes_by_id[nodeID]

			if (connectedNode.outputs[slotID].type === slot_type) {

				connections.push([connectedNode.id, depth])

				if (connectedNode.inputs) {
					const index = (connectedNode.type === node_type) ? 0 : null
					connections = connections.concat(recursiveLinkUpstream(connectedNode, slot_type, node_type, depth))
				}
			}
		}
	}

	return connections
}

export function renameNodeInputs(node, name) {
	for (let i=0; i < node.inputs.length; i++) {
		node.inputs[i].name = `${name}${i + 1}`
	}
}

export function removeNodeInputs(node, indexesToRemove) {
	indexesToRemove.sort((a, b) => b - a);

	for (let i of indexesToRemove) {
		if (node.inputs.length <= 2) { console.log("too short"); continue } // if only 2 left
		node.removeInput(i)
	}

	node.onResize(node.size)
}

export function addCanvas(node, app, widget) {
	widget.canvas = document.createElement("canvas");
	widget.canvas.className = "latent-control-custom-canvas";

	widget.parent = node;
	document.body.appendChild(widget.canvas);

	node.addCustomWidget(widget);

	app.canvas.onDrawBackground = function () {
		for (let n in app.graph._nodes) {
			n = graph._nodes[n];
			for (let w in n.widgets) {
				let wid = n.widgets[w];
				if (Object.hasOwn(wid, "canvas")) {
					wid.canvas.style.left = -8000 + "px";
					wid.canvas.style.position = "absolute";
				}
			}
		}
	};

	node.onResize = function (size) {
		computeCanvasSize(node, size);
	}
}


