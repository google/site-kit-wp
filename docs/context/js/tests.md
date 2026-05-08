# JavaScript Testing

Site Kit uses a comprehensive testing strategy with Jest for unit and integration tests, plus specialized visual regression testing through Storybook.

## Test Organization

### Test File Structure

Tests are organized following specific patterns:

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
│       │   └── store.test.js      // Datastore tests
│       └── util/
│           └── helpers.test.js    // Utility tests
└── util/
    └── function.test.js           // Utility function tests

tests/js/
├── jest.config.js                 // Jest configuration
├── test-utils.js                  // Testing utilities
├── setup-globals.js               // Global test setup
└── mock-data/                     // Mock data for tests
```

### Testing Categories

Site Kit tests are categorized by scope and purpose:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test component interactions with datastores
3. **Module Tests**: Test complete module functionality
4. **Hook Tests**: Test custom React hooks
5. **Utility Tests**: Test helper functions and utilities

## Testing Conventions

### Component Testing Patterns

Basic component test structure:

```javascript
/**
 * Component tests.
 */
import { render, screen } from '@testing-library/react';
import UserContext from 'googlesitekit-api';
import { createTestRegistry } from '../../../tests/js/test-utils';
import Component from './Component';

describe( 'Component', () => {
    let registry;

    beforeEach( () => {
        registry = createTestRegistry();
    } );

    it( 'should render basic content', () => {
        render( 
            <UserContext.Provider value={ registry }>
                <Component />
            </UserContext.Provider>
        );
        
        expect( screen.getByText( 'Expected Content' ) ).toBeInTheDocument();
    } );
} );
```

### Datastore Testing Patterns

Datastore tests use specialized utilities:

```javascript
import { createTestRegistry, freezeFetch, muteConsole } from '../../../tests/js/test-utils';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'modules/analytics-4 datastore', () => {
    let registry;
    let store;

    beforeAll( () => {
        muteConsole( 'error' );
    } );

    beforeEach( () => {
        registry = createTestRegistry();
        store = registry.stores[ MODULES_ANALYTICS_4 ].store;
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

API interactions are tested using fetch mocks:

```javascript
import fetchMock from 'fetch-mock-jest';
import { createTestRegistry, untilResolved } from '../../../tests/js/test-utils';

describe( 'API requests', () => {
    let registry;

    beforeEach( () => {
        registry = createTestRegistry();
    } );

    afterEach( () => {
        fetchMock.clearHistory();
        fetchMock.restore();
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

Custom hooks are tested using specialized testing utilities:

```javascript
import { renderHook, act } from '@testing-library/react';
import { createTestRegistry } from '../../../tests/js/test-utils';
import useMyCustomHook from './useMyCustomHook';

describe( 'useMyCustomHook', () => {
    let registry;

    beforeEach( () => {
        registry = createTestRegistry();
    } );

    it( 'should return expected values', () => {
        const { result } = renderHook( () => useMyCustomHook(), {
            wrapper: ( { children } ) => (
                <UserContext.Provider value={ registry }>
                    { children }
                </UserContext.Provider>
            )
        } );

        expect( result.current.value ).toBe( expectedValue );
    } );

    it( 'should handle actions', () => {
        const { result } = renderHook( () => useMyCustomHook() );

        act( () => {
            result.current.doAction();
        } );

        expect( result.current.hasActioned ).toBe( true );
    } );
} );
```

## Test Utilities

### Core Testing Utilities

Site Kit provides comprehensive testing utilities in `tests/js/test-utils.js`:

```javascript
import { 
    createTestRegistry,     // Creates test registry with mocked data
    provideUserInfo,        // Provides user authentication data
    provideModuleRegistrations, // Registers all modules
    provideSiteInfo,        // Provides site configuration
    muteConsole,           // Mutes console warnings/errors
    freezeFetch,           // Prevents real network requests
    untilResolved,         // Waits for async operations
    setEnabledFeatures     // Enables feature flags
} from '../../../tests/js/test-utils';

// Example comprehensive test setup
describe( 'Complex Component', () => {
    let registry;

    beforeAll( () => {
        muteConsole( 'error', 'warn' );
    } );

    beforeEach( () => {
        registry = createTestRegistry();
        
        // Provide required data
        provideUserInfo( registry );
        provideModuleRegistrations( registry );
        provideSiteInfo( registry );
        
        // Enable feature flags for testing
        setEnabledFeatures( [ 'userInput', 'keyMetrics' ] );
        
        // Mock module settings
        registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
            propertyID: 'properties/12345',
            accountID: 'accounts/54321'
        } );
    } );
} );
```

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

Test error handling in components:

```javascript
import { createErrorComponent } from '../../../tests/js/test-utils';

describe( 'Component Error Handling', () => {
    it( 'should handle component errors gracefully', () => {
        const ThrowError = createErrorComponent();
        
        muteConsole( 'error' );
        
        render(
            <WidgetErrorHandler slug="test-widget">
                <ThrowError />
            </WidgetErrorHandler>
        );

        expect( screen.getByText( 'Error loading widget' ) )
            .toBeInTheDocument();
    } );
} );
```
