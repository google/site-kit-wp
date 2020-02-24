#!/bin/bash

GIT_REPOSITORY_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/$GITHUB_REPOSITORY.wiki.git"

echo "Checking out wiki repository"
tmp_dir=$(mktemp -d -t ci-XXXXXXXXXX)
(
    cd "$tmp_dir" || exit 1
    git init
    git config user.name "$GITHUB_ACTOR"
    git config user.email "$GITHUB_ACTOR@users.noreply.github.com"
    git pull "$GIT_REPOSITORY_URL"
)

rm -Rf "$tmp_dir/$1"

echo "Removing build files from $1"
(
    cd "$tmp_dir" || exit 1
    git commit -m "$WIKI_COMMIT_MESSAGE"
    git push --set-upstream "$GIT_REPOSITORY_URL" master
)

rm -rf "$tmp_dir"
exit 0