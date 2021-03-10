const http = require("http");
const fs   = require("fs");
const url  = require("url");

const extensionsMIME = {
	".js"  :  "text/javascript",
	".css" :  "text/css",
	".jpg" : "image/jpeg",
	".jpeg": "image/jpeg",
	".png" : "image/png",
	".mp4" : "video/mp4",
	".webm": "video/webm",
	".mkv" : "video/mkv"
};

const pageTemplate = fs.readFileSync("index.html", "utf8");
const picsPerPage = 3;
const metadata = [];

function genPic(id:number):string {
	let e:string = "<div class=\"image-small-container\"><img src=\"";
	e += "img/" + metadata[id].file;
	e += "\" class=\"image-small\"></img></div>";
	return e;
}

function parseMetadata() {
	const metadataFiles = fs.readdirSync("metadata");
	metadataFiles.sort();
	let x = 0;
	for(let mdf of metadataFiles) {
		let data = fs.readFileSync("metadata/" + mdf);
		metadata[x++] = JSON.parse(data);
	}
}

const server = http.createServer((req:any, res:any) => {
	// Requested file path
	let filePath = "." + req.url;
	let extension = filePath.match(/\.[^.]+$/)[0];

	// Detect content type
	let contentType = "text/html";
	if(Object.keys(extensionsMIME).includes(extension))
		contentType = extensionsMIME[extension];

	// If not requesting a page, just send the file
	if(contentType != "text/html") {
		res.statusCode = 200;
		res.setHeader("Content-Type", contentType);
		const data = fs.readFileSync("./" + req.url);
		res.write(data);
		res.end();
		return;
	}

	// Get url GET parameters
	let urlparams = new URLSearchParams(req.url.replace(/^\//, ""));
	const query = urlparams.get("q");
	const page = urlparams.get("p") || "0";

	// Set HTTP header
	res.statusCode = 200;
	res.setHeader("Content-Type", "text/html");

	// Generate the page
	let picDOM = "";
	for(let i = 0; i < 9; i++)
		picDOM += genPic(i);
	let data = pageTemplate.replace("<!--PICS-->", picDOM);
	res.write(data);

	res.end();
});

// Prepare metadata
parseMetadata();

// Run the server
server.listen("8000", "0.0.0.0", () => {
	console.log("Server running...");
});
