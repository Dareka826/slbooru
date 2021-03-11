# Slbooru

The directory structure should be as follows:
```
/server.js
/src/index.html
/src/script.js
/src/style.css
/img/<images>
/metadata/<json metadata>
```

Metadata file format (see example.json):
```json
{
	"file": "<file from /img/>",
	"tags": [ "<the tags for the image>" ]
}
```

To prepare the environment for building: `npm install`
To build the server and site script run `./scripts/build.sh`
To add a new image run `./scripts/add_img_to_db.sh`
