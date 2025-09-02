# **Code Assistant Context - Site Kit by Google**

## Project Overview
WordPress plugin providing Google services integration. PHP backend (`includes/`) + React frontend (`assets/js/`) with modular architecture for each Google service (Analytics, AdSense, Search Console, etc.).

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
- **Config**: `storybook/main.js` - Storybook configuration and build setup
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
