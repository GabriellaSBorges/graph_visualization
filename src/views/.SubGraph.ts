import {subgraph} from 'graphology-operators';
import { graphFunction } from './JsonValidator';
import { JSONData } from '../Types'

interface Props {
  jsonData: JSONData;
}

const [graph, details, modularityDetails ] = graphFunction((props: Props) => props.jsonData);

const sub = subgraph(graph, function (key, attr) {
  return true || attr.community === '3';
});


console.log(sub); // => Graph instance