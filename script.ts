// Get elem by id function
function gid(id:string):any { return document.getElementById(id); }

// Get arguments from GET request
let parameters = new URLSearchParams(window.location.search);
let query = parameters.get("q");
let page = parameters.get("p") || "0";

// Get the DOM elements
let search_input:HTMLInputElement   = gid("search_input");
let search_button:HTMLButtonElement = gid("search_button");

search_input.value = query;

// Reload with a new query
function search_execute() {
	let parameters = new URLSearchParams();
	parameters.set("q", search_input.value);
	parameters.set("p", page);

	let elem_a = document.createElement("a");
	document.body.appendChild(elem_a);
	elem_a.style.display = "none";
	elem_a.href = "/?" + parameters.toString();
	elem_a.click();
}

// Add events to search input and button
search_button.addEventListener("click", search_execute);
search_input.addEventListener("keypress", function(e) {
	if(e.key == "Enter")
		search_execute();
});

// Changes the query by adding, excluding tags or repclaing it
type TagChangeMode = "add" | "exclude" | "replace";
function changeQuery(tag:string, mode:TagChangeMode) {
	if(mode == "add")          query += " " + tag;
	else if(mode == "exclude") query += " -" + tag;
	else                       query = tag;
	search_input.value = query;
	search_execute();
}

// Redirect to single picture mode
function picSelected(picid:number) {
	let parameters = new URLSearchParams();
	parameters.set("q", search_input.value); // Keep the query
	parameters.set("m", "i"); // Image mode
	parameters.set("i", picid.toString()); // Image id

	let elem_a = document.createElement("a");
	document.body.appendChild(elem_a);
	elem_a.style.display = "none";
	elem_a.href = "/?" + parameters.toString();
	elem_a.click();
}
