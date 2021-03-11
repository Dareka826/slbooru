function gid(id:string):any { return document.getElementById(id); }
function tos(n:any):string  { return n.toString(); }
function px(n:number):string   { return tos(n) + "px"; }

let parameters = new URLSearchParams(window.location.search);
let query = parameters.get("q");
let page = parameters.get("p") || "0";

let search_input:HTMLInputElement = gid("search_input");
let search_button = gid("search_button");

search_input.value = query;

function search_execute() {
	let parameters = new URLSearchParams();
	parameters.set("q", search_input.value);
	parameters.set("p", page);
	window.location.replace("/?" + parameters.toString());
}

search_button.addEventListener("click", search_execute);
search_input.addEventListener("keypress", function(e) {
	if(e.key == "Enter")
		search_execute();
});

type TagChangeMode = "add" | "exclude" | "replace";
function changeQuery(tag:string, mode:TagChangeMode) {
	if(mode == "add")          query += " " + tag;
	else if(mode == "exclude") query += " -" + tag;
	else                       query = tag;
	search_input.value = query;
	search_button.click();
}
