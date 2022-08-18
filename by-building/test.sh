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

if [[ $(basename $PWD) == by-building || ! -d by-building ]]
then
  echo 'You must be in learning-promises/ for this script to work' >&2
  exit 1
fi

for step in "${steps[@]}"
do
  node "by-building/$step/promises.js"
done
