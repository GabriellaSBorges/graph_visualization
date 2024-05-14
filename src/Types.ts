// Types.ts

// Definindo os tipos de dados para os nós
interface NodeAttributes {
    x: number;
    y: number;
    size: number;
    label: string;
    color: string;
    modularity_class?: number | undefined;
}

// Definindo os tipos de dados para as arestas
interface EdgeAttributes {
    size?: number;
    weight?: number;
}

// Definindo a interface para um nó
interface Node {
    key: string;
    attributes: NodeAttributes;
}

// Definindo a interface para uma aresta
interface Edge {
    key: string;
    source: string;
    target: string;
    attributes: EdgeAttributes;
}

interface GephiAttributes {
    creator?: string
}

interface GephiOptions {
    multi?: Boolean;
    allowSelfLoops?: Boolean;
    type?: String;
}

interface JSONData {
    attributes?: GephiAttributes;
    options?: GephiOptions;
    nodes: Node[];
    edges: Edge[];
}

interface State {
    hoveredNode?: string;
    searchQuery: string;

    // State derivado da query:
    selectedNode?: string;
    suggestions?: Set<string>;

    // State derivado do nó hovered:
    hoveredNeighbors?: Set<string>;
}

interface CommunityDetails {
    count: number;
    communities: Record<string, number>;
}

interface modularityDetails {
    count: number;
    classes: Record<string, number>;
}

// Exportando os tipos para uso em outros arquivos
export type { NodeAttributes, EdgeAttributes, Node, Edge, JSONData, State, CommunityDetails, modularityDetails};
