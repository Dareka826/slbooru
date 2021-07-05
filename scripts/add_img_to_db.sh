#!/usr/bin/env bash

mkdir -p metadata img
TMPD=$(mktemp -d)

# Every argument is an item
for item in "$@"; do
	# Calculate the item's checksum and get it's extension
	#CHKSUM=$(sha256sum "$item" | cut -d' ' -f1)
	CHKSUM=$(identify -format "%#" "$item")
	EXTENSION=$(echo "$item" | grep -Po "\.[^.]+$")
	EXT_LC=$(echo "$EXTENSION" | tr "[:upper:]" "[:lower:]")

	if [ "$EXT_LC" = ".mkv" ]; then
		NEW_EXT=".mp4"
		if ffprobe 2>&1 | grep Stream | grep Video | grep vp ; then
			NEW_EXT=".webm"
		fi
		ffmpeg -i "$item" -c copy "$TMPD/$(basename "$item")${NEW_EXT}"
		item="$TMPD/$(basename "${item}${NEW_EXT}")"
		#CHKSUM=$(sha256sum "$item" | cut -d' ' -f1)
		CHKSUM=$(identify -format "%#" "$item")
		EXTENSION=$NEW_EXT
		EXT_LC=$EXTENSION
	fi
	if [ "$EXT_LC" = ".jpeg" ]; then
		cp "$item" "$TMPD/$(basename "$item").jpg"
		item="$TMPD/$(basename "$item").jpg"
		EXTENSION=".jpg"
		EXT_LC=$EXTENSION
	fi

	# Check if same checksum exists in img/
	if [ -e "metadata/${CHKSUM}${EXT_LC}" ]; then
		echo "$item already exists in the db"
	else
		# If not, copy the file into img/
		cp "$item" "img/${CHKSUM}${EXT_LC}"
		# Get the biggest exisitng id from metadata files
		BIGGEST_ID=$(ls -1 metadata | sed 's/\.json//' | sort -r -n | head -1)
		[ "$BIGGEST_ID" = "" ] && BIGGEST_ID=-1
		# Create metadata file with empty tags
		echo "{ \"file\": \"${CHKSUM}${EXT_LC}\", \"tags\": [] }" \
			| jq > "metadata/$((BIGGEST_ID + 1)).json"
		echo "Created metadata/$((BIGGEST_ID + 1)).json with empty tags"
	fi
done

rm -rf $TMPD

