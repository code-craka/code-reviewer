#!/bin/bash

echo "=== Replacing all 'any' types with 'unknown' (may require manual fix) ==="
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -exec sed -i '' 's/: any/: unknown/g' {} +

echo "=== Escaping unescaped single/double quotes in JSX/TSX (may be too aggressive, review diff) ==="
find . -type f \( -name "*.tsx" -o -name "*.jsx" \) -not -path "*/node_modules/*" -exec perl -pi -e "s/'/&#39;/g; s/\"/&#34;/g;" {} +

echo "=== Replacing 'var' with 'let' (may require manual check) ==="
find . -type f \( -name "*.js" -o -name "*.ts" \) -not -path "*/node_modules/*" -exec sed -i '' 's/\bvar\b/let/g' {} +

echo "=== Commenting out unused variables (as detected by common patterns) ==="
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -exec perl -pi -e "s/^(\s*)(const|let|var) (\w+) = .+\/\/.*unused.*/$1\/\/ $2 $3 = ... \/\/ commented unused/g" {} +

echo "=== Running ESLint auto-fix again ==="
pnpm next lint --fix || npx eslint . --fix

echo "=== Running Prettier again ==="
npx prettier --write .

echo "=== Done! ==="