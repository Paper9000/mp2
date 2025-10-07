import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
// import logo from './logo.svg';
import './App.css';
import { useState } from 'react';
import axios from 'axios';
const key = process.env.REACT_APP_API_KEY || 'DEMO_KEY';
const BASE_URL = 'https://api.nasa.gov/neo/rest/v1';

type Asteroid = {
  id: string;
  name: string;
  close_approach_data: {
    close_approach_date: string;
  }[];
  estimated_diameter: {
    miles: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    }
  }
  is_potentially_hazardous_asteroid: boolean;
}
async function getObjects(start: string, end: string) {
  let response = await axios.get(`${BASE_URL}/feed?start_date=${start}&end_date=${end}&api_key=${key}`);
  return response.data;
}
async function getGalleryObjs() {
  let response = await axios.get(`${BASE_URL}/neo/browse?size=100&api_key=${key}`);
  return response.data;
}
// function GalleryOrSearch() {
//   const [view, setView] = useState('search');

//   return (
//     <div>
//       <button className = "buttons" onClick={() => setView("search")}>Search</button>
//       <button className = "buttons" onClick={() => setView("gallery")}>Gallery</button>
//       {view == "search" && <SearchBar />}
//       {view === 'gallery' && <GalleryView />} {/*we will make this later on*/}
//     </div>
//   )
// }
function GalleryView() {
  /*I want to display 100 asteroids and have some small font underneath each of them for description, with a image of some asteroid. Then I
    some categories I can filter by (like most dangerous, diamter, closest to appraoch and No filter*/
  const [filterChoice, filterer] = useState('');
  const [results, setResults] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {

    const fetchData = async () => {
      try {
        let data = await getGalleryObjs();
        setResults(data);
        console.log("Full response:", data);
        console.log("Page info:", data.page);
        console.log("Number of asteroids:", data.near_earth_objects.length);
      } catch (error) {
        alert(error);
      }

    };
    fetchData();
  }, []);
  let filtered = (results && results.near_earth_objects.flat().filter((asteroid1: Asteroid) => {
          let asteroid = asteroid1 as Asteroid;
          if (filterChoice === '') return true;
          
          if (filterChoice === 'most dangerous') {
            return asteroid.is_potentially_hazardous_asteroid === true;
          }
          if (filterChoice === "max diameter") {
            return asteroid.estimated_diameter.miles.estimated_diameter_max > 1;
          }
          if (filterChoice === "min diameter") {
            return asteroid.estimated_diameter.miles.estimated_diameter_min < 2;
          }

          return true; 
        }))
  
  
  return (
    <div>
      <button className = "buttonsg" onClick={() => filterer('')}>No filter</button>
      <button className = "buttonsg" onClick={() => filterer("most dangerous")}>most dangerous</button>
      <button className = "buttonsg" onClick={() => filterer("max diameter")}>max diameter over 1 mile</button>
      <button className = "buttonsg" onClick={() => filterer("min diameter")}>min diameter less than 2 miles</button>
      <div className='asteroid-grid'>
        {filtered && filtered.map((obj1: Asteroid, index: number) => {
          let obj = obj1 as Asteroid;
          return (
            <div key = {obj.id} className='asteroid-card' onClick={() => setSelectedIndex(index)}>
              <h4>{obj.name}</h4>
              {/* <p>Small description...</p> */}
              <div className="asteroid-icon">
                {obj.is_potentially_hazardous_asteroid ? (
                  <svg width="60" height="60" viewBox="0 0 100 100" className="hazardous-asteroid">
                    <circle cx="50" cy="50" r="45" fill="#666" />
                    <circle cx="35" cy="35" r="8" fill="rgba(0,0,0,0.3)" />
                    <circle cx="65" cy="55" r="5" fill="rgba(0,0,0,0.3)" />
                  </svg>
                ) : (
                  <svg width="60" height="60" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="#666" />
                    <circle cx="35" cy="35" r="8" fill="rgba(0,0,0,0.3)" />
                    <circle cx="65" cy="55" r="5" fill="rgba(0,0,0,0.3)" />
                  </svg>
                )}
              </div>
            </div>
          )
        })}
        {/* if it appears inside the same grid it will appear together */}
      </div>
      {selectedIndex != null && (
        <div className = "modal-overlay">
          <div className='detail-view'>
            <button className = "buttons" onClick={() => setSelectedIndex(null)}>Close</button>
            <button className = "buttons" onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}>Previous</button>
            <button className = "buttons" onClick={() => setSelectedIndex(Math.min(selectedIndex + 1, filtered.length - 1))}>Next</button>

            <h4>{filtered[selectedIndex].name}</h4>
            <p><strong>This asteroid closely approached Earth on :</strong> {filtered[selectedIndex].close_approach_data[0]?.close_approach_date ? filtered[selectedIndex].close_approach_data[0]?.close_approach_date: "Never approached Earth"}</p>
            <p><strong>and has an estimated Diameter (miles) of :</strong> {filtered[selectedIndex].estimated_diameter.miles.estimated_diameter_min.toFixed(2)} - {filtered[selectedIndex].estimated_diameter.miles.estimated_diameter_max.toFixed(2)}</p>
            <p><strong> and Potentially Hazardous? :</strong> {filtered[selectedIndex].is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</p>
          </div>
        </div>
        

      )}
    </div>
    
  )

}
function getProperDate(date: string) {
  date = date.trim();
  if (date.length === 4) { // like 2020
    return `${date}-01-01`;
  }
  if (date.length === 7) { // like 2020-09
    return `${date}-01`;
  }
  return date; // means its already good
}
function getProperEnd(start: string, end: string) {
  start = start.trim();
  end = end.trim();
  if ((end.length === 4 && end === start.substring(0, 4)) || (end === start.substring(0, 7) && end.length === 7)) { // make sure cases like 2021
    let end_first = new Date(start);
    end_first.setDate(end_first.getDate() + 7);
    let end = end_first.toISOString().split('T')[0];
    return end;
  }
  return end;
} 
//2020-01-01 -> 2020-01-08


function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [sortBy, setSortBy] = useState('Close Approach Date');
  const [ordering, setOrdering] = useState('ascending');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

   useEffect(() => {
    const timer =  setTimeout(() => {
      if (query.length < 4) return;

      const fetchData = async () => {
        try {
          if (query.length >= 4) {
            if (query.includes(",")) {
              let dates = query.split(',');
              if (dates.length === 2) {
                let start = getProperDate(dates[0].trim());
                let end = dates[1].trim();
                if (end.length === 0) {
                  let next_date =  new Date(start);
                  next_date.setDate(next_date.getDate() + 7);
                  end = next_date.toISOString().split('T')[0];
                } else if (end.length >= 4) {
                  end = getProperEnd(start, end);
                } // now I need to handle the cases of where they give like 2020-01-01,2020-09 or something like that and give back the right error
                console.log('API Key:', key); // Check if key is loaded
                console.log('Request URL:', `${BASE_URL}/feed?start_date=${start}&end_date=${end}&api_key=${key}`);
                const data = await getObjects(start, end);
                console.log("Full API response:", data);
                console.log("near_earth_objects type:", typeof data.near_earth_objects);
                console.log("near_earth_objects keys:", Object.keys(data.near_earth_objects));
                console.log("Is it an array?", Array.isArray(data.near_earth_objects));
                setResults(data);
              } else {
                alert("Please enter a start date and an end date with a gap of at most seven days in YYYY-MM-DD format separated by a comma");
              }
            } else {
              let start = getProperDate(query.trim());
              let end_first = new Date(start);
              end_first.setDate(end_first.getDate() + 7);
              let end = end_first.toISOString().split('T')[0];
              console.log('API Key:', key); // Check if key is loaded
              console.log('Request URL:', `${BASE_URL}/feed?start_date=${start}&end_date=${end}&api_key=${key}`);
              const data = await getObjects(start, end);
              setResults(data);
            }
          }
        } catch (error) {
          alert("Please have a max of 7 days between the first day and the last day");
        } 
      };
      fetchData();
   }, 500);
   return () => clearTimeout(timer);  
  }, [query]);

  // const handleSearch = async() => {
    
  // };
  let res1 = (results && Object.values(results.near_earth_objects).flat().sort((a1, b1) => {
          const a = a1 as Asteroid;
          const b = b1 as Asteroid;
          if (sortBy === "Close Approach Date") {
            if (ordering === "ascending") {
              return a.close_approach_data[0]?.close_approach_date.localeCompare(b.close_approach_data[0]?.close_approach_date);

            } else if (ordering === "descending") {
                return b.close_approach_data[0]?.close_approach_date.localeCompare(a.close_approach_data[0]?.close_approach_date);
            }
          } else if (sortBy === "name") {
            if (ordering === "ascending") {
              return a.name.localeCompare(b.name);

            } else if (ordering === "descending") {
                return b.name.localeCompare(a.name);
            }
          }
          return 0;
        }))
  

  return (
    <div>
      <input className = "bar"
        type = "text"
        value = {query}
        placeholder = "Enter a start date and an end date in YYYY-MM-DD format separated by a comma"
        onChange = {(e) => setQuery(e.target.value)}
      />
      {/* <button onClick={handleSearch}>search</button> */}
      <select onChange = {(e) => setSortBy(e.target.value)}>
        <option value = "Close Approach Date">Close Approach Date</option>
        <option value = "name">name</option>
      </select>
      <select onChange = {(e) => setOrdering(e.target.value)}>
        <option value = "ascending">ascending</option>
        <option value = "descending">descending</option>
      </select>
      {res1 && res1.map((obj1: Asteroid, index: number) => {
          let obj = obj1 as Asteroid;
          return (
            <div key={obj.id} className='search-card' onClick={() => setSelectedIndex(index)}> 
              <h3>{obj.name}</h3>
              <p><strong>Close Approach Date:</strong> {obj.close_approach_data[0]?.close_approach_date}</p>
              <p><strong>Size :</strong> {obj.estimated_diameter.miles.estimated_diameter_min < 0.2 ? "Small" : (obj.estimated_diameter.miles.estimated_diameter_min > 0.5 ? "Large": "Medium")} </p>
            </div>
          )
        })}
        {selectedIndex != null && (
        <div className = "modal-overlay">
          <div className='detail-view'>
            <button className = "buttons" onClick={() => setSelectedIndex(null)}>Close</button>
            <button className = "buttons" onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}>Previous</button>
            <button className = "buttons" onClick={() => setSelectedIndex(Math.min(selectedIndex + 1, res1.length - 1))}>Next</button>

            <h4>{res1[selectedIndex].name}</h4>
            
            <p><strong>Estimated Diameter (miles):</strong> {res1[selectedIndex].estimated_diameter.miles.estimated_diameter_min.toFixed(2)} - {res1[selectedIndex].estimated_diameter.miles.estimated_diameter_max.toFixed(2)}</p>
            <p><strong>Potentially Hazardous:</strong> {res1[selectedIndex].is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</p>
          </div>
        </div>
        

      )}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/Paper9000">
      <div className="App">
        <header className="App-header">
          <h2 className='title'>Asteroid Analysis</h2>
          <nav>
            <Link to="/search" className='link'>Search View</Link>
            <Link to="/gallery" className='link'>Gallery View</Link>
          </nav>
          
          <Routes>
            <Route path="/search" element={<SearchBar />} />
            <Route path="/gallery" element={<GalleryView />} />
            <Route path="/" element={<SearchBar />} /> {/* Default route */}
          </Routes>
          {/* <GalleryOrSearch /> */}
        </header>
      </div>
    </BrowserRouter>
    
  );
}


export default App;
