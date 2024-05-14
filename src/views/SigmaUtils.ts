import Sigma from 'sigma';
import { State } from '../Types'
import Graph from 'graphology';
import { EdgeDisplayData, NodeDisplayData } from 'sigma/types';

type Coordinates = {
    x: number;
    y: number;
};

export function handleClusterChange(setClusters: (selectedClusters: string[]) => void, getSelectedClusters: () => string[]) {
    return (event: Event) => {
        setClusters(getSelectedClusters());
    };
}

export function getSelectedClusters() {
    const selectedClusters: string[] = [];
    const checkboxes = document.querySelectorAll<HTMLInputElement>("input[name=clusterOption]:checked");
    checkboxes.forEach((checkbox) => {
        selectedClusters.push(checkbox.value);
    });
    return selectedClusters;
}

export function toggleShowAllNodes(
    showAll: boolean,
    setClusters: (clusters: string[]) => void,
    //getSelectedClusters: () => string[]
) {
    if (showAll) {
        setClusters([]);
    } //else {
    //     setClusters(getSelectedClusters());
    // }
}


export function setSearchQuery(state: State, graph: any, sigmaRef: any) {
    return (query: string) => {
        state.searchQuery = query;
    
        if (query) {
            const lcQuery = query.toLowerCase();
            const suggestions = graph
                .nodes()
                .map((n: any) => ({ id: n, label: graph.getNodeAttribute(n, "label") as string }))
                .filter(({ label }: any) => label.toLowerCase().includes(lcQuery));
    
            if (suggestions.length === 1 && suggestions[0].label === query) {
                state.selectedNode = suggestions[0].id;
                state.suggestions = undefined;
    
                const nodePosition = sigmaRef.current?.getNodeDisplayData(state.selectedNode) as Coordinates;
                sigmaRef.current?.getCamera().animate(nodePosition, {
                    duration: 500,
                });
            } else {
                state.selectedNode = undefined;
                state.suggestions = new Set(suggestions.map(({ id }: any) => id));
            }
        } else {
            state.selectedNode = undefined;
            state.suggestions = undefined;
        }
    
        sigmaRef.current?.refresh({
            skipIndexation: true,
        });
    };
}

export function setHoveredNode(state: State, graph: any, sigmaRef: any) {
    return (node?: string) => {
        if (node) {
            state.hoveredNode = node;
            state.hoveredNeighbors = new Set(graph.neighbors(node));
        }
    
        const nodes = graph.filterNodes((n: any) => n !== state.hoveredNode && !state.hoveredNeighbors?.has(n));
        const nodesIndex = new Set(nodes);
        const edges = graph.filterEdges((e: any) => graph.extremities(e).some((n: any) => nodesIndex.has(n)));
    
        if (!node) {
            state.hoveredNode = undefined;
            state.hoveredNeighbors = undefined;
        }
    
        sigmaRef.current?.refresh({
            partialGraph: {
                nodes,
                edges,
            },
            skipIndexation: true,
        });
    };
}

export function setEdgeReducer(sigma: Sigma, graph: Graph, state: State) {
    sigma.setSetting("edgeReducer", (edge, data) => {
        const res: Partial<EdgeDisplayData> = { ...data };

        if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
            res.hidden = true;
        }

        if (
            state.suggestions &&
            (!state.suggestions.has(graph.source(edge)) || !state.suggestions.has(graph.target(edge)))
        ) {
            res.hidden = true;
        }

        return res;
    });
}

export function setNodeReducer(sigma: Sigma, graph: Graph, state: State) {
    sigma.setSetting("nodeReducer", (node, data) => {
        const res: Partial<NodeDisplayData> = { ...data };

        if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
            res.label = "";
            res.color = "#f6f6f6";
        }

        if (state.selectedNode === node) {
            res.highlighted = true;
        } else if (state.suggestions) {
            if (state.suggestions.has(node)) {
                res.forceLabel = true;
            } else {
                res.label = "";
                res.color = "#f6f6f6";
            }
        }

        return res;
    });
}