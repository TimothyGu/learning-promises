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

if [[ $(basename $PWD) == async-await || ! -d async-await ]]
then
  echo 'You must be in learning-promises/ for this script to work' >&2
  exit 1
fi

node async-await/step-1/generator-func.js
for step in "${steps[@]}"
do
  node "async-await/$step/async-await.js"
done
