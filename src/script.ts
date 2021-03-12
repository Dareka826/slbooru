// Get elem by id function
function gid(id:string):HTMLElement { return document.getElementById(id); }

// Get arguments from GET request
const parameters = new URLSearchParams(window.location.search);
let query = parameters.get("q") || "";

// Get the DOM elements
const search_input = <HTMLInputElement>gid("search_input");
const search_button = <HTMLButtonElement>gid("search_button");

// Set the search field to the query
search_input.value = query;

// Reload with a new query
function search_execute(page=0) {
	const parameters = new URLSearchParams();
	parameters.set("q", search_input.value); // Set the query
	parameters.set("p", page.toString());

	// Create an <a> tag and use it to change location, preserving history
	const elem_a = document.createElement("a");
	document.body.appendChild(elem_a);
	elem_a.style.display = "none";
	elem_a.href = "/?" + parameters.toString();
	elem_a.click();
}

// Add events to search input and button
search_button.addEventListener("click", function() { search_execute(); });
search_input.addEventListener("keypress", function(e) {
	if(e.key == "Enter")
		search_execute();
});

// Changes the query by adding or excluding tags
type TagChangeMode = "add" | "exclude";
// The function is used in index.html, not here
function changeQuery(tag:string, mode:TagChangeMode) { // eslint-disable-line @typescript-eslint/no-unused-vars
	if(mode == "add")          query += " " + tag;
	else if(mode == "exclude") query += " -" + tag;
	// Remove leading space
	if(query[0] == ' ') query = query.substr(1, query.length-1);
	// Set the value of search input to the query
	search_input.value = query;
	search_execute(); // Search
}
