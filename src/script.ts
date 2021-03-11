// Get elem by id function
function gid(id:string):any { return document.getElementById(id); }

// Variables
const buttonDisabledColor = "#888";

// Get arguments from GET request
let parameters = new URLSearchParams(window.location.search);
let query = parameters.get("q") || "";

// Get the DOM elements
let search_input:HTMLInputElement   = gid("search_input");
let search_button:HTMLButtonElement = gid("search_button");

// Set the search field to the query
search_input.value = query;
console.log("set search_input");

// Disable navigation buttons based on page id
let page_info = gid("page-indicator").innerText.split('/');
if(page_info[0] == page_info[1]) {
	let btn = gid("next-page-btn");
	btn.disabled = true;
	btn.style.borderColor = buttonDisabledColor;
	btn.style.color = buttonDisabledColor;
}
if(page_info[0] == "1") {
	let btn = gid("prev-page-btn");
	btn.disabled = true;
	btn.style.borderColor = buttonDisabledColor;
	btn.style.color = buttonDisabledColor;
}

// Change main view flex direction, if in single image mode
if(parameters.get("m") == "i")
	gid("main-view").style.flexDirection = "column";

// Reload with a new query
function search_execute(page:number = 0) {
	let parameters = new URLSearchParams();
	parameters.set("q", search_input.value); // Set the query
	parameters.set("p", page.toString());

	let elem_a = document.createElement("a");
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

// Changes the query by adding, excluding tags or repclaing it
type TagChangeMode = "add" | "exclude";
function changeQuery(tag:string, mode:TagChangeMode) {
	if(mode == "add")          query += " " + tag;
	else if(mode == "exclude") query += " -" + tag;
	// Remove leading space
	if(query[0] == ' ') query = query.substr(1, query.length-1);
	// Set the value of search input to the query
	search_input.value = query;
	search_execute();
}
