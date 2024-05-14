import Sigma from "sigma";
import EdgeCurveProgram from "@sigma/edge-curve";
import { createNodeBorderProgram } from "@sigma/node-border";
import Graph from "graphology";
//import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types";

export function renderSigma(graph: Graph, container: HTMLElement) {
    return new Sigma(graph, container, {
        //defaultNodeType: "bordered",
        labelSize: 12, // Tamanho da label
        labelDensity: 10, // Densidade da label
        labelGridCellSize: 5, // Tamanho da célula da grade
        labelRenderedSizeThreshold: 12, // Tamanho mínimo da label
        labelFont: "Lato, sans-serif", // Fonte da Label
        zIndex: true,
        defaultEdgeType: "curve", // Tipo de aresta
        itemSizesReference: "positions",
        minCameraRatio: 0.15,  // Zoom mínimo
        maxCameraRatio: 1.2,  // Zoom máximo
        stagePadding: 10, // Espaçamento do palco
        edgeProgramClasses: {
            curve: EdgeCurveProgram,
        },
        nodeProgramClasses: {
            bordered: createNodeBorderProgram({
                borders: [
                    { size: { attribute: "borderSize", defaultValue: 0.0001 }, color: { attribute: "borderColor" } },
                    { size: { fill: true }, color: { attribute: "color" } },
                ],
            }),
        },
    });
}
