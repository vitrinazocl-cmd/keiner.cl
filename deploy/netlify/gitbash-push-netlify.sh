#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash deploy/netlify/gitbash-push-netlify.sh
#   bash deploy/netlify/gitbash-push-netlify.sh <repo_url> <commit_message> <branch>

REPO_URL="${1:-https://github.com/vitrinazocl-cmd/keiner.cl.git}"
COMMIT_MSG="${2:-chore: publish site for netlify}"
BRANCH="${3:-main}"

printf "\n==> Preparing git repository\n"
if [ ! -d .git ]; then
  git init
fi

printf "\n==> Staging files\n"
git add -A

if git diff --cached --quiet; then
  printf "No staged changes. Nothing to commit.\n"
else
  printf "\n==> Creating commit\n"
  git commit -m "$COMMIT_MSG"
fi

printf "\n==> Configuring branch and remote\n"
git branch -M "$BRANCH"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

printf "\n==> Pushing to GitHub\n"
git push -u origin "$BRANCH"

cat <<EOF

Done.

Next steps in Netlify:
1) Open https://app.netlify.com/
2) Add new site -> Import an existing project
3) Choose GitHub and select vitrinazocl-cmd/keiner.cl (or your fork)
4) Build command: (leave empty for static site)
5) Publish directory: .
6) Deploy site

EOF
