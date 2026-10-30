#!/bin/sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Installez Node.js LTS depuis https://nodejs.org puis relancez ce fichier."
  printf "Appuyez sur Entrée pour fermer. "
  read -r minuit_reply
  exit 1
fi
node ./demarrer.mjs
