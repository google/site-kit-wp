#!/bin/bash

GIT_REPOSITORY_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/$GITHUB_REPOSITORY.wiki.git"
tmp_dir="/tmp/build/${GIT_REF}"
(
    cd "$tmp_dir" || exit 1
    git init
    git config user.name "$GITHUB_ACTOR"
    git config user.email "$GITHUB_ACTOR@users.noreply.github.com"
    git pull "$GIT_REPOSITORY_URL"
)

mkdir -p "$tmp_dir/${GIT_REF}"
for file in $(find ${GIT_REF} -maxdepth 1 -type f -name '*' -execdir basename '{}' ';'); do
    cp "${GIT_REF}/$file" "$tmp_dir/${GIT_REF}"
done

echo "Publishing build files for ${GIT_REF}"
(
    cd "$tmp_dir" || exit 1
    git add .
    git commit -m "Build and publish ${GIT_REF}"
    git push --set-upstream "$GIT_REPOSITORY_URL" master
)

rm -rf "$tmp_dir"
exit 0