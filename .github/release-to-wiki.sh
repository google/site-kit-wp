#!/bin/bash

GIT_REPOSITORY_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/$GITHUB_REPOSITORY.wiki.git"

tmp_dir=$(mktemp -d -t ci-XXXXXXXXXX)
(
    cd "$tmp_dir" || exit 1
    git init
    git config user.name "$GITHUB_ACTOR"
    git config user.email "$GITHUB_ACTOR@users.noreply.github.com"
    git pull "$GIT_REPOSITORY_URL"
)

mkdir -p "$tmp_dir/$1"
for file in $(find $1 -maxdepth 1 -type f -name '*' -execdir basename '{}' ';'); do
    cp "$1/$file" "$tmp_dir/$1"
done

echo "Publishing build files for $1"
(
    cd "$tmp_dir" || exit 1
    git add .
    git commit -m "Build and publish $1"
    git push --set-upstream "$GIT_REPOSITORY_URL" master
)

rm -rf "$tmp_dir"
exit 0