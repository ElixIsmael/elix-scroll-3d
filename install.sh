#!/usr/bin/env bash
#
# Installs the elix-scroll-3d skill for Claude Code.
#
#   ./install.sh           install into ~/.claude (all projects)
#   ./install.sh --here    install into ./.claude (this project only)
#   ./install.sh --copy    copy instead of symlinking (freezes the version)
#   ./install.sh --remove  undo (only removes what this repo installed)
#
# Symlink by default, not a copy: a "git pull" here takes effect immediately,
# with no reinstall. Use --copy to freeze the version instead.
#
# Idempotent. Safe to run again at any time.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HOME/.claude"
COPY=0
REMOVE=0
FORCE=0

for arg in "$@"; do
  case "$arg" in
    --here)   TARGET="$PWD/.claude" ;;
    --copy)   COPY=1 ;;
    --remove) REMOVE=1 ;;
    --force)  FORCE=1 ;;
    -h|--help) sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

SKILL="$TARGET/skills/elix-scroll-3d"

if (( REMOVE )); then
  echo "==> removing from $TARGET"
  if [[ -e "$SKILL" || -L "$SKILL" ]]; then
    # Only remove what came from THIS repository. A symlink of the same name
    # pointing elsewhere belongs to another installation and is not ours to
    # delete. A copy cannot be traced, so it requires --force.
    if [[ -L "$SKILL" ]]; then
      link_target="$(readlink "$SKILL")"
      if [[ "$link_target" == "$ROOT"/* ]]; then
        rm -f "$SKILL"
        echo "    removed elix-scroll-3d"
      else
        echo "    SKIPPED elix-scroll-3d -> $link_target" >&2
        echo "            (does not point at this repository; remove by hand if you want)" >&2
      fi
    elif (( FORCE )); then
      rm -rf "$SKILL"
      echo "    removed elix-scroll-3d"
    else
      echo "    SKIPPED elix-scroll-3d, it is a copy and not a symlink" >&2
      echo "            use --remove --force to delete it anyway" >&2
    fi
  else
    echo "    nothing installed"
  fi
  echo "==> done"
  exit 0
fi

mkdir -p "$TARGET/skills"

rm -rf "$SKILL"
if (( COPY )); then
  cp -r "$ROOT/skills/elix-scroll-3d" "$SKILL"
  echo "==> copied into $TARGET"
else
  # -n so an existing directory symlink is not followed, which would create
  # the link INSIDE it.
  ln -sfn "$ROOT/skills/elix-scroll-3d" "$SKILL"
  echo "==> linked into $TARGET"
fi
echo "    elix-scroll-3d"

echo
echo "==> done. Reopen your Claude Code session to load it."
