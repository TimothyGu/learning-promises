#!/bin/bash

set -exo pipefail

steps=(
  'step-1'
  'step-2'
  'step-3'
  'step-4'
  'step-5'
  'step-6'
  'step-7.1'
  'step-7.2'
  'step-7.3'
  'step-8'
)

steptitles=(
  'Step 1: Promise class'
  'Step 2: Data model'
  'Step 3: Creating a Promise'
  'Step 4: Calling then callbacks'
  'Step 5: Resolving, not fulfilling'
  'Step 6: Chaining then'
  'Step 7.1: Catching exceptions'
  'Step 7.2: Resolving a promise with itself'
  'Step 7.3: Memory leaks'
  'Step 8: Shortcuts'
)

if [[ $(basename $PWD) == by-building || ! -d by-building ]]
then
  echo 'You must be in learning-promises/ for this script to work' >&2
  exit 1
fi

tmpdir=$(mktemp -d)

for step in "${steps[@]}"
do
  cp -r by-building/"$step" "$tmpdir"
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

git branch -D by-building-diffs || true
git switch --orphan by-building-diffs
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

  rm -rf by-building
  cp -r "$tmpdir/$step" by-building
  git add -A .
  git commit -m "$title"

  tag_name=by-building-tag/"$step"
  git tag -f $tag_name

  tags+=($tag_name)
done

git push -f origin "${tags[@]}"
