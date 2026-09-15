# Code Assistant Context - Site Kit by Google

## Project Overview
WordPress plugin providing Google services integration. PHP backend (`includes/`) + React frontend (`assets/js/`) with modular architecture for each Google service (Analytics, AdSense, Search Console, etc.).

## Writing an issue
When asked to create, draft, or write a GitHub issue from a design doc, from a bug report or from
requirements in the message, to break an epic's design doc into issues, or to write **Acceptance
criteria** for an existing issue, follow the shared, tool-agnostic playbook
**`docs/context/workflow/write-issue.md`** (the single source of truth). Establish the type first:
a **feature request** (`.github/ISSUE_TEMPLATE/feature_request.md`) gets a **Feature Description**
and **Acceptance criteria**; a **bug report** (`.github/ISSUE_TEMPLATE/bug_report.md`) gets a
**Bug Description**, **Steps to reproduce** and **Acceptance criteria** — **ask the user which one
when the request doesn't make it clear**. Verify every class, hook, handle and path against the
code before naming it, and for a bug confirm the wrong behavior is really what the code does
today. Rationale belongs in the description; the **Acceptance criteria** are checkable outcomes
only — no rationale, no technique notes, no cause or fix, no negative parentheticals, no work that
isn't being done. The **scope boundary** is itself a criterion, written as the outcome at the edge
("the cart and checkout pages render nothing"), never an "Out of scope" list and never a clause in
the description. Never link local design docs or refer to a sibling by its design-doc position
("issue 5") — that numbering isn't GitHub's. Touch **only** the type's authoring sections, leave
an existing description alone, and do not create or edit a GitHub issue unless explicitly asked.
(Claude Code exposes this as the `write-issue` skill; Gemini as `/write-issue`; Antigravity as the
`/write-issue` workflow.)

## Writing an implementation brief
When asked to write, draft, fill in, or groom the **Implementation Brief** and **Test Coverage**
sections of an issue, follow the shared, tool-agnostic playbook
**`docs/context/workflow/write-implementation-brief.md`** (the single source of truth). Verify
every class, method, hook, handle and path against the code before naming it; where the design
doc and the code disagree, the code wins. Write **instructions only** — no rationale, no work
that isn't needed, no routine commands, no links to local design docs. Touch **only** those two
sections, and do not edit the GitHub issue or post a comment unless explicitly asked. (Claude
Code exposes this as the `write-implementation-brief` skill; Gemini as `/write-brief`;
Antigravity as the `/write-implementation-brief` workflow.)

## Implementing a GitHub issue
When asked to implement, build, or work on a GitHub issue by number, follow the shared,
tool-agnostic playbook **`docs/context/workflow/implement-issue.md`** (the single source of
truth) and review against **`docs/context/workflow/review-checklist.md`**. Read only the
`docs/context/{js,php}` convention docs the issue touches. Co-locate tests and Storybook
stories; run lint, the specific test files touched, and `npm run build:dev`; and
**never commit, push, or open a PR unless explicitly asked**. (Claude Code exposes this as
the `implement-issue` skill; Gemini as `/implement`; Antigravity as the `/implement-issue`
workflow.)

## Reviewing a pull request
When asked to review a pull request by number, follow the shared, tool-agnostic playbook
**`docs/context/workflow/review-pr.md`** (the single source of truth) and grade against
**`docs/context/workflow/review-checklist.md`**. Read the issue the PR links under "Addresses
issue:" and check the diff against its acceptance criteria and Implementation Brief first, then
read only the `docs/context/{js,php}` convention docs the PR touches. Stay **read-only** — do
not post comments, approve, or change the PR state unless explicitly asked. (Claude Code
exposes this as the `review-pr` skill; Gemini as `/review-pr`; Antigravity as the `/review-pr`
workflow.)

## Architecture Essentials

### PHP Structure
- **Namespace**: `Google\Site_Kit\` (PSR-4 autoloaded)
- **Core**: `includes/Core/` - authentication, modules, storage, REST API
- **Modules**: `includes/Modules/` - each Google service as separate module
- **Entry**: `google-site-kit.php` → `includes/loader.php` → `includes/Plugin.php`

### JavaScript Structure
- **Data**: WordPress data stores in `assets/js/googlesitekit/data/`
- **Modules**: `assets/js/modules/{module}/` with `components/`, `datastore/`, `utils/`
- **Build**: Webpack multi-entry with code splitting

## Development Commands

### Essential Scripts
- `npm run build` / `npm run dev` - Asset builds
- `npm run lint` / `composer run lint` - Code quality
- `npm run test` / `composer run test` - Run tests
- `npm run watch` - Development auto-rebuild

### Key Config Files
- **Build**: `assets/webpack.config.js`
- **Quality**: `.eslintrc.json`, `phpcs.xml`, `.prettierrc.js`
- **Tests**: `tests/js/jest.config.js`, `phpunit.xml.dist`

## Development Standards

### PHP Conventions
- WordPress Coding Standards + PSR-4
- Text domain: `google-site-kit`
- snake_case methods, PascalCase classes with underscores
- **Details**: See `phpcs.xml` for complete ruleset

### JavaScript Conventions  
- WordPress ESLint preset + custom rules
- Function components, React Hooks patterns
- **One component per file**: never define more than one React component in a single file. Extract each additional component (including small sub-components) into its own file and import it. Shared, non-component code (styles, constants, helpers) may live in a separate non-component module (e.g. `pdfStyles.ts`).
- **Details**: See `.eslintrc.json` and custom ESLint plugin

## Testing Strategy
**Comprehensive multi-layer testing:**
- **PHP**: PHPUnit with WordPress test suite (`tests/phpunit/`)
- **JS**: Jest with React Testing Library (`tests/js/`)
- **E2E**: Puppeteer browser automation (`tests/e2e/`)
- **Visual**: Backstop.js for regression (`tests/backstop/`)

**Key test utilities**: `tests/js/test-utils.js` (JS), `tests/phpunit/includes/TestCase.php` (PHP)

## Module Development
1. **PHP**: Extend `Core\Modules\Module`, implement required interfaces
2. **JS**: Create datastore + components following existing patterns
3. **Integration**: Register in `includes/Core/Modules/Modules.php`

**Study existing modules** in `includes/Modules/` and `assets/js/modules/` for patterns.

### Module Pattern
Each module follows consistent structure:
```
includes/Modules/ModuleName.php           # Main PHP class
includes/Modules/ModuleName/              # PHP subclasses
assets/js/modules/module-slug/            # JS implementation
  ├── components/                         # React components
  ├── datastore/                          # WordPress data store
  └── utils/                              # Utilities
```

## Important Patterns
- **Feature Flags**: `feature-flags.json` + `Core\Util\Feature_Flags`
- **Assets**: Module-based registration via traits/interfaces
- **Data Flow**: WordPress data stores → React components
- **Authentication**: Google OAuth via proxy service

## Visual Regression Testing & Storybook

### Storybook Stories
**Component documentation and testing via interactive stories:**
- **Stories**: `**/*.stories.js` - React component stories for UI development
- **Config**: `storybook/main.js` - Storybook configuration
- **Setup**: `storybook/{package.json,webpack.config.js}` - Storybook build setup
- **Commands**: `npm run storybook` (dev), `npm run build:storybook` (build)

**Story structure follows CSF (Component Story Format):**
```
ComponentName.stories.js
├── export default { title, component }     # Story metadata
├── export const StoryName = () => <...>   # Individual stories
└── StoryName.parameters = { ... }         # Story-specific config
```

### Visual Regression Testing (VRT)
**Automated visual testing via BackstopJS + Storybook:**
- **Reference Images**: `tests/backstop/reference/` - Golden master screenshots
- **Config**: `tests/backstop/config.js` + `scenarios.js` - BackstopJS setup
- **VRT Styles**: `storybook/preview-head-vrt.html` - Animation/transition disabling

**VRT workflow:**
- `npm run test:visualtest` - Run VRT tests (compare vs reference)
- `npm run test:visualapprove` - Accept new screenshots as reference
- **Auto-generated**: Scenarios created from all `*.stories.js` files
- **Special classes**: `.googlesitekit-vrt-animation-none`, `.googlesitekit-vrt-animation-paused`

**When in doubt**: Check existing similar modules, refer to config files, or search the codebase for patterns.
