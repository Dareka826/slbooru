#!/usr/bin/env bash

mkdir -p metadata img

# Every argument is an item
for item in "$@"; do
	# Calculate the item's checksum and get it's extension
	CHKSUM=$(sha256sum "$item" | cut -d' ' -f1)
	EXTENSION=$(echo "$item" | grep -Po "\.[^.]+$")

	# Check if same checksum exists in img/
	if [ -e "metadata/${CHKSUM}.${EXTENSION}" ]; then
		echo "$item already exists in the db"
	else
		# If not, copy the file into img/
		cp "$item" "img/${CHKSUM}.${EXTENSION}"
		# Get the biggest exisitng id from metadata files
		BIGGEST_ID=$(ls -1 metadata | sed 's/\.json//' | sort -r -n | head -1)
		[ "$BIGGEST_ID" = "" ] && BIGGEST_ID=-1
		# Create metadata file with empty tags
		echo "{ \"file\": \"${CHKSUM}.${EXTENSION}\", \"tags\": [] }" \
			| jq > "metadata/$((BIGGEST_ID + 1)).json"
		echo "Created metadata/$((BIGGEST_ID + 1)).json with empty tags"
	fi
done
