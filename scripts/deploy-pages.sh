#!/usr/bin/env bash
# STAGE PLAN → GitHub Pages 배포 스크립트
#   결과 URL: https://mulldduck.github.io/stage-plan/
#   Pages 소스: gh-pages 브랜치 / (root)  ← dist 빌드 산출물만 올린다
#
# 사용:
#   bash scripts/deploy-pages.sh
#   (이 작업 환경에서는 Node가 PATH에 없으므로 먼저 아래를 실행)
#   export PATH="/workspace/.bin/node-v20.18.1-linux-x64/bin:$PATH"
set -euo pipefail
cd "$(dirname "$0")/.."

npm install
npm run build
touch dist/.nojekyll   # Jekyll 처리 방지

tmp="$(mktemp -d)"
cp -r dist/. "$tmp"/
cd "$tmp"
git init -q -b gh-pages
git add -A
git -c user.name="mulldduck" -c user.email="mulldduck@users.noreply.github.com" \
  commit -q -m "deploy: STAGE PLAN build $(date '+%Y-%m-%d %H:%M')"
git remote add origin https://github.com/mulldduck/stage-plan.git
git push -f origin gh-pages

echo "배포 완료 → https://mulldduck.github.io/stage-plan/"
echo "반영까지 1~2분 걸릴 수 있습니다. 확인: curl -sI https://mulldduck.github.io/stage-plan/ | head -1"
