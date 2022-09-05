#!/bin/bash

set -exo pipefail

steps=(
  'step-2'
  'step-3'
  'step-4'
  'step-5.1'
  'step-5.2'
  'step-6'
)

steptitles=(
  'Step 2: Preliminaries'
  'Step 3: First steps'
  'Step 4: Multiple awaits'
  'Step 5.1: Simple error handling'
  'Step 5.2: Make try–catch–finally work'
  'Step 6: Final touches'
)

if [[ $(basename $PWD) == async-await || ! -d async-await ]]
then
  echo 'You must be in learning-promises/ for this script to work' >&2
  exit 1
fi

tmpdir=$(mktemp -d)

for step in "${steps[@]}"
do
  cp -r async-await/"$step" "$tmpdir"
done

saved_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ $saved_branch = HEAD ]]
then
  saved_ref=$(git rev-parse HEAD)
fi

cleanup() {
  if [[ $saved_branch = HEAD ]]
  then
    git switch --detach $saved_ref
  else
    git switch $saved_branch
  fi
}

trap cleanup EXIT

git branch -D async-await-diffs || true
git switch --orphan async-await-diffs
cat <<EOF >.gitignore
.DS_Store
node_modules
EOF
git add .gitignore
git commit -m 'Initial commit'

tags=()

for i in "${!steps[@]}"
do
  step="${steps[$i]}"
  title="${steptitles[$i]}"

  rm -rf async-await
  cp -r "$tmpdir/$step" async-await
  git add -A .
  git commit -m "$title"

  tag_name=async-await-tag/"$step"
  git tag -f $tag_name

  tags+=($tag_name)
done

git push -f origin "${tags[@]}"
