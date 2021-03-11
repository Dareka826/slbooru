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

const pageTemplate:string = fs.readFileSync("index.html", "utf8");
const picsPerPage = 42;
const metadata = [];

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

		data = data.replace("<!--PICS-->", picDOM);
	} else if(page_variant == "i") {
		// Single image view
		const image_id = Number(urlparams.get("i") || "0");

		// Create the picture element
		let picDOM = genPic(image_id, "large");
		// Add a link to get the image directly
		picDOM += '<div style="padding-left: 5px;"><a href="img/';
		picDOM += metadata[image_id].file + '">Original Image</a></div>';
		// Insert the generated data
		data = data.replace("<!--PICS-->", picDOM);
		
		// Generate the tag view
		let tagDOM = genTags("", true, image_id);
		data = data.replace("<!--TAGS-->", tagDOM);
	}

	return data;
}

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

function genTags(query:string, single_image:boolean, image_id:number = -1):string {
	let tagDOM = "";
	if(single_image) {
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
	}
	return tagDOM;
}

function createTagElem(tag:string, count:number, add_exclude_option:boolean) {
	let tagDOM = '<div class="tagitem">'
	tagDOM += '<a href="javascript:;" onclick="changeQuery(';
	tagDOM += "'" + tag + "'" + ', ' + "'replace'" + ')">' + tag;
	tagDOM += '</a>&nbsp;<span class="count">';
	tagDOM += count;
	tagDOM += '</span></div>';
	return tagDOM;
}

type ImageVariant = "small" | "large";
function genPic(id:number, variant:ImageVariant):string {
	let e:string = '<div class="';

	e += (variant == "small") ? "image-small-container" : "image-big-container";

	e += '"><img src="';
	e += 'img/' + metadata[id].file;
	e += '" class="';

	e += (variant == "small") ? "image-small" : "image-large";

	e += '"></img></div>';
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
