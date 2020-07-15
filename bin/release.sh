#!/bin/bash

# Exit if any command fails
set -e

# Obtain the project root folder
ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && dirname "$( pwd )" )"
# Compose path to the release folder
RELEASE="$ROOT/release"
# Compose path to the root plugin folder
PLUGIN="$RELEASE/google-site-kit"

# Get the current version
VERSION="$( grep -oP "(?<=Version:)\s+[0-9\.]+" google-site-kit.php | sed "s/ *//g" )"
# Get the current branch name
BRANCH="$( git branch --show-current | sed "s/[^a-zA-Z0-9\-_]/-/g" )"
# Get the current abbreviated hash
HASH="$( git rev-parse --short HEAD )"
# Compose filename for the archive
ZIP="$ROOT/google-site-kit.v$VERSION.$BRANCH@$HASH.zip"

# Remove existing release folder
rm -rf $RELEASE
# Recreate release folder
mkdir -p $PLUGIN

# Copy plugin files
cp    "$ROOT/readme.txt"          "$PLUGIN/readme.txt"
cp    "$ROOT/google-site-kit.php" "$PLUGIN/google-site-kit.php"
cp -r "$ROOT/dist"                "$PLUGIN/dist"
cp -r "$ROOT/includes"            "$PLUGIN/includes"
cp -r "$ROOT/third-party"         "$PLUGIN/third-party"

# Remove not needed files
rm -f "$PLUGIN/dist/admin.js"
rm -f "$PLUGIN/dist/adminbar.js"
rm -f "$PLUGIN/dist/wpdashboard.js"

# Remove existing archive
rm -f $ZIP
# Go to the release folder
cd $RELEASE
# Create archive
zip -q -r $ZIP .

# Clean up the release folder
rm -rf $RELEASE

# Display ZIP filename
echo $ZIP
