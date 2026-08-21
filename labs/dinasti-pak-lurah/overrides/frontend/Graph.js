import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Graph from 'react-vis-network-graph';
import { v4 as uuidv4 } from 'uuid';

function NodeGraph({ darkmode, showGraph, start, target, searchAlgorithm, searchAll }) {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [length, setLength] = useState(0);
  const [time, setTime] = useState(0);
  const [linkTotal, setLinkTotal] = useState(0)

  useEffect(() => {
    let searchTimeout;
    const handleSearch = async () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    
      searchTimeout = setTimeout(async () => {
        const response = await fetch('/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ startLink: start, targetLink: target, searchType: searchAlgorithm, searchAll: searchAll }),
        });

        const data = await response.json();

        console.log(data.pathResult);
        console.log(data.timer)
        console.log(data.count)
        generateGraph(data.pathResult, data.timer, data.count);
      }, 500); // Adjust the debounce delay as needed (e.g., 500ms)
    };

    const fetchNodeList = async (showGraph, start, target, listSolution) => {
      // template (ini dihilangin nanti)
      const nodeLists = [
        ['United States', 'German', 'Indonesia'],
        ['Hoyoverse', 'Genshin Impact', 'Wuthering Waves'], 
        ['waduh', 'kuda', 'Rick Roll'],
      ];
      // ini dihilangin kalo udah ada yang fix
      for(let node of nodeLists){
        node.push(target);
        node.unshift(start);
      }

      console.log(nodeLists);
      return nodeLists;
    };

    const generateGraph = (paths, Time, count) => {
      var graphData = {
        nodes: [],
        edges: []
      };

      for(let path of paths){
        for (let i = 0; i < path.length; i++) {
          const node = path[i]
          const isNewNode = !graphData.nodes.find(n => n.label === node);

          if(isNewNode){
            let link = path[i].replace(' ', '_');
            graphData.nodes.push({
              id: `${uuidv4()}`,
              label: path[i],
              title: `https://en.wikipedia.org/wiki/${link}`,
            });
          }
  
          if(i > 0){
                const fromNode = path[i - 1];
                const toNode = path[i];
                const fromNodeObj = graphData.nodes.find(n => n.label === fromNode);
                const toNodeObj = graphData.nodes.find(n => n.label === toNode);
                if(fromNodeObj && toNodeObj){
                  graphData.edges.push({
                    from: fromNodeObj.id,
                    to: toNodeObj.id,
                    id: `${uuidv4()}`,
                  });
              }
          }
          setLength(path.length);
        }
      }
      setGraph(graphData);
      setTime(Time);
      setLinkTotal(count);
    };

    if (start && target && showGraph) {
      handleSearch();
    }
  }, [start, target, showGraph]);

  const options = {
    edges: {
      color: {
        color: '#888888',
        highlight: '#888888',
        hover: '#888888',
        opacity: 1,
        inherit: false,
      },
      width: 0.75,
      dashes: false,
      arrows: {
        to: {enabled: true, scaleFactor: 1, type: 'arrow'},
      }
    },
    height: '630px',
    layout: {
      hierarchical: {
        direction: 'LR', 
        sortMethod: 'directed', 
        levelSeparation: 300,
      }

    },
    physics: {
      enabled: true,
      hierarchicalRepulsion: {
        nodeDistance: 100, 
      },
    },
    nodes:{
      shape:'triangleDown',
      size :10,
      mass: 1,
    },
  };

  const handleNodeClick = (event) => {
    const { nodes } = event;
    if (nodes.length > 0) {
      const clickedNodeId = nodes[0]; 
      const clickedNode = graph.nodes.find(node => node.id === clickedNodeId);
      if (clickedNode) {
        window.open(clickedNode.title, '_blank'); 
      }
    }
  };

  const events = {
    selectNode: handleNodeClick // Call handleNodeClick when a node is selected
  };

  
  return (
      <div className = "flex flex-col items-center gap-1 mt-40">
        <div className = "flex items-center justify-center border ">
            Found in Depth: {length-1} <br/>
            Time: {time} ms <br/>
            Total link visited: {linkTotal} <br/>
        </div>
        <div style={{ width: '100vh', height: '75vh' }} className="items-center align-middle justify-center border  bg-slate-300 rounded-xl mb-10">
          <Graph
            key={uuidv4()}
            options={options}
            graph={graph}
            events={events}
          />  
        </div>
      </div>
  );
}

export default NodeGraph;
