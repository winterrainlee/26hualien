#!/bin/sh
set -eu

mkdir -p .drafts/inbox .drafts/scratch

cat > .drafts/README.txt <<'EOF'
26hualien local drafts

- inbox/: 발행 후보 초안
- scratch/: 아직 정리하지 않은 메모
- .drafts/ 전체는 Git에서 제외된다.
- 초안 원문은 publish-note/publish-spot 실행 중 수정하거나 삭제하지 않는다.
EOF

printf '%s\n' "Created .drafts/inbox and .drafts/scratch (gitignored)."
