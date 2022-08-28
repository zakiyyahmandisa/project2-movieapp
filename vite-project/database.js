import { openDB } from "idb";
if (!('indexedDB' in window)) {
    console.log("This browser doesn't support IndexedDB.");
   
  }

export const database = openDB('movies', 1, {
  upgrade(db){
    console.log('Creating a new object store.');
    if (!db.objectStoreNames.contains('search')) {
      const favoriteOs = db.createObjectStore('favorites', {  keyPath:"id", autoIncrement: true })
      const notesOs = db.createObjectStore('notes', {  keyPath:"id", autoIncrement: true } )
      }
  }
 
  
});