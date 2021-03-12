import * as http from "http"; // For server
import * as fs   from "fs";   // For reading files

// The content type in header for files
const extensionsMIME:Record<string, string> = {
	".js"  :  "text/javascript",
	".css" :  "text/css",
	".jpg" : "image/jpeg",
	".jpeg": "image/jpeg",
	".png" : "image/png",
	".mp4" : "video/mp4",
	".webm": "video/webm"
};
// Which extensions are to be in video tags, instead of img
const videoTypes = [ ".mp4", ".webm" ];

// Create an interface for the format of metadata files
interface MetadataFile {
	file: string;
	tags: Array<string>;
}

// Load index.html data at server start;
const pageTemplate = fs.readFileSync("src/index.html", "utf8");
const picsPerPage = 24; // How many pictures to display on a page
const metadata:Array<MetadataFile> = []; // All images' metadata

// Generate the page based on the GET parameters
function genPage(urlparams:URLSearchParams):string {
	let data = pageTemplate;
	const query = urlparams.get("q") || "";
	const page_variant = urlparams.get("m") || "p";

	if(page_variant == "p") {
		// Posts view
		const page_id = Number(urlparams.get("p") || "0");

		const candidates:Array<number> = matchImagesToQuery(query);
		candidates.sort((a, b) => a > b ? -1 : a == b ? 0 : 1); // Reverse sort

		// No results for query
		if(candidates.length == 0) {
			const picDOM = '<div class="info-notfound">No results</div>';
			return data.replace("<!--TAGS-->", picDOM);
		}

		// Decide which results to show based on page id
		const lowerID = page_id * picsPerPage;
		const higherID = (page_id + 1) * picsPerPage - 1;

		if(lowerID > candidates.length) {
			// Page number out of range
			const picDOM = '<div class="info-notfound">Page index out of range!</div>';
			return data.replace("<!--PICS-->", picDOM);
		}

		let picDOM = "";
		for(let id = lowerID; id <= higherID && id < candidates.length; id++)
			// Iterate over ids on page
			picDOM += genPic(candidates[id], "small", query);

		const tagDOM = genTags(candidates, query);
		const navbarDOM = navbarGen(
			page_id, Math.ceil(candidates.length/picsPerPage), query
		);

		data = data.replace("<!--PICS-->", picDOM);
		data = data.replace("<!--TAGS-->", tagDOM);
		data = data.replace("<!--NAVBAR-->", navbarDOM);
	} else if(page_variant == "i") {
		// Single image view
		const image_id = Number(urlparams.get("i") || "0");

		// Create the picture element
		let picDOM = genPic(image_id, "large", query);
		// Add a link to get the image directly
		picDOM += `<div class="orig-img-cnt"><a ` +
			`href="img/${metadata[image_id].file}">Original Image</a></div>`;

		// Generate the tag view
		const tagDOM = genTagsSingleImage(image_id);

		// Change flexbox direction
		data = data.replace(
			'<div id="main-view">',
			'<div id="main-view" class="main-view-single-image">'
		);

		// Insert the generated data
		data = data.replace("<!--PICS-->", picDOM);
		data = data.replace("<!--TAGS-->", tagDOM);
	}

	return data;
}

// Get all qualified images matched by query
function matchImagesToQuery(query:string):Array<number> {
	const qualified:Array<number> = [];
	const rules = query.split(" ");

	// Initialize with all
	for(let i = 0; i < metadata.length; i++)
		qualified.push(i);

	// For every rule in query
	for(const rule of rules) {
		if(rule[0] == '-') {
			// Exclude tag
			const tag = rule.substr(1, rule.length);

			// Remove ids that have the tag
			for(let i = qualified.length-1; i >= 0; i--)
				if(metadata[qualified[i]].tags.includes(tag))
					qualified.splice(i, 1);
		} else if(rule != "") {
			// Match tag
			const tag = rule;
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
	const tags:Record<string, number> = {};

	// Get the tags already in use
	const tags_in_query = [];
	for(const rule of query.split(" ")) {
		if(rule[0] == "-")
			tags_in_query.push(rule.substr(1,query.length));
		else if(rule != "")
			tags_in_query.push(rule);
	}

	// Get and count the tags from pictures selected by query
	for(const id of candidates) {
		for(const tag of metadata[id].tags) {
			if(Object.keys(tags).includes(tag)) tags[tag] += 1;
			else                                tags[tag]  = 1;
		}
	}

	// Generate tags excluding those in use
	for(const tag of Object.keys(tags).sort())
		if(!tags_in_query.includes(tag))
			tagDOM += createTagElem(tag, tags[tag], true);

	return tagDOM;
}

// Create tag elements
function genTagsSingleImage(image_id:number):string {
	let tagDOM = "";
	const tags = metadata[image_id].tags.sort();

	// For every tag of the image
	for(const tag of tags) {
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
	let tagDOM = '<div class="tagitem">';

	// Add + - options
	if(functional_opts) {
		tagDOM += `<a href="javascript:;" ` +
			`onclick="changeQuery('${tag}', 'add')">+</a>&nbsp;`;
		tagDOM += `<a href="javascript:;" ` +
			`onclick="changeQuery('${tag}', 'exclude')">-</a>&nbsp;`;
	}

	tagDOM += `<a href="/?q=${tag}">${tag}</a>&nbsp;` +
		`<span class="count">${count}</span></div>`;

	return tagDOM;
}

// Create picture's DOM
type ImageVariant = "small" | "large";
function genPic(id:number, variant:ImageVariant, query=""):string {
	const params = new URLSearchParams();
	params.set("m", "i");
	params.set("i", id.toString());
	params.set("q", query);

	const file_url = "/img/" + metadata[id].file;
	const file_extension = /\.[^.]+$/.exec(file_url)[0];
	let _divclass = "", _url = "", _imgclass = "", _video_opts = "";

	if(variant == "small") {
		_divclass = "image-small-container";
		_url = "/?" + params.toString();
		_imgclass = "image-small";
		_video_opts = "muted";
	} else {
		_divclass = "image-big-container";
		_url = file_url;
		_imgclass = "image-large";
		_video_opts = "controls";
	}

	let e = "";
	e += `<div class="${ _divclass }"><a href="${ _url }">`;
	if(videoTypes.includes(file_extension))
		e += `<video ${_video_opts} src="${ file_url }" class="${ _imgclass }"/>`;
	else e += `<img src="${ file_url }" class="${ _imgclass }"/>`;
	e += `</a></div>`;

	return e;
}

// Generate navigation bar
function navbarGen(page_id:number, total_pages:number, query:string) {
	let btn_prev_disable = `class="nav-button"`,
		btn_prev_href = `/?q=${query}&p=${page_id-1}`,
		btn_next_disable = `class="nav-button"`,
		btn_next_href = `/?q=${query}&p=${page_id+1}`;

	if(page_id == 0) {
		btn_prev_disable = 'disabled="true" class="nav-button button-disabled"';
		btn_prev_href = "";
	}
	if(page_id+1 == total_pages) {
		btn_next_disable = 'disabled="true" class="nav-button button-disabled"';
		btn_next_href = "";
	}

	const e = `<div id="pages-nav">` +
		`<a href="${btn_prev_href}">` +
		`<button id="prev-page-btn" ${btn_prev_disable}>&lt;</button></a>` +
		`<div id="page-indicator">${page_id+1}/${total_pages}</div>` +
		`<a href="${btn_next_href}">` +
		`<button id="next-page-btn"${btn_next_disable}>&gt;</button></a>` +
		`</div>`;

	return e;
}

// Reads the metadata json files and puts them into the metadata variable
function pullInMetadata() {
	const number_regex = new RegExp(/[0-9]+/);
	const metadataFiles = fs.readdirSync("metadata").sort((a:string, b:string) => {
		const id1 = Number(number_regex.exec(a)[0]);
		const id2 = Number(number_regex.exec(b)[0]);

		if(id1 < id2) return -1;
		if(id1 > id2) return  1;
		return 0;
	});
	let x = 0;
	for(const mdf of metadataFiles) {
		const data = fs.readFileSync("metadata/" + mdf, "utf8");
		metadata[x++] = JSON.parse(data) as MetadataFile;
	}
}

// The server
const server = http.createServer((req, res) => {
	// Requested file path
	const filePath = "." + req.url;
	const extension = /\.[^.]+$/.exec(filePath)[0];

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
	const urlparams = new URLSearchParams(req.url.replace(/^\//, ""));

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
