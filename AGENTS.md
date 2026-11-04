# Code Assistant Context - Site Kit by Google

## Project Overview
WordPress plugin providing Google services integration. PHP backend (`includes/`) + React frontend (`assets/js/`) with modular architecture for each Google service (Analytics, AdSense, Search Console, etc.).

## Skills
Project workflows, such as writing issues and implementation briefs, implementing issues and
reviewing pull requests, are skills in `.agents/skills/`. Each tool finds a skill by its
`description` and reads the full instructions only when the skill runs.

These rules apply whether or not a skill runs:
- **Never commit, push, or open a PR** unless explicitly asked.
- **Never write to GitHub** unless explicitly asked: do not create or edit issues, post comments,
  approve a pull request, or change its state.

### Adding a skill
Put the whole procedure in `.agents/skills/<name>/SKILL.md`, with any supporting files next to it,
and add a symlink to it at `.claude/skills/<name>/SKILL.md`. Do not add a separate playbook or
workflow file. Do not add an entry to this file for a new skill either: every tool loads this
file in full in every session, and it already finds skills by their `description`. Add a line here
only for a rule that must hold even when the skill does not run.

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
- **E2E**: Playwright browser automation (`tests/playwright/`, plus the legacy Jest suite in `tests/e2e/`)
- **Visual**: Playwright screenshots of Storybook stories (`tests/vrt/`)

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
**Automated visual testing via Playwright + Storybook, in Docker** (guide: `tests/vrt/README.md`):
- **Reference Images**: `tests/vrt/__screenshots__/<story path>/<viewport>.png`
- **Config**: `tests/vrt/playwright.config.js` + `scenarios.js` (reads each story's `.scenario`)
- **VRT Mode**: `storybook/preview-head-vrt.html` (animations off) + `storybook/utils/vrt.js` (fonts, render state)

**VRT workflow:**
- `npm run test:visualtest -- --grep "<story label>"` - Compare stories against reference images
- `npm run test:visualapprove -- --grep "<story label>"` - Write new reference images to commit
- Or add the `VRT: Update reference images` label to a PR to have CI commit them
- **Auto-generated**: One test per story with a `.scenario`, at three viewports
- **Special class**: `.googlesitekit-vrt-animation-paused` keeps animations paused at their first frame

**When in doubt**: Check existing similar modules, refer to config files, or search the codebase for patterns.
