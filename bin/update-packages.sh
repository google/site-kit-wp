#!/usr/bin/env bash
#
# update-packages.sh
#
# Updates packages to the latest major version that requires no code changes,
# given that Node has been bumped to 24 (LTS).
#
# Generated: 2026-05-19
# Based on: candidate-packages-to-update.out
#
# Run from the repository root:
#   bash bin/update-packages.sh
#
# Packages that CANNOT be updated without code changes are documented below
# each section as comments, with the reason they are blocked.
#
set -euo pipefail

cd "$(dirname "$0")/.."

section() {
	echo "==> Updating ${1} packages..."
}

install_package() {
	local package="$1"
	shift
	echo "==> Installing ${package}"
	npm install "$@" "$package"
}

install_workspace() {
	local workspace="$1"
	local package="$2"
	shift 2
	echo "==> Installing ${package} (workspace: ${workspace})"
	npm install "$@" -w "$workspace" "$package"
}

section "root package.json"

# @shopify/jest-dom-mocks: 4 → 5
# API-compatible; only adds new matchers and improves types.
install_package '@shopify/jest-dom-mocks@^5.2.0' --save-dev

# @testing-library/jest-dom: 5 → 6
# Requires jest ≥28; project uses jest 29. ✓
install_package '@testing-library/jest-dom@^6.9.1' --save-dev

# @types/node: 22 → 24
# Aligns type definitions with Node 24 LTS (the new .nvmrc target).
install_package '@types/node@^24.0.0' --save-dev

# @wordpress/browserslist-config: 5 → 6
# Config-only package; only affects which browsers are targeted in the build.
install_package '@wordpress/browserslist-config@^6.46.0' --save-dev

# @wordpress/dom-ready: 2 → 4
# Single-function API (domReady(callback)); signature unchanged across all majors.
install_package '@wordpress/dom-ready@^4.46.0'

# @wordpress/i18n: 3 → 6
# Only __, _x, sprintf, _n, _nx, isRTL, setLocaleData are used; all stable in v6.
install_package '@wordpress/i18n@^6.19.0'

# @wordpress/keycodes: 3 → 4
# Only exported constants are used (ESCAPE, ENTER, SPACE, TAB, HOME, END, UP, DOWN).
install_package '@wordpress/keycodes@^4.46.0'

# @wordpress/url: 3 → 4
# Only addQueryArgs, getQueryArg, getQueryArgs, removeQueryArgs, hasQueryArg,
# isURL, normalizePath are used; all stable in v4.
# install_package '@wordpress/url@^4.46.0'

# archiver: 5 → 8
# bin/release only calls archiver('zip', opts) / .pipe() / .directory() / .finalize().
# Core API is unchanged across all majors.
install_package 'archiver@^8.0.0' --save-dev

# babel-loader: 9 → 10
# Requires webpack v5 (project is on 5.99.7). ✓
install_package 'babel-loader@^10.1.1' --save-dev

# fs-extra: 9 → 11
# v11 only removed long-deprecated helpers not used in this codebase.
install_package 'fs-extra@^11.3.5' --save-dev

# lint-staged: 10 → 17
# The "lint-staged" key in package.json is still the canonical config location in v17.
install_package 'lint-staged@^17.0.5' --save-dev

# stylelint: 16 → 17
# Requires Node 18+ (Node 24 ✓). Config file format is unchanged.
# Note: run `npm run lint:css` after updating to catch any new rule violations.
# install_package 'stylelint@^17.11.1' --save-dev

# # stylelint-config-standard-scss: 12 → 17
# # Requires stylelint v17 (updated above). ✓
# install_package 'stylelint-config-standard-scss@^17.0.0' --save-dev

# # stylelint-order: 6 → 8
# # Requires stylelint v16+ (project has v17 after the update above). ✓
# install_package 'stylelint-order@^8.1.1' --save-dev

# # stylelint-scss: 6 → 7
# # Requires stylelint v16+ (project has v17 after the update above). ✓
# install_package 'stylelint-scss@^7.1.1' --save-dev

# webpack-cli: 6 → 7
# No programmatic usage — CLI only via npm scripts. Works with webpack v5.
install_package 'webpack-cli@^7.0.2' --save-dev

# --------------------------------------------------------------------------
# BLOCKED — root package.json
# --------------------------------------------------------------------------

# @testing-library/react 10 → 16 (BLOCKED: requires React 18)
#   v13+ dropped React 17 support. Unblock by upgrading react/react-dom to v18/v19 first.

# @testing-library/react-hooks 4 → 8 (BLOCKED: requires @testing-library/react v13+)
#   v8 delegates to @testing-library/react internally; that package requires React 18.

# @types/faker 5 → 6 (BLOCKED: API change in faker itself)
#   faker v6 renamed faker.datatype.* and faker.random.* — widespread usage in mocks.
#   Update alongside faker (assets/package.json) as part of a dedicated mock-data migration.

# @typescript-eslint/eslint-plugin 6 → 8 (BLOCKED: requires ESLint v8+)
# @typescript-eslint/parser 6 → 8         (BLOCKED: requires ESLint v8+)
#   Both packages require eslint ≥8.56.0. ESLint is pinned at v7 (see eslint below).

# @wordpress/browserslist-config — also in assets/package.json (handled in that section).

# @wordpress/compose 4/5 → 7 (BLOCKED: compose HOC removed/deprecated)
#   The codebase uses the compose() HOC heavily across ~10 widget files. The HOC was
#   deprecated in v6 and removed in v7; migration to individual hooks is required.

# @wordpress/data 7 → 10 (BLOCKED: active patch in place)
#   patches/@wordpress+data+7.6.0.patch modifies useSelect internals. Upgrading requires
#   verifying the patch still applies or rewriting the patched behaviour.

# @wordpress/element 4 → 6 (BLOCKED: wraps React 18)
#   @wordpress/element v5+ is a thin wrapper around React 18; the project is on React 17.

# @wordpress/eslint-plugin 7 → 25 (BLOCKED: v21+ requires ESLint v9)
#   See eslint below.

# @wordpress/icons 3 → 13 (BLOCKED: icon names changed)
#   Icons used in production (info, closeSmall, check, stack, chevronRight, arrowLeft)
#   may have been renamed across the 10-major jump; audit required.

# @wordpress/prettier-config 2 → 4 (BLOCKED: requires prettier v3)
#   The project uses npm:wp-prettier@2.6.2 (a WordPress fork of Prettier 2). Upgrading
#   requires switching to wp-prettier v3 and co-updating @wordpress/eslint-plugin.

# eslint 7 → 10 (BLOCKED: v9+ requires flat config)
#   ESLint 9 dropped .eslintrc.json support; the project uses .eslintrc.json and
#   .eslintrc.staged.json. Migration to eslint.config.js (flat config) is required.

# eslint-import-resolver-typescript 2 → 4 (BLOCKED: requires ESLint v8+)
# eslint-plugin-jest 22 → 29              (BLOCKED: v28+ requires ESLint v8+)
# eslint-plugin-jsdoc 30/41 → 62          (BLOCKED: v46+ requires ESLint v8)
# eslint-plugin-lodash 7 → 8              (BLOCKED: requires ESLint v8+)
# eslint-plugin-react-hooks 4 → 7         (BLOCKED: v5+ requires ESLint v9+)
# eslint-plugin-unicorn 40 → 64           (BLOCKED: v53+ requires ESLint v9)
# eslint-scope 4/5 → 9                    (BLOCKED: version-pinned to satisfy ESLint 7)
#   eslint-scope is pinned at v5 so ESLint 7's peer dep resolution wins over transitive
#   v4. Bumping it without upgrading ESLint breaks the toolchain.

# fetch-mock 9 → 12 (BLOCKED: v10+ is ESM-first with breaking API changes)
#   ~40 test files import from 'fetch-mock' using CommonJS patterns and the v9 matcher
#   API (toHaveFetched, toHaveFetchedTimes, etc.).

# fs-extra — also declared in assets/package.json; handled above via root hoisting.

# husky 3 → 9 (BLOCKED: config format changed in v5)
#   v5+ dropped the "husky": { "hooks": {} } key in package.json. Each hook must be
#   migrated to an individual shell script in .husky/ and a "prepare" script added.

# lint-staged — updated above.

# prettier 2 → 3 (BLOCKED: using WordPress fork)
#   Declared as "prettier": "npm:wp-prettier@2.6.2". Cannot update independently;
#   requires a co-ordinated upgrade of wp-prettier + @wordpress/prettier-config + eslint.

# react 17 → 19         (BLOCKED: ecosystem-wide React upgrade required)
# react-dom 17 → 19     (BLOCKED: must match react version)
# react-test-renderer 17 → 19  (BLOCKED: must match react version)
#   Many dependencies pin to React 17 (react-router-dom v5, @testing-library/react v10,
#   react-google-charts v3, @wordpress/element v4). Upgrade as a coordinated effort.

# semver-regex 3 → 4 (BLOCKED: v4 is ESM-only)
#   packages/eslint-plugin/rules/jsdoc-requires-since.js uses require('semver-regex'),
#   which is a CommonJS context incompatible with an ESM-only package.

# stylelint* — updated above.

# typescript 5 → 6 (BLOCKED: breaking strict-mode changes)
#   TypeScript 6 tightens several checks and removes deprecated APIs. Without running
#   the full typecheck suite first it risks introducing new type errors across the codebase.

# webpack-cli — updated above.

echo ""
section "assets/package.json"

# @wordpress/browserslist-config: 5 → 6 (same reasoning as root)
install_workspace assets '@wordpress/browserslist-config@^6.46.0' --save-dev

# copy-webpack-plugin: 13 → 14
# Requires Node 18+ (Node 24 ✓). No API changes to the constructor or options used.
install_workspace assets 'copy-webpack-plugin@^14.0.0' --save-dev

# cssnano: 6 → 8
# Used via postcss.config.js with no options (production-only). PostCSS v8 compatible.
install_workspace assets 'cssnano@^8.0.1' --save-dev

# webpack-cli: 6 → 7 (same reasoning as root)
install_workspace assets 'webpack-cli@^7.0.2' --save-dev

# webpack-manifest-plugin: 5 → 6
# Only WebpackManifestPlugin constructor + generate/serialize callbacks are used;
# that API surface is unchanged in v6.
install_workspace assets 'webpack-manifest-plugin@^6.0.1' --save-dev

# --------------------------------------------------------------------------
# BLOCKED — assets/package.json
# --------------------------------------------------------------------------

# @material/button, @material/checkbox, @material/dialog, @material/form-field,
# @material/layout-grid, @material/linear-progress, @material/list, @material/menu,
# @material/radio, @material/ripple, @material/switch  v2 → v14  (BLOCKED: full rewrite)
#   v14 is a complete rewrite to native Web Components (Material Web). The project uses
#   the SCSS-based Material Design Components v2 API throughout; migrating requires
#   rewriting all MDC component usage and SCSS imports.

# @storybook/addon-queryparams 6 → 10 (BLOCKED: requires Storybook v9)
#   Used in 13 story files via `import { withQuery } from '@storybook/addon-queryparams'`.
#   v10 of the addon targets Storybook v9; the project is on Storybook v8.

# @testing-library/react 10 → 16 (BLOCKED: see root)

# @wordpress/browserslist-config — updated above.

# clipboard-copy 3 → 4 (BLOCKED: v4 is ESM-only)
#   Imported in 3 component files that are also tested via jest. An ESM-only package
#   requires transformIgnorePatterns adjustments and jest ESM support to avoid
#   "require() of ES Module" errors in the test environment.

# compare-versions 3 → 6 (BLOCKED: API changed in v4)
#   assets/js/googlesitekit/datastore/user/feature-tours.js uses the v3 API:
#   compareVersions.compare(a, b, '>=')
#   In v4+ compareVersions is a plain function and .compare() is a separate named export
#   with a different call signature.

# cssnano — updated above.

# dompurify 2 → 3 (BLOCKED: factory function removed)
#   assets/js/util/purify.js: import createDOMPurify from 'dompurify' then
#   createDOMPurify(global). v3 removed the factory export; the new API is a
#   pre-instantiated singleton. Code change required.

# eslint-webpack-plugin 3 → 6 (BLOCKED: v5+ requires ESLint v9)
#   See eslint in root section.

# faker 5 → 6 (BLOCKED: widespread API changes)
#   faker.seed(), faker.datatype.number/float/boolean, faker.random.arrayElement, and
#   faker.lorem.* are used in multiple data-mock and __factories__ files. All of these
#   namespaces were restructured in v6.

# focus-trap-react 10 → 12 (BLOCKED: breaking option changes in v11)
#   SideSheet.js uses focusTrapOptions with allowOutsideClick. v11 changed how several
#   focus-trap options are initialised; audit of the FocusTrap props required.

# immer 9 → 11 (BLOCKED: default export removed in v10)
#   assets/js/googlesitekit/data/create-reducer.js: import produce from 'immer'
#   v10 removed the default export; produce must now be imported as a named export.
#   ~70 datastore files depend on createReducer which wraps produce.

# memize 1 → 2 (BLOCKED: v2 is ESM-only)
#   Used in 7 production files via `import memize from 'memize'`. As an ESM-only
#   package, jest would need to transform it (via transformIgnorePatterns). Risk of
#   breaking the test environment without that config change.

# postcss-preset-env 9 → 11 (BLOCKED: breaking stage/feature config in v10)
#   v10 changed how CSS stage features are enabled. While the project currently calls
#   presetEnv() with no arguments (all defaults), the default stage changed from 2 to 3
#   in v10, which silently changes which CSS transforms are applied to the output.

# query-string 7 → 9 (BLOCKED: v8+ is ESM-only)
#   assets/js/googlesitekit/datastore/site/info.js imports query-string. As with
#   memize, jest would fail with a "require() of ES Module" error without config changes.

# react 17 → 19 / react-dom 17 → 19 (BLOCKED: see root)

# react-google-charts 3 → 5 (BLOCKED: requires React 18)
#   v4+ dropped React 17 support. Also uses getChartWrapper callback and chartVersion
#   prop whose behaviour changed in v4.

# react-joyride 2 → 3 (BLOCKED: active patch + breaking prop changes)
#   patches/react-joyride+2.9.3.patch modifies beacon behaviour. v3 also renamed/removed
#   several props (floaterProps, styles object shape). Code change and patch re-evaluation
#   required.

# react-router-dom 5 → 7 (BLOCKED: complete API rewrite)
#   The codebase uses Switch, Route, Redirect, HashRouter, useHistory, withRouter, and
#   MemoryRouter — all removed or replaced in v6/v7. This is a significant migration.

# react-use 15 → 17 (BLOCKED: verify API changes)
#   14 distinct hooks are used (useMount, useUnmount, useIntersection, useEvent,
#   useWindowScroll, useUpdateEffect, useInterval, useClickAway, useKey, etc.).
#   The API is largely stable but the jump from v15 to v17 includes deprecations and
#   internal behaviour changes that need verification against the full test suite.

# rimraf 3 → 6 (SKIPPED: already ^6.0.1 in assets/package.json)

# rxjs 6 → 7 (BLOCKED: import path changed)
#   Three data-mock files import from 'rxjs/operators' (the RxJS 6 path). In RxJS 7
#   operators are exported directly from 'rxjs'; the legacy rxjs/operators path was
#   removed. Code change required.

# webpack-manifest-plugin — updated above.

echo ""
section "storybook/package.json"

# @storybook/addon-webpack5-compiler-babel: 3 → 4
# v4 targets Storybook v8 (project is on 8.6.12). ✓
install_workspace storybook '@storybook/addon-webpack5-compiler-babel@^4.0.1' --save-dev

echo ""
section "tests/e2e/package.json"

# cross-env: 7 → 10
# CLI tool only; no API surface consumed programmatically.
install_workspace tests/e2e 'cross-env@^10.1.0'

# jsdom: 16 → 29
# tests/e2e uses jest-puppeteer (not jsdom) as its test environment; jsdom is only a
# utility dep here. jsdom 29 requires Node 16+ (Node 24 ✓).
install_workspace tests/e2e 'jsdom@^29.1.1'

# --------------------------------------------------------------------------
# BLOCKED — tests/e2e/package.json
# --------------------------------------------------------------------------

# @wordpress/e2e-test-utils 4 → 11 (BLOCKED: major breaking changes)
#   The test util API was substantially reworked across these majors; test files require
#   significant updates.

# babel-jest 29 → 30 (BLOCKED: must match jest version)
#   babel-jest must match the installed jest version. jest 30 has breaking config changes
#   (see jest below); update both together after auditing the jest config.

# dockerode 4 → 5 (BLOCKED: Docker API changes)
#   v5 targets Docker Engine API 1.41+; verify Docker daemon version in CI before updating.

# expect-puppeteer 4 → 11  (BLOCKED: tied to jest-puppeteer)
# jest-puppeteer 6 → 11    (BLOCKED: major breaking changes)
# puppeteer 10 → 25        (BLOCKED: extensive API changes across 15 majors)
#   These three packages form a tightly coupled stack. puppeteer 20+ changed the
#   browser launch API and removed many deprecated helpers. jest-puppeteer 8+ requires
#   puppeteer 20+ and jest 29+. Upgrade as a coordinated effort.

# jest 29 → 30 (BLOCKED: breaking config changes)
#   jest 30 changed fake-timer defaults, some snapshot serialisation, and reporter APIs.
#   The complex multi-project config in tests/js/jest.config.js needs auditing first.

# jsdom 16 → 29 — updated above (listed separately in candidate list due to lockfile).

echo ""
section "tests/js/package.json"

# cross-env: 7 → 10 (same reasoning as tests/e2e)
install_workspace tests/js 'cross-env@^10.1.0' --save-dev

# --------------------------------------------------------------------------
# BLOCKED — tests/js/package.json
# --------------------------------------------------------------------------

# babel-jest 29 → 30          (BLOCKED: must match jest version — see tests/e2e)
# jest 29 → 30                (BLOCKED: see tests/e2e)
# jest-environment-jsdom 29 → 30  (BLOCKED: must match jest version)
# jsdom 20 → 29               (SKIPPED: package.json already declares ^26.1.0;
#                              only the lockfile resolves to 20.x)

echo ""
section "tests/playwright/package.json"

# @types/node: 22 → 24 (aligns with Node 24 LTS)
install_workspace tests/playwright '@types/node@^24.0.0' --save-dev

# --------------------------------------------------------------------------
# BLOCKED — tests/backstop/package.json
# --------------------------------------------------------------------------

# glob 7/9 → 13 (BLOCKED: v10+ is ESM-only)
#   tests/backstop/scenarios.js: const glob = require('glob'); glob.sync(absGlob)
#   CommonJS require() is incompatible with an ESM-only package without a config change.

# node-fetch 2 → 3 (BLOCKED: v3 is ESM-only)
#   tests/backstop/engine_scripts/puppet/ignoreCSP.js: const fetch = require('node-fetch')
#   Same issue as glob — CommonJS context incompatible with ESM-only v3.

echo ""
echo "==> All safe package updates applied."
echo "    Run the full test suite and lint checks to verify:"
echo "      npm run lint:css    (stylelint 17 may flag new rule violations)"
echo "      npm run lint:js"
echo "      npm run test:js"
echo "      npm run build"
w