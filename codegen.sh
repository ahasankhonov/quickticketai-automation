#!/usr/bin/env bash
# Opens Playwright codegen browser pointed at the dev environment.
# Usage: bash codegen.sh
# After recording, paste the generated code into the relevant pages/<role>/<page>.page.ts file
# and tell Claude which role/page it belongs to for refactoring.
npx playwright codegen https://dev.quickticketai.com
