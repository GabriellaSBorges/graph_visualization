import { JSONData } from '../Types'
import { useEffect, useRef } from 'react';
import Graph from "graphology";
import Sigma from "sigma";
import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { cropToLargestConnectedComponent } from "graphology-components";
import forceAtlas2 from "graphology-layout-forceatlas2";
import circular from "graphology-layout/circular";
//import { NodeBorderProgram } from "@sigma/node-border"
import { createNodeBorderProgram } from "@sigma/node-border";
import circlepack from "graphology-layout/circlepack";
import louvain from "graphology-communities-louvain";
import EdgeCurveProgram from "@sigma/edge-curve";
import noverlap from 'graphology-layout-noverlap';


//import { SigmaContainer, ControlsContainer, ZoomControl, FullScreenControl, SearchControl } from "@react-sigma/core";
//import "@react-sigma/core/lib/react-sigma.min.css";


//import {subgraph} from 'graphology-operators';  // Para trabalhar com sub graphos => https://graphology.github.io/standard-library/operators.html#subgraph

/* TO DO: 
    - Separar graphology e Sigma.js em Modulos separados
    - Graphology gerar um arquivo .json e sigma apenas importar
    - Sub Clusters
    - Label Proporcional ao Node (nota: parece que o sigma usa uma mesma fonte para todo o Canva e não por nó)
    - Configurar para aceitar weight no lugar de size nas edges do dataGraph.json
*/



interface Props {
    jsonData: JSONData;
};

const GraphRenderer = (props: Props) => {
    const sigmaRef = useRef<Sigma | null>(null);

    useEffect(() => {
        // Cria um Novo Grapho
        const graph = new Graph({
            multi: true, // Permite multi arestas
            allowSelfLoops: true, // Permite arestas para o proprio nó
            type: 'directed' // Tipo da Aresta
        });

        const data = props.jsonData; // Usando os dados JSON passados como propriedade

        graph.import(data); // Importa os dados

        cropToLargestConnectedComponent(graph); // Mantém apenas o maior componente conectado do grafo

        // Calcula o tamanho dos nós com base nos graus
        const degrees = graph.nodes().map((node) => graph.degree(node));
        const minDegree = Math.min(...degrees);
        const maxDegree = Math.max(...degrees);
        const minSize = 10;
        const maxSize = 100;
        
        graph.forEachNode((node) => {
            const degree = graph.degree(node);
        
            // Define o tamanho do nó proporcional ao grau
            graph.setNodeAttribute(
                node,
                "size",
                minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize),
            );
        
            /* NÃO FUNCIONA // Define o tamanho da label proporcional ao tamanho do nó
            graph.setNodeAttribute(
                node,
                "labelSize",
                14 + ((graph.getNodeAttribute(node, "size") - minSize) / (maxSize - minSize)) * (24 - 14), // Ajuste os valores de 14 e 24 conforme necessário
            );*/
        });  
        

        // Posiciona os nós em um círculo e aplica o algoritmo Force Atlas 2 para obter um layout adequado
        circular.assign(graph);
        const settings = forceAtlas2.inferSettings(graph);
        forceAtlas2.assign(graph, { settings, iterations: 600 });

        // Identifica comunidades no grafo usando o algoritmo de Louvain
        louvain.assign(graph, {
            resolution: 1 // Resolução - Quanto maior mais comunidades
        });

        // Obtém os detalhes do que o Louvain fez
        let details = louvain.detailed(graph);

        //console.log(details.count)

        // Define cores aleatórias para cada comunidade
        const colors: Record<number, number> = {};
        for (let i = 0; i < details.count; i++){
            colors[i] = Math.random() * 16777215; 
        }

        // Atribui cores e outros atributos aos nós com base em suas comunidades
        for (let element in details.communities) {
            graph.mergeNodeAttributes(element, {
                color: "#" + Math.floor(colors[details.communities[element]] + graph.getNodeAttribute(element,'size')).toString(16),
                borderColor: "white",
                community: details.communities[element]
            });
        }

        // Agrupa visualmente os nós de acordo com suas comunidades
        circlepack.assign(graph, {
            center: 2,
            hierarchyAttributes: ["community"],
            scale: 2 // Aumenta a escala do grafico distanciando os clusters
        });

        // Aplica o layout noverlap com opções de configuração
        noverlap.assign(graph, {
            maxIterations: 500,
            settings: {
                margin: 6, // Distancia os nós
                ratio: 1.5,
                expansion: 1.5 // Quanto os nós podem expandir
              }
        });

        //console.log(graph)

        // Esconde o loader da DOM
        const loader = document.getElementById("loader") as HTMLElement;
        if (loader) loader.style.display = "none";

        // Desenha o grafo final usando Sigma
        const container = document.getElementById("container") as HTMLElement;
        container.style.height = "500px"; // Altura do Container
        container.style.width = "100%"; // Largura do Container

        // Seletor de Cluster-Comunidades
        const clusterInputParent = document.getElementById("clusterInput");

        // Verificar se o seletor já existe antes de criar novamente
        if (clusterInputParent && !clusterInputParent.querySelector("#clusterCheckboxes")) {
            // Cria um grupo de checkboxes
            const clusterCheckboxesGroup = document.createElement("div");
            clusterCheckboxesGroup.id = "clusterCheckboxes";
            
            // Adiciona a opção "Exibir Todos" como checkbox
            const showAllCheckbox = document.createElement("input");
            showAllCheckbox.type = "checkbox";
            showAllCheckbox.name = "clusterOption";
            showAllCheckbox.value = "";
            showAllCheckbox.id = "showAllCheckbox";
            showAllCheckbox.addEventListener("change", () => toggleShowAllNodes(showAllCheckbox.checked)); // Define a função de clique para exibir todos
            const showAllLabel = document.createElement("label");
            showAllLabel.htmlFor = "showAllCheckbox";
            showAllLabel.textContent = "Exibir Todos";
            clusterCheckboxesGroup.appendChild(showAllCheckbox);
            clusterCheckboxesGroup.appendChild(showAllLabel);
            
            // Adiciona as checkboxes para cada cluster
            for (let i = 0; i < details.count; i++) {
                const clusterCheckbox = document.createElement("input");
                clusterCheckbox.type = "checkbox";
                clusterCheckbox.name = "clusterOption";
                clusterCheckbox.value = i.toString();
                clusterCheckbox.id = `clusterCheckbox${i}`;
                clusterCheckbox.addEventListener("change", handleClusterChange); // Define a função de clique para selecionar o cluster
                const clusterLabel = document.createElement("label");
                clusterLabel.htmlFor = `clusterCheckbox${i}`;
                clusterLabel.textContent = `Cluster ${i + 1}`;
                clusterCheckboxesGroup.appendChild(clusterCheckbox);
                clusterCheckboxesGroup.appendChild(clusterLabel);
            }
            
            clusterInputParent.appendChild(clusterCheckboxesGroup);
        }
        
        // Função para lidar com a mudança de seleção de cluster
        function handleClusterChange(event: Event) {
            //const target = event.target as HTMLInputElement; // NÃO SEI
            setClusters(getSelectedClusters());
        }
        
        // Função para obter os clusters selecionados
        function getSelectedClusters(): string[] {
            const selectedClusters: string[] = [];
            const checkboxes = document.querySelectorAll<HTMLInputElement>("input[name=clusterOption]:checked");
            checkboxes.forEach((checkbox) => {
                selectedClusters.push(checkbox.value);
            });
            return selectedClusters;
        }
        
        // Função para lidar com a seleção de "Exibir Todos"
        function toggleShowAllNodes(showAll: boolean) {
            if (showAll) {
                setClusters([]);
            } else {
                setClusters(getSelectedClusters());
            }
        }
        
        sigmaRef.current = new Sigma(graph, container, {
            defaultNodeType: "bordered", // Tipo de node
            labelSize: 12, // Tamanho da label
            labelDensity: 10, // Densidade de Labels
            labelGridCellSize: 5, // Grade de Labels
            labelRenderedSizeThreshold: 9, // Label x Zoom
            zIndex: true,
            defaultEdgeType: "curve", // Tipo da Aresta (curvada)
            //labelFont: "Lato, sans-serif", // Fonte da Label
            itemSizesReference: "positions",
            //zoomToSizeRatioFunction: undefined,
            edgeProgramClasses: {
                curve: EdgeCurveProgram,
              },
            nodeProgramClasses: {
                bordered: createNodeBorderProgram({
                  borders: [
                    { size: { attribute: "borderSize", defaultValue: 0.0001 }, color: { attribute: "borderColor" } }, // Espessura e cor da borda do Nó
                    { size: { fill: true }, color: { attribute: "color" } }, // Cor do Nó
                  ],
                }),
              },
            });

        //console.log(sigmaRef.current)

        // Tipo e declaração de estado interno:
        interface State {
            hoveredNode?: string;
            searchQuery: string;
        
            // State derivado da query:
            selectedNode?: string;
            suggestions?: Set<string>;
        
            // State derivado do nó hovered:
            hoveredNeighbors?: Set<string>;
        }
        const state: State = { searchQuery: "" };
        
        // Atualiza o estado da pesquisa:
        function setSearchQuery(query: string) {
            state.searchQuery = query;
        
            if (query) {
                const lcQuery = query.toLowerCase();
                const suggestions = graph
                    .nodes()
                    .map((n) => ({ id: n, label: graph.getNodeAttribute(n, "label") as string }))
                    .filter(({ label }) => label.toLowerCase().includes(lcQuery));
        
                if (suggestions.length === 1 && suggestions[0].label === query) {
                    state.selectedNode = suggestions[0].id;
                    state.suggestions = undefined;
        
                    const nodePosition = sigmaRef.current?.getNodeDisplayData(state.selectedNode) as Coordinates;
                    sigmaRef.current?.getCamera().animate(nodePosition, {
                        duration: 500,
                    });
                } else {
                    state.selectedNode = undefined;
                    state.suggestions = new Set(suggestions.map(({ id }) => id));
                }
            } else {
                state.selectedNode = undefined;
                state.suggestions = undefined;
            }
        
            sigmaRef.current?.refresh({
                skipIndexation: true,
            });
        }
        
        // Atualiza o nó hovered:
        function setHoveredNode(node?: string) {
            if (node) {
                state.hoveredNode = node;
                state.hoveredNeighbors = new Set(graph.neighbors(node));
            }
        
            const nodes = graph.filterNodes((n) => n !== state.hoveredNode && !state.hoveredNeighbors?.has(n));
            const nodesIndex = new Set(nodes);
            const edges = graph.filterEdges((e) => graph.extremities(e).some((n) => nodesIndex.has(n)));
        
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
        }

        const renderer = sigmaRef.current

        // State for drag'n'drop
        let draggedNode: string | null = null;
        let isDragging = false;

        // Ações ao clicar no Nó
        renderer.on("downNode", (e) => {
            isDragging = true; // Define o estado de arrasto
            draggedNode = e.node;
            graph.setNodeAttribute(draggedNode, "highlighted", true);
        });

        // Ações ao passar o mouse sobre o Nó
        renderer.on("enterNode", (e) => {
            draggedNode = e.node; // Define o nó especifico
            setHoveredNode(draggedNode) // oculta os nós sem relação
            graph.setNodeAttribute(draggedNode, "highlighted", true); // dá destauqe ao nó
        });

        // Ações ao sair o mouse do Nó
        renderer.on("leaveNode", (e) => {
            draggedNode = e.node;
            setHoveredNode(undefined)
            graph.setNodeAttribute(draggedNode, "highlighted", false);
        });

        // Eventos com o mouse em movimento arrastando o nó
        renderer.getMouseCaptor().on("mousemovebody", (e) => {
            if (!isDragging || !draggedNode) return;

            // Get new position of node
            const pos = renderer.viewportToGraph(e);

            graph.setNodeAttribute(draggedNode, "x", pos.x);
            graph.setNodeAttribute(draggedNode, "y", pos.y);

            // Prevent sigma to move camera:
            e.preventSigmaDefault();
            e.original.preventDefault();
            e.original.stopPropagation();
        });

        // On mouse up, we reset the autoscale and the dragging mode
        renderer.getMouseCaptor().on("mouseup", () => {
            if (draggedNode) {
            graph.removeNodeAttribute(draggedNode, "highlighted");
            }
            isDragging = false;
            draggedNode = null;
        });

        // Ações ao largar o nó
        renderer.getMouseCaptor().on("mousedown", () => {
            //setHoveredNode(undefined)
            if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
        });  
        
        // Liga interações de entrada no nó de pesquisa:
        const searchInput = document.getElementById("search-input") as HTMLInputElement;

        // Monitora o input da pesquista
        searchInput.addEventListener("input", () => {
            setSearchQuery(searchInput.value || "");
        });
        searchInput.addEventListener("blur", () => {
            setSearchQuery("");
        });
        
        // Renderiza os nós de acordo com o estado interno:
        sigmaRef.current?.setSetting("nodeReducer", (node, data) => {
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

        // Define o EdgeReducer para controlar a renderização das arestas
        sigmaRef.current?.setSetting("edgeReducer", (edge, data) => {
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
    
        const setClusters = (selectedClusters: string[]) => {
            if (selectedClusters.length === 0) {
                // Se nenhum cluster estiver selecionado, exibir todos os nós
                graph.forEachNode((node) => {
                    graph.setNodeAttribute(node, "hidden", false);
                });
            } else {
                // Exibir apenas os nós dos clusters selecionados
                graph.forEachNode((node) => {
                    const community = graph.getNodeAttribute(node, "community").toString();
                    if (selectedClusters.includes(community)) {
                        graph.setNodeAttribute(node, "hidden", false);
                    } else {
                        graph.setNodeAttribute(node, "hidden", true);
                    }
                });
            }
            
            // Atualiza o gráfico Sigma para refletir as alterações
            sigmaRef.current?.refresh({
                skipIndexation: true,
            });
        };
       
        // Remover o renderizador Sigma anterior, se houver, quando este efeito for executado novamente
        return () => {
            if (sigmaRef.current) {
                sigmaRef.current.kill();
                sigmaRef.current = null;
            }
        };
    }, [props.jsonData]);

    return (
        <div>
            <div id="loader">Loading ...</div>
            <div id="clusterInput"></div>
            <div id="search">
                <input type="search" id="search-input" list="suggestions" placeholder="Search Node"></input>
                <datalist id="suggestions">
                    <option value="Myriel"></option>
                    <option value="cop30"></option>
                    <option value="brasil"></option>
                    <option value="nodelabel3"></option>
                    <option value="nodelabel4"></option>
                    <option value="nodelabel5"></option>
                </datalist>
            </div>
            <div id="container"></div>
        </div>
    );
};

export default GraphRenderer;
