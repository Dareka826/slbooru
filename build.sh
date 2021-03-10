#!/bin/sh

rm script.js server.js

tsc script.ts && \
tsc server.ts && \
node server.js
