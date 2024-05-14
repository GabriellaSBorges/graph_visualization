import { createGephiGraph, createNewGraph } from './Graphology'; // Importe as funções necessárias
import JSONdata from '../data/AtoresGraph.json'

function isJSONStructureValid(data: any): boolean {
    // Verifica se o JSON tem a estrutura esperada
    if (data && data.nodes && data.nodes.length > 0 && data.edges && data.edges.length > 0 && data.options) {
        const sampleNode = data.nodes[0];
        const sampleEdge = data.edges[0];
        if (sampleNode.key && sampleNode.attributes && sampleEdge.key && sampleEdge.source && sampleEdge.target && sampleEdge.attributes) {
            console.log("Gephi Json")
            return true;
        }
    }
    console.log("New Json")
    return false;
}

// Verifique a estrutura do JSONdata e exporte a função apropriada
export const graphFunction = isJSONStructureValid(JSONdata) ? createGephiGraph : createNewGraph;
export const graphType = isJSONStructureValid(JSONdata) ? 'Gephi' : 'Sigma';
export default JSONdata;