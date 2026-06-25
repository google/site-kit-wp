# JavaScript Testing

Site Kit uses a comprehensive testing strategy with Jest for unit and integration tests, Playwright (migrating from legacy Puppeteer) for end-to-end tests, and specialized visual regression testing through Storybook.

## Test Organization

### Test File Structure

Tests are co-located with the code they cover. Test files may be `.test.js`,
`.test.jsx`, `.test.ts`, or `.test.tsx` (as the codebase migrates to TypeScript,
new and migrated tests use `.test.ts`/`.test.tsx`):

```
assets/js/
├── components/
│   ├── Component.js
│   ├── Component.test.js          // Component unit tests
│   └── Component.stories.js       // Storybook stories
├── modules/
│   └── analytics-4/
│       ├── components/
│       │   └── Component.test.js
│       ├── datastore/
│       │   ├── store.test.js      // Datastore tests
│       │   └── __fixtures__/      // Co-located mock/fixture data
│       └── utils/
│           └── helpers.test.js    // Utility tests
└── util/
    └── function.test.js           // Utility function tests

tests/js/
├── jest.config.js                 // Jest configuration
├── test-utils.tsx                 // Custom render/renderHook + re-exported helpers
├── utils.ts                       // Core registry/provide/fetch helpers
├── setup-globals.js               // Global test setup (sets up globals)
└── setup-before-after.ts          // Global beforeEach/afterEach (fetchMock, timers)
```

Mock/fixture data is co-located with the code under test, typically in a
`__fixtures__/` directory next to the datastore or component it supports.

### Testing Categories

Site Kit tests are categorized by scope and purpose:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test component interactions with datastores
3. **Module Tests**: Test complete module functionality
4. **Hook Tests**: Test custom React hooks
5. **Utility Tests**: Test helper functions and utilities
6. **End-to-End Tests**: Test full user flows in a real browser (Playwright; see
   the [End-to-End Testing](#end-to-end-testing) section)

## Testing Conventions

### Component Testing Patterns

Use the custom `render` from `@tests/js/test-utils` (re-exports everything from
`@testing-library/react`). It wraps the UI in the registry, features, router, and
view-context providers, and accepts a `registry` option, so there is no need to
mount a context provider yourself. It also returns the `registry` it used, plus
`waitForRegistry`:

```javascript
/**
 * Component tests.
 */
import { render, screen, createTestRegistry } from '@tests/js/test-utils';
import Component from './Component';

describe( 'Component', () => {
    let registry;

    beforeEach( () => {
        registry = createTestRegistry();
    } );

    it( 'should render basic content', () => {
        render( <Component />, { registry } );

        expect( screen.getByText( 'Expected Content' ) ).toBeInTheDocument();
    } );
} );
```

> In TypeScript test files (`.test.tsx`) the imports and APIs are identical;
> `render`/`renderHook` are already typed in `test-utils.tsx`.

### Datastore Testing Patterns

Datastore tests use specialized utilities:

```javascript
import { setUsingCache } from 'googlesitekit-api';
import { createTestRegistry, freezeFetch } from '@tests/js/test-utils';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'modules/analytics-4 datastore', () => {
    let registry;
    let store;

    beforeAll( () => {
        setUsingCache( false );
    } );

    beforeEach( () => {
        registry = createTestRegistry();
        store = registry.stores[ MODULES_ANALYTICS_4 ].store;
    } );

    afterAll( () => {
        setUsingCache( true );
    } );

    describe( 'actions', () => {
        it( 'should set property ID', () => {
            const propertyID = 'properties/12345';
            
            registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );
            
            expect( registry.select( MODULES_ANALYTICS_4 ).getPropertyID() )
                .toBe( propertyID );
        } );
    } );

    describe( 'selectors', () => {
        it( 'should return property ID when set', () => {
            registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
                propertyID: 'properties/12345'
            } );

            expect( registry.select( MODULES_ANALYTICS_4 ).getPropertyID() )
                .toBe( 'properties/12345' );
        } );
    } );
} );
```

### API Request Testing

API interactions are tested using fetch mocks. `fetchMock` (from
`fetch-mock-jest`) is exposed as a global in `tests/js/setup-before-after.ts`, so
it does not need to be imported, and it is reset automatically after every test
(`afterEach( () => fetchMock.mockReset() )`) — individual tests don't need their
own teardown:

```javascript
import { createTestRegistry, untilResolved } from '@tests/js/test-utils';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'API requests', () => {
    let registry;

    beforeEach( () => {
        registry = createTestRegistry();
    } );

    it( 'should make GET request for reports', async () => {
        const response = [ { data: 'test' } ];
        const endpoint = /^\/google-site-kit\/v1\/modules\/analytics-4\/data\/report/;
        
        fetchMock.getOnce( endpoint, { body: response, status: 200 } );

        registry.select( MODULES_ANALYTICS_4 ).getReport( {
            startDate: '2023-01-01',
            endDate: '2023-01-31',
            metrics: [ 'totalUsers' ]
        } );

        await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport( {
            startDate: '2023-01-01',
            endDate: '2023-01-31',
            metrics: [ 'totalUsers' ]
        } );

        expect( fetchMock ).toHaveFetchedTimes( 1 );
        expect( fetchMock ).toHaveLastFetched( endpoint );
    } );
} );
```

### Custom Hook Testing

Custom hooks are tested using the custom `renderHook` from `@tests/js/test-utils`,
which wraps the hook in the same providers as `render` and accepts a `registry`
option (defaulting to a fresh test registry). For hook tests, use `actHook` (which
test-utils re-exports as `act` of `@testing-library/react-hooks`):

```javascript
import { actHook as act, renderHook, createTestRegistry } from '@tests/js/test-utils';
import useMyCustomHook from './useMyCustomHook';

describe( 'useMyCustomHook', () => {
    let registry;

    beforeEach( () => {
        registry = createTestRegistry();
    } );

    it( 'should return expected values', () => {
        const { result } = renderHook( () => useMyCustomHook(), { registry } );

        expect( result.current.value ).toBe( expectedValue );
    } );

    it( 'should handle actions', () => {
        const { result } = renderHook( () => useMyCustomHook(), { registry } );

        act( () => {
            result.current.doAction();
        } );

        expect( result.current.hasActioned ).toBe( true );
    } );
} );
```

## Test Utilities

### Core Testing Utilities

Site Kit re-exports its testing utilities from `tests/js/test-utils.tsx` (most of
which are defined in `tests/js/utils.ts`):

```javascript
import {
    createTestRegistry,         // Creates a test registry with all stores registered
    provideUserInfo,            // Provides current-user info to CORE_USER
    provideUserAuthentication,  // Provides authentication state to CORE_USER
    provideSiteInfo,            // Provides site configuration to CORE_SITE
    provideModules,             // Provides the list of available modules
    provideModuleRegistrations, // Registers module datastores/components
    freezeFetch,                // Leaves a fetch request pending (never resolves)
    muteFetch,                  // Returns an empty/successful response for a request
    untilResolved,              // Waits for a resolver to finish
    setEnabledFeatures          // Enables feature flags for the current test
} from '@tests/js/test-utils';

// Example comprehensive test setup
describe( 'Complex Component', () => {
    let registry;

    beforeEach( () => {
        registry = createTestRegistry();

        // Provide required data
        provideUserInfo( registry );
        provideModules( registry );
        provideModuleRegistrations( registry );
        provideSiteInfo( registry );

        // Enable feature flags for testing (see feature-flags.json for the
        // current list of valid flags).
        setEnabledFeatures( [ 'proactiveUserEngagement' ] );

        // Mock module settings
        registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
            propertyID: 'properties/12345',
            accountID: 'accounts/54321'
        } );
    } );
} );
```

> Console output is asserted, not muted: the `@wordpress/jest-console` matchers
> (`expect( console ).toHaveErrored()` / `.not.toHaveErrored()`, and the `warn`/
> `info`/`log` equivalents) are active globally, so a test that triggers a
> `console.error` must assert it or the test fails. There is no `muteConsole`
> helper.

### Mock Data Patterns

Mock data follows consistent patterns:

```javascript
// Mock Analytics 4 report data
const mockAnalyticsReport = [
    {
        dimensionHeaders: [ { name: 'date' } ],
        metricHeaders: [ { name: 'totalUsers', type: 'TYPE_INTEGER' } ],
        rows: [
            {
                dimensionValues: [ { value: '20231201' } ],
                metricValues: [ { value: '1234' } ]
            }
        ]
    }
];

// Mock AdSense earnings data
const mockAdSenseEarnings = {
    rows: [
        [ '2023-12-01', '123.45' ]
    ],
    headers: [
        { name: 'DATE', type: 'DIMENSION' },
        { name: 'EARNINGS', type: 'METRIC_CURRENCY' }
    ]
};

// Mock Search Console data
const mockSearchConsoleData = [
    {
        keys: [ 'example query' ],
        clicks: 100,
        impressions: 1000,
        ctr: 0.1,
        position: 5.5
    }
];
```

## Error Boundary Testing

Test error handling in components with the shared `ThrowErrorComponent` helper
(`tests/js/ThrowErrorComponent.js`), which throws on mount when given the
`throwErrorOnMount` prop. Because the `@wordpress/jest-console` matchers are
active, assert the expected `console.error` with `expect( console ).toHaveErrored()`:

```javascript
import { render, screen } from '@tests/js/test-utils';
import ThrowErrorComponent from '@tests/js/ThrowErrorComponent';
import WidgetErrorHandler from './';

describe( 'Component Error Handling', () => {
    it( 'should handle component errors gracefully', () => {
        render(
            <WidgetErrorHandler slug="test-widget">
                <ThrowErrorComponent throwErrorOnMount />
            </WidgetErrorHandler>
        );

        expect( console ).toHaveErrored();

        expect( screen.getByText( /Error in Widget/ ) ).toBeInTheDocument();
    } );
} );
```

## Running Tests

Run a single Jest test file (preferred — do not run the whole suite):

```bash
npm -w tests/js run test:js -- <path/to/file.test.js>
```

Jest discovers any `*.test.{js,jsx,ts,tsx}` file co-located with the code.

Test title convention: `it(...)`/`test(...)` titles start with "should …" (e.g.
`it( 'should render the report', …)`); `describe(...)` titles stay plain.

## End-to-End Testing

Site Kit's E2E tests are migrating from the legacy Puppeteer setup to Playwright:

- **Playwright (current)** — `tests/playwright/`, run with `npm run test:playwright`.
  All new E2E tests are written in Playwright (`*.spec.ts` under
  `tests/playwright/specs/`). It uses a Docker-based WordPress environment with
  per-test database isolation, cookie-based authentication (no real login), a
  local Google API fixtures service, and Mailpit for email capture. Tests declare
  their requirements via annotations such as `asUser`, `withPlugins`,
  `withFeatureFlags`, and `withFixtures`, and use the `wp` fixture for REST/DB
  helpers.

  ```ts
  import { expect, test } from '../playwright';
  import { asUser, withPlugins } from '../wordpress';

  test(
      'should do something',
      { annotation: [ asUser( 'admin' ), withPlugins( 'proxy-auth.php' ) ] },
      async ( { page, wp } ) => {
          // `page` is the standard Playwright page; `wp` is the Site Kit
          // REST/DB fixture.
      }
  );
  ```

  **`tests/playwright/README.md` is the authoritative guide** — consult it for the
  full set of annotations, fixtures, helpers, and the Docker environment. Do not
  duplicate its content.

- **Puppeteer (legacy)** — `tests/e2e/` (specs under `tests/e2e/specs/`), run with
  `npm run test:e2e`. Maintained for existing coverage only; prefer Playwright for
  new tests.

## Visual Regression Testing

Visual regression tests run through BackstopJS against Storybook stories
(`*.stories.js`, increasingly `.tsx`). Run `npm run test:visualtest` to compare
against reference images and `npm run test:visualapprove` to accept new
screenshots as the reference.
