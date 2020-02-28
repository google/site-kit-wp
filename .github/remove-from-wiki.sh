#!/bin/bash

GIT_REPOSITORY_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/$GITHUB_REPOSITORY.wiki.git"

echo "Checking out wiki repository"
tmp_dir="/tmp/build/${GIT_REF}"
(
    cd "$tmp_dir" || exit 1
    git clone "$GIT_REPOSITORY_URL"
    git config user.name "$GITHUB_ACTOR"
    git config user.email "$GITHUB_ACTOR@users.noreply.github.com"
)

rm -Rf "$tmp_dir/${GIT_REF}"

echo "Removing build files from ${GIT_REF}"
(
    cd "$tmp_dir" || exit 1
    git commit -m "$WIKI_COMMIT_MESSAGE"
    git push --set-upstream "$GIT_REPOSITORY_URL" master
)

rm -rf "$tmp_dir"
exit 0