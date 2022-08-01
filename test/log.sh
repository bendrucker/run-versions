#!/usr/bin/env sh

get_version='JSON.stringify({version: require("has-require/package.json").version})'
node -p "$get_version" >> ./log
printf '\n' >> ./log
