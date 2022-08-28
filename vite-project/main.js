import "./style.css";

import {database} from "./database";
import { check } from "prettier";

// we need one state that has multiple keys - "search" "movie" "key"
//only need to store the "search" state, it does not need to be in the db 
//console.log the state of "movie search"
//create a state for favorites 

class Store {
  constructor(init) {
    const self = this;
    this.subscribers = [];
database.then(async(db) =>{
  this.db = db;
  const favMovies = await db.get('favorites', 'favorites');
  if(favMovies){
    for (const [key, value] of Object.entries(favMovies)) this.set(key, value);
    await self.db.add("favorites", value[value.length - 1])
          console.log(value[value.length - 1])
  }
  const notes = await db.get('notes', 'notes');
  if(notes){
    for (const [key, value] of Object.entries(notes)) this.set(key, value);
  }
})

    this.state = new Proxy(init, {
    async set(state, key, value) {
        state[key] = value;
        key = {'comments': "", "favorites": []}
        // if (self.db){
        //   await self.db.put("comment",value[value.length-1])}
      if(key === "favorites"){
       // add to favorite store on indexdb
       await self.db.add("favorites",value[value.length-1])}

       if(key === 'comments'){
       //add comments to comments store on indexdb 
       //db.put or db.add should add new values 
       await self.db.add("comments",value[value.length-1])

       }
        self.subscribers.forEach((subscriber) => subscriber(state));
  
      },
    });
    
  }

  

  subscribed(cb) {
    if (typeof cb !== "function") {
      throw new Error("You must subscribe with a function");
    }
    this.subscribers.push(cb);
    cb(this.state)
    console.log(cb)
  } 

  addMovie(state, val) {
    let newState = state.movies.push(val);
    this.state = Object.assign(this.state, state);
    console.log("this is val:" +val)
  }
  addFavorite(state,val){
    let newFav = state.favorites.push(val);
    this.state = Object.assign(this.state, state);
  }

  getMovies() {
    return this.state.movies;
    // have a favorites state, return this.state.movies??
   
  }
}

const store = new Store({ key: "", search: "", movies: [], favorites: [], notes: [] });

store.subscribed((state) => {
  let movieState = state.movies;
  movieState.forEach((stateMovies) => document.body.appendChild(stateMovies));
});

class Movie extends HTMLElement {
  constructor() {
    super();
    this.title = '';
    this.year = '';
    this.plot = '';
    this.comment = '';
  }

  static get observedAttributes() {
    return ['title', 'year', 'plot', 'comment'];
  }

  // invoked when one of the custom element's attributes is added, removed, or changed
  attributeChangedCallback(attributeName, oldVal, newVal) {
    if (oldVal === newVal) {
      return;
      console.log(oldVal, newVal)
    }
    // bracket b/c we dont know exactly what attributename is name, email, comment
    this[attributeName] = newVal;
  }

}
window.customElements.define('movie-component', Movie);


async function getMovie(searchText, apiKey, plot) {
  console.log(apiKey);
  const URL = `http://www.omdbapi.com/?s=${searchText}&apikey=${apiKey}`;
  const resp = await fetch(`${URL}`);
  const responseJson = await resp.json();
  console.log(responseJson);
  
  const data = responseJson.Search;
  for (let i = 0; i < data.length; i++) {
    let plotUrl = `https://www.omdbapi.com/?t=${data[i].Title}&plot=${plot}&apikey=${apiKey}`;
    const getPlot = await fetch(`${plotUrl}`);
    const plotData = await getPlot.json();

 
    //create div for each card 
    let column = document.getElementById("row");
    let columndiv = document.createElement("div");
    columndiv.className = "column";
    columndiv.id = "searchResults";
    //create card element
    let searchResults = document.getElementById("searchResults");
    let card = document.createElement("div");
    card.className = "card";
    card.id = "card";
    

    // get title and OMDb ID number
   
    let info = document.createElement("p");
    info.textContent = `${responseJson.Search[i].Title} - OMDb ID#: ${responseJson.Search[i].imdbID}`;

    //get year and rating
    let movieYear = document.createElement("p");
    movieYear.textContent = `Year Released: ${responseJson.Search[i].Year} - Rating: ${plotData.Ratings[i].Value} `;
    console.log(responseJson.Search[i].Year);

    //get plot description
    let plotDesc = document.createElement("p");
    plotDesc.textContent = `${plotData.Plot}`;
    console.log(responseJson.Search[i].imdbID);

    //get poster

    let moviePoster = document.createElement("img");
    moviePoster.src = `${responseJson.Search[i].Poster}`;
    moviePoster.style.objectFit = "scale-down";
    
    let favButton = document.createElement("button");
    favButton.textContent = "Add to Favorites"
    favButton.type = "button"
    favButton.id = "fave"
//create event listener when favorites button is clicked 
    favButton.addEventListener('click', function (e){
      e.preventDefault();
      console.log(" fav button is clicked");
      let faveObject = {
        imdbID: `${responseJson.Search[i].imdbID}`,
        title: `${responseJson.Search[i].Title}`,
        year: `${responseJson.Search[i].Year}`,
        type: `${responseJson.Search[i].Type}`
    
      }
      //add to favorites store 
      store.addFavorite(store.state, card);
      store.db.add("favorites", faveObject)
      console.log(faveObject)
      //add favorites to the page 
      let favorites = document.createElement("p");
      favorites.textContent = ` ${responseJson.Search[i].imdbID} - ${responseJson.Search[i].Title} - ${responseJson.Search[i].Year} - ${responseJson.Search[i].Type}`
      card.appendChild(favorites)
    } )

    let notes = document.createElement("textarea");
    notes.rows = "4";
    notes.cols = "50";
    notes.id= "movieNote";

    
    let submitNotes = document.createElement("button");
    submitNotes.textContent = "Submit Note"
    submitNotes.type = "button"
    // submitNotes.id ="comments"

    let viewNotes = document.createElement("button");
    viewNotes.textContent = "View Notes";
    viewNotes.value = "View Notes"
    viewNotes.type = "button";

    //create event listener when submit note button is clicked 
submitNotes.addEventListener('click', function (e){
  viewNotes.textContent = "Hide Notes";
    viewNotes.value = "Hide Notes"
 const addNote = document.createElement('div');
 addNote.id = 'hide';
 card.appendChild(addNote);
  e.preventDefault();
  console.log("notes is submitted - should add to index db")
  // TODO: add submitted notes to indexdb
  let input = document.getElementById("movieNote").value; 
  console.log(input);
  let inputText = document.createTextNode(input);
 
  let moviesNotes = {
    imdbID: `${responseJson.Search[i].imdbID}`,
    title: `${responseJson.Search[i].Title}`,
        year: `${responseJson.Search[i].Year}`,
    notes: `${input}`
  }
  //store.comment(store.state, commentObject)
  //add the comments to indexdb
 
store.db.add("notes", moviesNotes)
console.log(moviesNotes)


    // let add = false
    // //if the button hasnt been appended and the mouse is clicked
    // if(!add && document.getElementById('comments').clicked === true){
    //   let add = true;
    //   card.appendChild(viewNotes)
    
    // }

let newNote = document.createElement("p");
newNote.id = "new";
newNote.appendChild(inputText)
addNote.appendChild(newNote);
newNote.setAttribute("note", input);

    //create event listener when hide note button is clicked 

    viewNotes.addEventListener('click', function (e){
      e.preventDefault();
      console.log("view notes is clicked")
      //TODO: list all the previous notes from the array 
      // TODO: create hide notes button
      if ( viewNotes.value === "View Notes" ){ 
        viewNotes.innerHTML= "Hide Notes"
        viewNotes.value = "Hide Notes"
        //hides all the notes 
       document.getElementById("hide").style.display == "none";
       
     }
        else if (viewNotes.value === "Hide Notes"){
          viewNotes.innerHTML = "View Notes"
          viewNotes.value = "View Notes"
          //hides all the notes 
          //hold all the notes results and display that under 'view notes'
          // newNote.style.display === 'none'
          // document.getElementById("please").style.display == "block";
        }
       
    
        
      // viewNotes.innerHTML = "Hide Notes"
    //   let hideNotes = document.createElement("button");
    // hideNotes.textContent = "Hide Notes";
    // hideNotes.type = "button";
    // card.appendChild(hideNotes)


    
    } )
} )
   
    info.setAttribute('id', title)
    // movieYear.setAttribute('id', year)
    plotDesc.setAttribute('id', plot)
    //append everything to the DOM 
    card.appendChild(moviePoster);
    column.appendChild(card);
    card.appendChild(favButton)
    card.appendChild(info);
    card.appendChild(movieYear);
    card.appendChild(plotDesc);
  
    card.appendChild(notes)
    
    card.appendChild(submitNotes)
    card.appendChild(viewNotes)

store.addMovie(store.state, card)
// store.addFavorite(store.state, card)
console.log(store)
   
  }
}
//create event listener when submit button is clicked 
const button = document.getElementById("button");
button.addEventListener("click", function (e) {
  e.preventDefault();
  const searchText = document.getElementById("text").value;
  const apiKey = document.getElementById("api").value;
  const plot = document.querySelector('input[name="plot"]:checked')?.value;
  getMovie(searchText, apiKey, plot);
  console.log(plot);
});


