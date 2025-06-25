@echo off
echo Executando lint do Notion Spark Studio...
call npm run lint > lint-output.txt 2>&1
echo Resultado do lint salvo em lint-output.txt
echo.
echo Executando type-check...
call npm run type-check > type-check-output.txt 2>&1
echo Resultado do type-check salvo em type-check-output.txt
echo.
echo Analise concluida!
pause 