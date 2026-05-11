#!/usr/bin/env bash
# סקריפט התקנה אוטומטי לויקטור על שרת Ubuntu (Oracle Cloud / DigitalOcean / Hetzner / וכו')
# שימוש:
#   bash install.sh
#
# הסקריפט:
# 1. מתקין Node.js 20 + git + build tools
# 2. מתקין pm2 גלובלית
# 3. מתקין את התלויות של הפרויקט
# 4. מכין קובץ .env אם לא קיים
# 5. מפעיל את הבוט עם pm2 ומגדיר אתחול אוטומטי בעת אתחול השרת

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}▶ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
err()  { echo -e "${RED}✖ $*${NC}" >&2; }

# נכון לשורש הפרויקט (תיקייה אחת מעל deploy/)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

log "מתחיל התקנה בתיקייה: $PROJECT_DIR"

# 1. עדכון מערכת
log "מעדכן רשימת חבילות..."
sudo apt-get update -y
sudo apt-get install -y curl ca-certificates gnupg git

# 2. Node.js 20 (LTS) — רק אם לא מותקן או גרסה ישנה
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
  if [ "$NODE_MAJOR" -ge 18 ]; then
    log "Node.js כבר מותקן: $(node --version)"
    NEED_NODE=0
  fi
fi
if [ "$NEED_NODE" = "1" ]; then
  log "מתקין Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  log "Node.js הותקן: $(node --version)"
fi

# 3. pm2 גלובלית
if ! command -v pm2 >/dev/null 2>&1; then
  log "מתקין pm2..."
  sudo npm install -g pm2
else
  log "pm2 כבר מותקן: $(pm2 --version)"
fi

# 4. תלויות הפרויקט
log "מתקין תלויות (npm install)..."
npm install --omit=dev || npm install

# 5. קובץ .env
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    warn "נוצר קובץ .env מ-env.example."
    warn "ערוך אותו כעת ומלא את GROQ_API_KEY ו-BOT_ENCRYPTION_KEY:"
    warn "    nano $PROJECT_DIR/.env"
    warn "אחרי שתסיים, הרץ שוב את הסקריפט הזה כדי להפעיל את הבוט."
    exit 0
  else
    err ".env.example לא נמצא — עצור."
    exit 1
  fi
fi

# בדיקה שהמפתח לא ריק
if ! grep -E '^(GROQ_API_KEY|GEMINI_API_KEY)=.+' .env >/dev/null 2>&1; then
  err "ב-.env אין GROQ_API_KEY או GEMINI_API_KEY עם ערך. ערוך עם: nano $PROJECT_DIR/.env"
  exit 1
fi

# 6. תיקיות עבודה ולוגים
mkdir -p logs data auth_info
chmod 700 data auth_info
chmod 600 .env || true

# 7. הפעלה עם pm2
log "מפעיל את הבוט עם pm2..."
pm2 delete victor-bot >/dev/null 2>&1 || true
pm2 start deploy/ecosystem.config.cjs
pm2 save

# 8. אתחול אוטומטי בעת boot
if ! systemctl is-enabled pm2-"$USER" >/dev/null 2>&1; then
  log "מגדיר אתחול אוטומטי של pm2 בעת הפעלה מחדש של השרת..."
  STARTUP_CMD=$(pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1)
  if echo "$STARTUP_CMD" | grep -q "^sudo"; then
    eval "$STARTUP_CMD"
  else
    warn "לא הצלחתי להגדיר אתחול אוטומטי אוטומטית. הרץ ידנית:"
    warn "    pm2 startup"
  fi
  pm2 save
fi

log "✅ הבוט פועל!"
echo ""
echo "    📺 לראות לוגים בזמן אמת (כולל QR לראשונה):"
echo "        pm2 logs victor-bot"
echo ""
echo "    📊 סטטוס:"
echo "        pm2 status"
echo ""
echo "    🔁 הפעלה מחדש:"
echo "        pm2 restart victor-bot"
echo ""
echo "    🛑 עצירה:"
echo "        pm2 stop victor-bot"
echo ""
