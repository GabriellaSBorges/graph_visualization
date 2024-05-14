/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { JSONData, State, CommunityDetails, Node, NodeAttributes } from '../Types'
import Sigma from "sigma";
import { renderSigma } from './Sigma';
import { handleClusterChange, getSelectedClusters, toggleShowAllNodes, setSearchQuery, setHoveredNode, setEdgeReducer, setNodeReducer } from './SigmaUtils';
import { graphFunction, graphType } from './JsonValidator'
import {subgraph} from 'graphology-operators';
import { processSubGraph, createSubGraphs } from './Graphology';
import { setupClusterCheckboxes } from './ClusterBoxes';
import AbstractGraph, { Attributes } from 'graphology-types';
import Graph from 'graphology';
import ForceSupervisor from "graphology-layout-force/worker";
import App from '../App';

// import { BiBookContent, BiRadioCircleMarked } from "react-icons/bi";
// import { SigmaContainer, ControlsContainer, ZoomControl, FullScreenControl, SearchControl,  } from "@react-sigma/core";
// import { BsArrowsFullscreen, BsFullscreenExit, BsZoomIn, BsZoomOut } from 'react-icons/bs';
//import "@react-sigma/core/lib/react-sigma.min.css";


//import {subgraph} from 'graphology-operators';  // Para trabalhar com sub graphos => https://graphology.github.io/standard-library/operators.html#subgraph

/* TO DO:
    - painel lateral com os pares das arestas e pesos
    - Graphology gerar um arquivo .json e sigma apenas importar
    - Sub Clusters
    - Configurar para aceitar weight no lugar de size nas edges do dataGraph.json
*/

interface Props {
    jsonData: JSONData;
}


const GraphRenderer = (props: Props) => {
    const sigmaSub2 = useRef<Sigma | null>(null);
    const sigmaSub = useRef<Sigma | null>(null);
    const sigmaRef = useRef<Sigma | null>(null);
    const [communityDetails] = useState<CommunityDetails | null>(null);

    // Função para renderizar o gráfico Sigma
    const renderGraph = useCallback(() => {

    const [graph, details, modularityDetails] = graphFunction(props.jsonData);
    
    // Localiza o container
    const container = document.getElementById("container") as HTMLElement;
    
    // Renderiza o grapho com o Sigma
    sigmaRef.current = renderSigma(graph, container);

    // Salvar as posições iniciais dos nós
    const finalNodePositions: { x: number, y: number; }[] = [];
    graph.nodes().forEach((node, i) => {
        finalNodePositions[i] = {
            x: graph.getNodeAttribute(node, "x"),
            y: graph.getNodeAttribute(node, "y")
        };
    });
    
    const initialNodeSizes: any[] = [];
    graph.nodes().forEach((node, i) => {
        initialNodeSizes[i] = graph.getNodeAttribute(node, "size");
    });

    // Função para animar o movimento dos nós
    function animateNodeMovement() {
        // Iterar sobre todos os nós
        graph.nodes().forEach((node, i) => {
            // Obter a posição inicial do nó
            const initialPosition = {
                x: 100 * Math.cos((i * 2 * Math.PI) / graph.order),
                y: 100 * Math.sin((i * 2 * Math.PI) / graph.order)
            };

            // Obter a posição final do nó
            const finalPosition = finalNodePositions[i];

            // Calcular a interpolação linear para obter a posição atual do nó
            const currentPosition = {
                x: initialPosition.x + (finalPosition.x - initialPosition.x) * (1 - frames / 30),
                y: initialPosition.y + (finalPosition.y - initialPosition.y) * (1 - frames / 30)
            };

            // Obter o tamanho inicial do nó
            // const initialSize = initialNodeSizes[i];

            // Atualizar a posição do nó e manter o tamanho inicial
            graph.mergeNodeAttributes(node, {
                x: currentPosition.x,
                y: currentPosition.y,
                // size: initialSize
            });
        });

        // Atualizar o layout do grafo para refletir as novas posições dos nós
        sigmaRef.current?.refresh();

        // Verificar se a animação ainda não terminou e chamar novamente a função de animação
        if (--frames > 0) {
            requestAnimationFrame(animateNodeMovement);
        }
    }

    // Iniciar a animação
    let frames = 25; // Número de quadros para a animação (60 quadros = 1 segundo a 60fps)
    animateNodeMovement();

    // graph.nodes().forEach((node, i) => {
    //     const angle = (i * 2 * Math.PI) / graph.order;
    //     graph.setNodeAttribute(node, "x", 100 * Math.cos(angle));
    //     graph.setNodeAttribute(node, "y", 100 * Math.sin(angle));
    //   });

    // // 2. Mover os nós para novas posições (usando um layout, por exemplo)
    // const layout = new ForceSupervisor(graph);
    // layout.start();

    // // 3. Restaurar as posições iniciais dos nós após o término do movimento
    // setTimeout(() => {
    //     layout.kill();

    //     // Restaure as posições iniciais dos nós
    //     graph.nodes().forEach((node, i) => {
    //         graph.setNodeAttribute(node, "x", initialNodePositions[i].x);
    //         graph.setNodeAttribute(node, "y", initialNodePositions[i].y);
    //     });

    //     // Atualize o Sigma para refletir as novas posições dos nós
    //     sigmaRef.current?.refresh();
    // }, 3000);

    

    // Esconde o loader da DOM
    const loader = document.getElementById("loader") as HTMLElement;
    if (loader) loader.style.display = "none";

    const state: State = { searchQuery: "" };

    const renderer = sigmaRef.current

    function updatesigma() { 
        sigmaRef.current?.refresh({
        skipIndexation: false,
        });
    }

    const searchQueryHandler = setSearchQuery(state, graph, sigmaRef);
    const hoveredNodeHandler = setHoveredNode(state, graph, sigmaRef);

    let hierarquia = 'community'

    if (graphType === 'Gephi') {
        hierarquia = 'modularity_class';
    }
    
    //console.log(hierarquia)

    let clustercounter = graphFunction(props.jsonData) ? details.count : modularityDetails.count;

    const setClusters = (selectedClusters: string[]) => {
        if (selectedClusters.length === 0) {
            // Se nenhum cluster estiver selecionado, exibir todos os nós
            graph.forEachNode((node) => {
                graph.setNodeAttribute(node, "hidden", false);
            });
            updatesigma()
        } else {
            // Exibir apenas os nós dos clusters selecionados
            graph.forEachNode((node) => {
                const community = graph.getNodeAttribute(node, hierarquia).toString();
                if (selectedClusters.includes(community)) {
                    graph.setNodeAttribute(node, "hidden", false);
                } else {
                    graph.setNodeAttribute(node, "hidden", true);
                }
            });
            updatesigma()
        }
    };

    // Seletor de Cluster-Comunidades
    const clusterInputParent = document.getElementById("clusterInput");

    if (clusterInputParent) {
        setupClusterCheckboxes(clusterInputParent, clustercounter, setClusters, getSelectedClusters, toggleShowAllNodes, handleClusterChange);
        updatesigma();
    }

    // State for drag'n'drop
    let draggedNode: string | null = null;


    // Obtem Informações do Nó - debbug function
    function NodeInfo (graph: any, node: any) {
        const nodeInfo = graph.getNodeAttributes(node)
        return nodeInfo
    }

    // Ações ao passar o mouse sobre o Nó
    renderer.on("enterNode", (e) => {
        draggedNode = e.node; // Define o nó especifico
        hoveredNodeHandler(draggedNode) // oculta os nós sem relação
        graph.setNodeAttribute(draggedNode, "highlighted", true); // dá destauqe ao nó
        //console.log(NodeInfo(graph, draggedNode)); // exibe informações do nó
    });

    // Ações ao sair o mouse do Nó
    renderer.on("leaveNode", (e) => {
        draggedNode = e.node;
        hoveredNodeHandler(undefined)
        graph.setNodeAttribute(draggedNode, "highlighted", false);
    });

    // Liga interações de entrada no nó de pesquisa:
    const searchInput = document.getElementById("search-input") as HTMLInputElement;

    // Monitora o input da pesquista
    searchInput.addEventListener("input", () => {
        searchQueryHandler(searchInput.value || "");
    });
    searchInput.addEventListener("blur", () => {
        searchQueryHandler("");
    });

    // Renderiza os nós de acordo com o estado interno:
    setNodeReducer(sigmaRef.current, graph, state);

    // Define o EdgeReducer para controlar a renderização das arestas
    setEdgeReducer(sigmaRef.current, graph, state);

    // Atualiza o gráfico Sigma para refletir as alterações
    updatesigma()

    // Obtem os subgraphos do grafo principal
    const subgraphs = createSubGraphs(graph);
    console.log(subgraphs)

    let selectedCluster = 0; // Inicializa o cluster selecionado como 0
    let sub: AbstractGraph<Attributes, Attributes, Attributes> | null = null; // Inicializa sub como nulo
    let subDepth = 0; // Inicializa a profundidade do subgrafo como 0
    const maxDepth = 3; // Define a profundidade máxima do subgrafo como 2
    
    // Adiciona um evento de mudança para os checkboxes
    const checkboxes = document.querySelectorAll('input[name="clusterOption"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(this: HTMLInputElement) { 
            if (this.checked) {
                selectedCluster = parseInt(this.value);
            }
        });
    });
    
    let SubGraphAttr = "community"; // Inicializa com 'community'
    
    if (graphType === 'Gephi') {
        SubGraphAttr = "modularity_class"; // Muda para 'modularity_class' se graphType for 'Gephi'
    }
    
    // Verifica o estado do botão de SubGrapho 
    const subGraphButton = document.getElementById("subGraphButton") as HTMLButtonElement;
    if (subGraphButton) {
        subGraphButton.addEventListener("click", () => {
            sigmaRef.current?.kill();
            const selectedClusters = Array.from(checkboxes)
                .filter(checkbox => (checkbox as HTMLInputElement).checked)
                .map(checkbox => parseInt((checkbox as HTMLInputElement).value));

            console.log(selectedClusters)
            
        // usa sigma para renderizar os subgrafos selecionados
        selectedClusters.forEach(cluster => {
            const subGraph = subgraphs[cluster];
            const [subdata, subcommunities, submodulaties] = processSubGraph(subGraph);
            sigmaSub.current = renderSigma(subdata, container);
            sigmaSub.current?.refresh({ skipIndexation: false });
        });
    });
}

    const mainGraphButton = document.getElementById("mainGraphButton") as HTMLButtonElement;
    if (mainGraphButton) {
        mainGraphButton.addEventListener("click", () => {
                sigmaRef.current?.kill();
                sigmaRef.current = renderSigma(graph, container);
                sigmaSub.current?.kill();
                sigmaSub.current = null;
                sigmaSub2.current?.kill();
                sigmaSub2.current = null;
                sub = null;
                subDepth = 0;
                clustercounter = graphFunction(props.jsonData) ? details.count : modularityDetails.count;
                if (clusterInputParent) {
                    setupClusterCheckboxes(clusterInputParent, clustercounter, setClusters, getSelectedClusters, toggleShowAllNodes, handleClusterChange);
                } else {
                    console.error("clusterInputParent is null.");
                }
                toggleShowAllNodes(true, setClusters);
        });
    }

    /*
    if (subGraphButton) {
        subGraphButton.addEventListener("click", () => {
            if (sub) { // Verifica se sub não é nulo antes de prosseguir
                sigmaRef.current?.kill(); // Limpa o gráfico principal
                const [subgraph, subcommunity, submodularity] = processSubGraph(sub); // Cria um subgrafo
                sigmaSub.current = renderSigma(subgraph, container); // Renderiza o subgrafo
    
                // Remove os checkboxes do gráfico principal
                const clusterInputParent = document.getElementById("clusterInput");
                if (clusterInputParent) {
                    clusterInputParent.innerHTML = ''; // Remove todos os elementos filhos
                    //console.log("input cluster removido")
                }
    
                const clustercounter = subcommunity.count; // Conta o número de clusters no subgrafo
    
                // Cria novos checkboxes para o subgrafo
                if (clusterInputParent) {
                    setupClusterCheckboxes(clusterInputParent, clustercounter, setClusters, getSelectedClusters, toggleShowAllNodes, handleClusterChange);
                    sigmaSub.current?.refresh({ skipIndexation: false }); // Atualiza o subgrafo
                }
    
                // Adiciona a capacidade de subsubgrafo
                if (subDepth < maxDepth) { // Verifica se a profundidade máxima não foi atingida
                    subDepth++; // Incrementa a profundidade do subgrafo
                    updateSubGraph(); // Atualiza o subgrafo para o próximo nível
                }
            } else {
                console.error("Subgrafo não foi inicializado.");
            }
        });
    } */
        
        
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [communityDetails, props.jsonData]);


    useEffect(() => {
        renderGraph();

        // Limpeza ao desmontar o componente
        return () => {
            if (sigmaRef.current) {
                sigmaRef.current.kill();
                sigmaRef.current = null;
            }
        };
    }, [renderGraph]);

    return (
        <><div className='container'>
                <div className='container-row'>
                    <div id="container" className='container'>
                        <span className='loading'></span>
                    </div>
                    <div className='lateral-panel'>
                        <div id="loader">Loading ...</div>
                        <div className='container-row'>
                            <button id="subGraphButton">Show SubGraph</button>
                            <button id="mainGraphButton">Show Main Graph</button>
                        </div>
                        <div className='container-item'>
                            <div id="search">
                                <input type="search" id="search-input" list="suggestions" placeholder="Search Node"></input>
                                <datalist id="suggestions">
                                    <option value="cop30"></option>
                                    <option value="brasil"></option>
                                </datalist>
                            </div>
                        </div>
                        <div className='container-item'>
                            <div id="clusterInput" className='clusterInput'></div>
                        </div>
                    </div>
                </div>
            </div></>
)};

export default GraphRenderer;
