#!/usr/bin/env bash
# Cập nhật phiên bản CSS/JS, commit và push lên GitHub → Vercel tự deploy lại.
#   ./deploy.sh "Mô tả thay đổi"
set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-Cập nhật thiệp}"
export GIT_AUTHOR_NAME=xinal88 GIT_AUTHOR_EMAIL=quy.bui@ntq-solution.com.vn
export GIT_COMMITTER_NAME=xinal88 GIT_COMMITTER_EMAIL=quy.bui@ntq-solution.com.vn
# Bỏ SSH mặc định của Coder, dùng deploy key của repo này
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/grad_invitation_deploy -o IdentitiesOnly=yes"

python3 tools/bump_version.py
git add -A
if git diff --cached --quiet; then
  echo "Không có thay đổi nào để deploy."
  exit 0
fi
git commit -q -m "$MSG"
git push -q origin main
echo "Đã push: $(git log --oneline -1)"
echo "Vercel sẽ tự deploy lại sau ~30 giây."
