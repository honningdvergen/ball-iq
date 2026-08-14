#!/usr/bin/env bash
# Set the APNs signing key as a Supabase secret, from the file on disk.
#
# WHY THIS EXISTS. On 2026-08-14 push was found dead across all 31 registered
# devices. Three stacked faults, and the last one was that APNS_KEY_P8 held 28
# characters — roughly a filename, not a 257-character private key. Somebody had
# pasted the wrong thing into a dashboard field months earlier and nothing ever
# checked. Alongside it, all five APNs secrets carried trailing newlines from the
# same paste-into-a-textarea flow.
#
# Hand-pasting secrets is the root cause, so this removes the hand. The key goes
# FILE -> CLI -> project by shell substitution. It is never printed, never put on
# a clipboard, and never passes through a chat window.
#
# It VALIDATES before sending, because a silently-wrong secret is exactly the
# failure that cost weeks: length, the BEGIN/END markers, and that the Key ID in
# the filename matches the APNS_KEY_ID the sender expects.
#
#   ./scripts/set-apns-key.sh                       # uses the default key path
#   ./scripts/set-apns-key.sh /path/to/AuthKey_X.p8
set -euo pipefail

PROJECT_REF="blcisypmngimqkwxrrdm"
EXPECTED_KEY_ID="83D74N8R2J"   # must match APNS_KEY_ID; send-push signs with it
DEFAULT_KEY="$HOME/.balliq/keys/AuthKey_${EXPECTED_KEY_ID}.p8"

KEY_FILE="${1:-$DEFAULT_KEY}"

if [ ! -f "$KEY_FILE" ]; then
  echo "❌ No key file at: $KEY_FILE"
  echo "   Apple lets you download a .p8 ONCE. If it is gone, make a new one at"
  echo "   developer.apple.com → Certificates, Identifiers & Profiles → Keys,"
  echo "   and remember the new Key ID must also replace APNS_KEY_ID."
  exit 1
fi

# ── Validate before sending. A wrong secret fails silently, weeks later. ──
CHARS=$(wc -c < "$KEY_FILE" | tr -d ' ')
FILE_KEY_ID=$(basename "$KEY_FILE" | sed 's/AuthKey_//; s/\.p8//')

grep -q "BEGIN PRIVATE KEY" "$KEY_FILE" || { echo "❌ no BEGIN PRIVATE KEY line — is this really a .p8?"; exit 1; }
grep -q "END PRIVATE KEY"   "$KEY_FILE" || { echo "❌ no END PRIVATE KEY line — file looks truncated"; exit 1; }
[ "$CHARS" -gt 200 ] || { echo "❌ only $CHARS chars; a real .p8 is ~230-260. THIS IS THE BUG THAT BIT US."; exit 1; }

echo "Key file : $(basename "$KEY_FILE")"
echo "Size     : $CHARS chars ✓"
echo "Key ID   : $FILE_KEY_ID"
if [ "$FILE_KEY_ID" != "$EXPECTED_KEY_ID" ]; then
  echo "⚠️  This is NOT $EXPECTED_KEY_ID, which is what APNS_KEY_ID is set to."
  echo "   Setting it would sign tokens with a kid Apple cannot match (403)."
  echo "   Change APNS_KEY_ID too, or use the other key."
  read -r -p "   Continue anyway? [y/N] " ok
  [ "$ok" = "y" ] || exit 1
fi

# --project-ref avoids needing a linked local project. The $(cat) substitution
# is what keeps the key out of the clipboard, the scrollback and the transcript.
echo
echo "Setting APNS_KEY_P8 on $PROJECT_REF…"
supabase secrets set "APNS_KEY_P8=$(cat "$KEY_FILE")" --project-ref "$PROJECT_REF"

# Re-set the four companions WITHOUT newlines. send-push now trims them anyway,
# but a clean stored value means the next person to read the dashboard is not
# misled — and the digest becomes meaningful again.
supabase secrets set \
  "APNS_KEY_ID=$EXPECTED_KEY_ID" \
  "APNS_TEAM_ID=A99W5L256P" \
  "APNS_BUNDLE_ID=app.balliq" \
  "APNS_HOST=api.push.apple.com" \
  --project-ref "$PROJECT_REF"

echo
echo "✅ Done. Verify it actually works — a green run here proves nothing:"
echo "   ask Claude to re-run the APNs probe, which sends a real push and"
echo "   reports Apple's verbatim status."
