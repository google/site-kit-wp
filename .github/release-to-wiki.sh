#!/bin/bash

GIT_REPOSITORY_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/$GITHUB_REPOSITORY.wiki.git"
tmp_dir="/tmp/build/${GIT_REF}"
mkdir -p "$tmp_dir"
(
    cd "$tmp_dir" || exit 1
    git clone --depth 1 "$GIT_REPOSITORY_URL" .
    git config user.name "$GITHUB_ACTOR"
    git config user.email "$GITHUB_ACTOR@users.noreply.github.com"
)

mkdir -p "$tmp_dir/${GIT_REF}"
ls "${GIT_REF}"
cp "${GIT_REF}/"* "$tmp_dir/${GIT_REF}"

echo "Publishing build files for ${GIT_REF}"
(
    cd "$tmp_dir" || exit 1
    git add .
    git commit -m "Build and publish ${GIT_REF}"
    git push --set-upstream "$GIT_REPOSITORY_URL" master
)

rm -rf "$tmp_dir"
exit 0
