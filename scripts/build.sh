#!/bin/sh

rm src/script.js server.js

tsc --outFile src/script.js src/script.ts && \
tsc server.ts && \
node server.js
