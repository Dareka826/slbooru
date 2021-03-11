#!/bin/sh

for x in *; do
	SHA256SUM="$(sha256sum "$x" | cut -d' ' -f1)"
	EXTENSION="$(echo "$x" | rev | cut -d'.' -f1 | rev | sed 's/jpeg/jpg/')"
	chmod 644 "$x"
	mv "$x" "${SHA256SUM}.${EXTENSION}"
done
