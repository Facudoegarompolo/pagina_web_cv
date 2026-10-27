#!/bin/zsh
cd "${0:A:h}"
node --env-file-if-exists=.env server.mjs
if [[ $? != 0 ]]; then
  printf '\nNo se pudo iniciar. Revisá el mensaje anterior. Presioná Enter para cerrar.\n'
  read
fi
