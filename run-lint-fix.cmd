@echo off
echo Executando lint com npx...
npx eslint . --fix > lint-output.txt 2>&1
echo Resultado do lint salvo em lint-output.txt
echo.
echo Executando type-check com npx...
npx tsc --noEmit --incremental false > type-check-output.txt 2>&1
echo Resultado do type-check salvo em type-check-output.txt
echo.
echo Verificando build...
call npm run build > build-output.txt 2>&1
echo Resultado do build salvo em build-output.txt
echo.
echo Analise concluida!
pause 