function gid(id:string):any { return document.getElementById(id); }
function tos(n:any):string  { return n.toString(); }
function px(n:number):string   { return tos(n) + "px"; }

let parameters = new URLSearchParams(window.location.search);
let query = parameters.get("q");
let page = parameters.get("p") || "0";

let search_input:HTMLInputElement = gid("search_input");
let search_button = gid("search_button");

search_input.value = query;

search_button.addEventListener("click", function() {
	let parameters = new URLSearchParams();
	parameters.set("q", search_input.value);
	parameters.set("p", page);
	window.location.replace("/?" + parameters.toString());
});

