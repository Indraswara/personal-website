import React, { useState, useEffect } from 'react';
import AutoCompleteInput from './components/AutoComplete.js';
import NodeGraph from './Graph.js';

async function sendData(start, target, searchAlgo, searchMulti) {
  var data = {
    startLink: start,
    targetLink: target,
    searchType: searchAlgo,
    searchAll: searchMulti
  }

  fetch('/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (response.ok) {
          console.log('Data sent successfully to Go backend');
        } else {
          console.error('Failed to send data to Go backend');
      }
  })
  .catch(error => {
      console.error('Error sending data to Go backend:', error);
  });
  console.log("ini send")
}

function Search({ darkmode, searchAlgorithm, searchAll }) {
  const [search, setSearch] = useState(true);
  const [start, setStart] = useState('');
  const [target, setTarget] = useState('');
  const [startTemp, setStartTemp] = useState('Indonesia');
  const [targetTemp, setTargetTemp] = useState('Indonesia');
  const [showGraph, setShowGraph] = useState(false);

  const handleSearch = () => {
    if(startTemp){
      setStart(startTemp); 
    }
    if(targetTemp){
      setTarget(targetTemp);
    }
    if((startTemp && targetTemp)){
      setStart(startTemp);
      setTarget(targetTemp);
      setShowGraph(true);
    }
    if(search && startTemp && targetTemp){
      setShowGraph(true);
      console.log(startTemp, targetTemp);
      if (startTemp && targetTemp) {
          setSearch(false);
          sendData(startTemp, targetTemp, searchAlgorithm, searchAll);
          console.log(searchAlgorithm);
          console.log("ini all",searchAll);
        }
        setShowGraph(true);
      };
    };  

    useEffect(() => {
      handleSearch()
      console.log("First send")
    }, []);

    return (
    <div className = "z-10">
      <div className="flex flex-row items-center justify-center gap-4 relative">
        <AutoCompleteInput
          placeholder="Start"
          ID = "start"
          listID="StartSuggestion"
          onChange={(value) => setStartTemp(value)}
          setStart={setStartTemp} 
        />
        <div>
          <h1 className={`${darkmode ? 'text-white' : 'text-black'}`}>
            to
          </h1>
        </div>
        <AutoCompleteInput
          placeholder="Target"
          ID = "target"
          listID="TargetSuggestion"
          onChange={(value) => setTargetTemp(value)}
          setTarget={setTargetTemp} 
        />
      </div>
      <div className="flex justify-center items-center mt-4">
        <button id="submitButton" value="submit" onClick={handleSearch} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-5 rounded-xl z-10">Search</button>
      </div>
      {showGraph && start && target && 
        <NodeGraph darkmode={darkmode} showGraph={showGraph} start={start} target={target} searchAlgorithm={searchAlgorithm} searchAll={searchAll}/>
      }</div>
  );
}

export default Search;
