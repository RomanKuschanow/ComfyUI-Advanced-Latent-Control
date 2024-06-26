import { app } from "/scripts/app.js";
import {addCanvas, computeCanvasSize, generatePattern, recursiveLinkUpstream, renameNodeInputs, removeNodeInputs} from "./utils.js";

function drawSquares(ctx, widgetX, widgetY, squareSize, pattern) {
	const actualSquareSize = squareSize - Math.floor(squareSize / 16);
	widgetY += Math.floor(squareSize / 16) / 2;
	widgetX += Math.floor(squareSize / 16) / 2;

	pattern.forEach((value, index) => {
		const x = widgetX + index * squareSize;

		ctx.fillStyle = value === 1 ? "#222223" : "#00000000";
		ctx.strokeStyle = "#222223";
		ctx.lineWidth = Math.floor(squareSize / 16);

		if (value === 1) {
			ctx.fillRect(x, widgetY, actualSquareSize, actualSquareSize);
		}

		ctx.strokeRect(x, widgetY, actualSquareSize, actualSquareSize);

		if (squareSize >= 24) {
			ctx.font = `bold ${squareSize/3}px Arial`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.text
			ctx.fillStyle = value === 1 ? "#dbdbdc" : "#222223";
			ctx.fillText(value.toString(), x + actualSquareSize/2, widgetY + actualSquareSize/2);
		}
	});
}

const offsetWidget = {
	type: "customCanvas",
	name: "Offset-Canvas",
	get value() {
		return this.canvas.value;
	},
	set value(x) {
		this.canvas.value = x;
	},
	draw: function (ctx, node, widgetWidth, widgetY) {
		if (!node.canvasHeight) {
			computeCanvasSize(node, node.size)
		}

		let patterns = []

		if (node.type === "OffsetCombine") {
			const connectedNodes = recursiveLinkUpstream(node, node.inputs[0].type, node.type, 0)
			if (connectedNodes.length !== 0) {
				for (let [node_ID, depth] of connectedNodes) {
					const connectedNode = node.graph._nodes_by_id[node_ID]
					if (connectedNode.type !== "OffsetCombine") {
						const pattern = {
							process_every: connectedNode.widgets[0].value,
							offset: connectedNode.widgets[1].value + node.widgets[0].value,
							mode: connectedNode.widgets[2].value
						}
						patterns.push(pattern)
					}
				}
			}
		} else {
			const pattern = {
				process_every: node.widgets[0].value,
				offset: node.widgets[1].value,
				mode: node.widgets[2].value}
			patterns.push(pattern)
		}

		const pattern = generatePattern(patterns)

		const visible = true
		const t = ctx.getTransform();
		const margin = 10

		const widgetHeight = node.canvasHeight
		const width = pattern.length * 32
		const height = 32

		const scale = Math.min((widgetWidth-margin*2)/width, (widgetHeight-margin*2)/height)

		Object.assign(this.canvas.style, {
			left: `${t.e}px`,
			top: `${t.f + (widgetY*t.d)}px`,
			width: `${widgetWidth * t.a}px`,
			height: `${widgetHeight * t.d}px`,
			position: "absolute",
			zIndex: 1,
			fontSize: `${t.d * 10.0}px`,
			pointerEvents: "none",
		});

		this.canvas.hidden = !visible;

		let backgroundWidth = width * scale
		let backgroundHeight = height * scale

		let xOffset = margin
		if (backgroundWidth < widgetWidth) {
			xOffset += (widgetWidth-backgroundWidth)/2 - margin
		}
		let yOffset = margin
		if (backgroundHeight < widgetHeight) {
			yOffset += (widgetHeight-backgroundHeight)/2 - margin
		}

		let widgetX = xOffset
		widgetY = widgetY + yOffset

		const squareSize = backgroundWidth / pattern.length;

		drawSquares(ctx, widgetX, widgetY, squareSize, pattern)

		ctx.fillStyle = "#ffffff88"
		ctx.fillRect(widgetX, widgetY, backgroundWidth, backgroundHeight);
	},
};

app.registerExtension({
    name: "Comfy.LatentControl.TransformOffset",
    async beforeRegisterNodeDef (nodeType, nodeData, app){
        if (nodeData.name === "TransformOffset") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

                addCanvas(this, app, offsetWidget)

				return r;
			}
        }
    },
});

app.registerExtension({
    name: "Comfy.LatentControl.OffsetCombine",
    async beforeRegisterNodeDef (nodeType, nodeData, app){
        if (nodeData.name === "OffsetCombine") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

                addCanvas(this, app, offsetWidget)

				this.getExtraMenuOptions = function(_, options) {
					options.unshift(
						{
							content: `add offset`,
							callback: () => {
								this.addInput("offset", "OFFSET")

								renameNodeInputs(this, "offset")

								this.setDirtyCanvas(true);
							},
						},
						{
							content: `remove offset`,
							callback: () => {
								removeNodeInputs(this, [this.inputs.length-1])
								renameNodeInputs(this, "offset")
							},
						},
						{
							content: "remove all unconnected offsets",
							callback: () => {
								let indexesToRemove = []

								for (let i = 0; i < this.inputs.length; i++) {
									if (!this.inputs[i].link) {
										indexesToRemove.push(i)
									}
								}

								if (indexesToRemove.length) {
									removeNodeInputs(this, indexesToRemove)
								}
								renameNodeInputs(this, "offset")
							},
						},
					);
				}

				return r;
			}
        }
    },
});

