#!/bin/bash
# Warn before pushing to protected branches

BRANCH=`git rev-parse --abbrev-ref HEAD`
PROTECTED_BRANCHES="^(main|develop)$"

if [[ "$BRANCH" =~ $PROTECTED_BRANCHES ]]; then
  read -p "Are you sure you want to push to \"$BRANCH\" ? (y/n): " -n 1 -r < /dev/tty
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    exit 0
  fi
  echo "Push aborted."
  exit 1
fi
exit 0
