const http = require("http"); // For server
const fs   = require("fs");   // For reading files
const url  = require("url");  // For parsing url get requests

// The content type in header for files
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

// Load index.html data at server start;
const pageTemplate:string = fs.readFileSync("index.html", "utf8");
const picsPerPage = 42;
const metadata = []; // All images' metadata is stored here (probably bad)

// Generate the page based on the GET parameters
function genPage(urlparams:URLSearchParams):string {
	let data = pageTemplate;
	let page_variant = urlparams.get("m") || "p";

	if(page_variant == "p") {
		// Posts view
		const query = urlparams.get("q") || "";
		const page_id = Number(urlparams.get("p") || "0");

		let candidates:Array<number> = matchImagesToQuery(query);

		// No results for query
		if(candidates.length == 0) {
			let picDOM = '<div class="info-notfound">No results</div>';
			return data.replace("<!--TAGS-->", picDOM);
		}

		// Decide which results to show based on page id
		const lowerID = page_id * picsPerPage;
		const higherID = (page_id + 1) * picsPerPage - 1;

		if(lowerID > candidates.length) {
			// Page number out of range
			let picDOM = '<div class="info-notfound">Page index out of range!</div>';
			return data.replace("<!--TAGS-->", picDOM);
		}

		let picDOM = "";
		for(let id = lowerID; id <= higherID && id < candidates.length; id++)
			// Iterate over ids on page
			picDOM += genPic(candidates[id], "small");

		let tagDOM = genTags(candidates, query);

		data = data.replace("<!--PICS-->", picDOM);
		data = data.replace("<!--TAGS-->", tagDOM);
	} else if(page_variant == "i") {
		// Single image view
		const image_id = Number(urlparams.get("i") || "0");

		// Create the picture element
		let picDOM = genPic(image_id, "large");
		// Add a link to get the image directly
		picDOM += '<div style="padding-left: 5px;"><a href="img/';
		picDOM += metadata[image_id].file + '">Original Image</a></div>';

		// Generate the tag view
		let tagDOM = genTagsSingleImage(image_id);

		// Insert the generated data
		data = data.replace("<!--PICS-->", picDOM);
		data = data.replace("<!--TAGS-->", tagDOM);
	}

	return data;
}

// Get all qualified images matched by query
function matchImagesToQuery(query:string):Array<number> {
	let qualified:Array<number> = [];
	let rules = query.split(" ");

	// Initialize with all
	for(let i = 0; i < metadata.length; i++)
		qualified.push(i);

	for(let rule of rules) {
		if(rule[0] == '-') {
			// Exclude tag
			let tag = rule.substr(1, rule.length);

			// Remove ids that have the tag
			for(let i = qualified.length-1; i >= 0; i--)
				if(metadata[qualified[i]].tags.includes(tag))
					qualified.splice(i, 1);
		} else if(rule != "") {
			// Match tag
			let tag = rule;
			// Remove ids that don't have the tag
			for(let i = qualified.length-1; i >= 0; i--)
				if(!metadata[qualified[i]].tags.includes(tag))
					qualified.splice(i, 1);
		}
	}

	return qualified;
}

// Create tag elements from candidates
function genTags(candidates:Array<number>, query:string):string {
	let tagDOM = "";
	let tags:Object = {};

	let tags_in_query = [];
	for(let rule of query.split(" "))
		if(rule[0] == "-")
			tags_in_query.push(rule.substr(1,query.length));
		else if(rule != "")
			tags_in_query.push(rule);

	for(let id of candidates)
		for(let tag of metadata[id].tags) {
			if(Object.keys(tags).includes(tag)) tags[tag] += 1;
			else                                tags[tag]  = 1;
		}

	for(let tag of Object.keys(tags))
		if(!tags_in_query.includes(tag))
			tagDOM += createTagElem(tag, tags[tag], true);

	return tagDOM;
}

// Create tag elements
function genTagsSingleImage(image_id:number):string {
	let tagDOM = "";
	let tags = metadata[image_id].tags;

	// For every tag of the image
	for(let tag of tags) {
		// Count the number of occurences of the tag
		let tagCount = 0;
		for(let i = 0; i < metadata.length; i++)
			if(metadata[i].tags.includes(tag))
				tagCount++;

		// Append the created tag element to the tag sidebar
		tagDOM += createTagElem(tag, tagCount, false);
	}
	return tagDOM;
}

// Create tag element's DOM
function createTagElem(tag:string, count:number, functional_opts:boolean) {
	let tagDOM = '<div class="tagitem">'

	if(functional_opts) {
		tagDOM += '<a href="javascript:;" onclick="changeQuery(';
		tagDOM += "'" + tag + "', 'add')\">+</a>&nbsp;";
		tagDOM += '<a href="javascript:;" onclick="changeQuery(';
		tagDOM += "'" + tag + "', 'exclude')\">-</a>&nbsp;";
	}

	tagDOM += '<a href="javascript:;" onclick="changeQuery(';
	tagDOM += "'" + tag + "', 'replace'" + ')">' + tag;
	tagDOM += '</a>&nbsp;<span class="count">';
	tagDOM += count;
	tagDOM += '</span></div>';
	return tagDOM;
}

// Create picture's DOM
type ImageVariant = "small" | "large";
function genPic(id:number, variant:ImageVariant):string {
	let e:string = '<div class="';

	e += (variant == "small") ? "image-small-container" : "image-big-container";

	e += '"><img src="';
	e += 'img/' + metadata[id].file;
	e += '" class="';

	e += (variant == "small") ? "image-small" : "image-large";

	e += '" onclick="picSelected(';
	e += "'" + id + "'";
	e += ')"></img></div>';
	return e;
}

// Reads the metadata json files and puts them into the metadata variable
function pullInMetadata() {
	const metadataFiles = fs.readdirSync("metadata");
	metadataFiles.sort();
	let x = 0;
	for(let mdf of metadataFiles) {
		let data = fs.readFileSync("metadata/" + mdf);
		metadata[x++] = JSON.parse(data);
	}
}

// The server
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

	// Set HTTP header
	res.statusCode = 200;
	res.setHeader("Content-Type", "text/html");

	// Generate the page
	res.write(genPage(urlparams));

	res.end();
});

// Prepare metadata
pullInMetadata();

// Run the server
server.listen(8000, '127.0.0.1', () => {
	console.log("Server running...");
});
