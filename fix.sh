#!/bin/bash
echo "=== Running ESLint auto-fix ==="
pnpm next lint --fix || npx eslint . --fix

echo "=== Running Prettier ==="
npx prettier --write .

echo "=== Searching for 'any' types (manual fix required) ==="
grep -r --include \*.ts --include \*.tsx "any" . | grep -v node_modules

echo "=== Searching for unescaped single/double quotes in JSX (manual fix likely needed) ==="
grep -r --include \*.tsx "[\"']" . | grep -v node_modules