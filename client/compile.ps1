nexe .\index.js --target windows -o .\binaries\windows.exe -r "node_modules/**/*.html" -r "*.js"
nexe .\index.js --target linux -o .\binaries\linux -r "node_modules/**/*.html" -r "*.js"
nexe .\index.js --target mac -o .\binaries\mac -r "node_modules/**/*.html" -r "*.js"