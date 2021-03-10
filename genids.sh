#!/usr/bin/env bash

ID=1
for x in *; do
	echo "{\"file\":\"$x\"}" > "../metadata/$ID.json"
	((ID++))
done
