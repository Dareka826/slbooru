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

const pageTemplate = fs.readFileSync("index.html");
const picsPerPage = 42;
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

const server = http.createServer((req, res) => {
	let filePath = "." + req.url;
	if(filePath == "./") filePath = "./index.html";
	let extension = filePath.match(/\.[^.]+$/)[0];
	let contentType = "text/html";

	// Detect content type
	if(Object.keys(extensionsMIME).includes(extension))
		contentType = extensionsMIME[extension];

	if(contentType != "text/html") {
		res.statusCode = 200;
		res.setHeader("Content-Type", contentType);
		const data = fs.readFileSync("./" + req.url);
		res.write(data);
		res.end();
		return;
	}

	let urlparams = new URLSearchParams(req.url.replace(/^\//, ""));
	const query = urlparams.get("q");
	const page = urlparams.get("p");

	res.statusCode = 200;
	res.setHeader("Content-Type", "text/html");

	let data = fs.readFileSync("./index.html", "utf8");
	let picDOM = "";
	for(let i = 0; i < 9; i++)
		picDOM += genPic(i);
	data = data.replace("<!--PICS-->", picDOM);
	res.write(data);

	res.end();
});

// Prepare metadata
parseMetadata();

// Run the server
server.listen("8000", "0.0.0.0", () => {
	console.log("Server running...");
});
