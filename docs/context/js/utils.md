# Global Utilities Organization

Site Kit uses a systematic approach to organizing utility functions, providing reusable logic across components, modules, and contexts throughout the application.

## Utility File Storage Structure

### Primary Global Utilities Location

**Primary Location**: `/assets/js/util/`

All application-wide utility functions are stored in the **`/assets/js/util/`** directory. This is the centralized location for utilities that are used across multiple components, modules, or contexts.

```
assets/js/util/
├── index.js                          // Main utility exports
├── api.js                            // API interaction utilities
├── dates.js                          // Date manipulation functions
├── chart.js                          // Chart and visualization utilities
├── sanitize.js                       // Data sanitization functions
├── stringify.js                      // String formatting utilities
├── storage.js                        // Browser storage utilities
├── i18n.js                          // Internationalization helpers
├── markdown.js                       // Markdown processing
├── convert-time.js                   // Time conversion utilities
├── urls.js                          // URL manipulation functions
├── when-active.js                    // HOC for module activation
├── when-inactive.js                  // HOC for inactive states
├── whenInViewContext.js              // Viewport intersection utilities
├── whenScopesGranted.js              // Permission-based HOCs
├── tracking/                         // Event tracking utilities
│   ├── index.js                     // Tracking exports
│   ├── createTrackEvent.js          // Event tracking functions
│   ├── createTracking.js            // Tracking system setup
│   └── constants.js                 // Tracking constants
└── test/                            // Legacy test utilities
    ├── calculateChange.js
    ├── numFmt.js
    └── validateJSON.js
```

### Module-Specific Utilities Location

Each module can have its own utility directory for module-specific functions:

```
assets/js/modules/{module-name}/util/
├── index.js                          // Module utility exports
├── validation.js                     // Module-specific validation
├── parsing.js                        // Data parsing utilities
├── constants.js                      // Module constants
└── report-validation.js              // Report validation logic
```

**Examples**:
- `/assets/js/modules/adsense/util/` - AdSense-specific utilities
- `/assets/js/modules/analytics-4/util/` - Analytics 4 utilities  
- `/assets/js/modules/search-console/util/` - Search Console utilities
- `/assets/js/modules/tagmanager/util/` - Tag Manager utilities

### Component-Specific Utilities Location

For component-specific utilities that are only used within a particular component group:

```
assets/js/components/{component-group}/util/
├── constants.js                      // Component constants
├── validation.js                     // Component validation
└── helpers.js                        // Component helpers
```

**Examples**:
- `/assets/js/components/user-input/util/` - User input utilities
- `/assets/js/googlesitekit/widgets/util/` - Widget system utilities

## Utility Categories and Organization

### Core Utility Categories

Site Kit organizes utilities into logical categories:

#### 1. **Data Manipulation Utilities** (`/assets/js/util/`)

```javascript
// Date and time utilities
export {
    getDateString,
    stringToDate, 
    getCurrentDateRangeDayCount,
    isValidDateString,
    getPreviousDate,
    dateSub
} from './dates';

// Array and object utilities
export {
    calculateChange,
    decodeHTMLEntity,
    validateJSON
} from './index';

// String utilities
export { 
    sanitizeHTML,
    escapeURI,
    stringify
} from './sanitize';
```

#### 2. **React Higher-Order Components** (`/assets/js/util/`)

```javascript
// Module state HOCs
import whenActive from './when-active';
import whenInactive from './when-inactive';
import whenScopesGranted from './whenScopesGranted';
import whenInViewContext from './whenInViewContext';

// Usage example
export default whenActive( {
    moduleName: 'analytics-4',
    FallbackComponent: ConnectAnalyticsCTA
} )( AnalyticsWidget );
```

#### 3. **API and Network Utilities** (`/assets/js/util/api.js`)

```javascript
// API error tracking
export async function trackAPIError( args ) {
    const { method, type, identifier, datapoint, error } = args;
    
    if ( excludedEndpoints.includes( endpoint ) ) {
        return;
    }
    
    await trackEvent(
        'api_error',
        `${ method }:${ type }/${ identifier }/data/${ datapoint }`,
        `${ error.message } (${ labelMeta })`,
        error.data?.status || error.code
    );
}

export const excludedErrorCodes = [ 'fetch_error' ];
export const excludedEndpoints = [];
```

#### 4. **Tracking and Analytics Utilities** (`/assets/js/util/tracking/`)

```javascript
// Core tracking setup
export {
    enableTracking,
    disableTracking,
    isTrackingEnabled,
    trackEvent,
    trackEventOnce,
} from './tracking';

// Usage patterns
await trackEvent( 'setup_flow', 'module_connected', 'analytics-4' );
await trackEventOnce( 'dashboard_view', 'first_visit' );
```

#### 5. **Chart and Visualization Utilities** (`/assets/js/util/chart.js`)

```javascript
// Chart helper functions
export function getChartDifferenceArrow( difference, options = {} ) {
    if ( Number.isNaN( Number( difference ) ) ) {
        return '';
    }
    
    const { invertColor = false } = options;
    
    return renderToString(
        <ChangeArrow
            direction={ difference > 0 ? 'up' : 'down' }
            invertColor={ invertColor }
        />
    );
}
```

### Module-Specific Utility Patterns

#### Module Validation Utilities

Each module typically includes validation utilities:

```javascript
// /assets/js/modules/adsense/util/validation.js
export function isValidAccountID( accountID ) {
    return /^pub-\d+$/.test( accountID );
}

export function isValidAdClientID( adClientID ) {
    return /^ca-pub-\d+$/.test( adClientID );
}

// Module exports all validations
// /assets/js/modules/adsense/util/index.js
export * from './validation';
export * from './parsing';
export * from './is-zero-report';
```

#### Module Data Processing Utilities

```javascript
// /assets/js/modules/adsense/util/parsing.js
export function reduceAdSenseData( rows ) {
    const dataMap = [
        [
            { type: 'date', label: 'Day' },
            { type: 'number', label: 'RPM' },
            { type: 'number', label: 'Earnings' },
            { type: 'number', label: 'Impressions' },
        ],
    ];

    each( rows, ( row ) => {
        const date = stringToDate( row.cells[ 0 ].value );
        dataMap.push( [
            date,
            row.cells[ 2 ].value,
            row.cells[ 1 ].value,
            row.cells[ 3 ].value,
        ] );
    } );

    return { dataMap };
}
```

## Utility Export Patterns

### Global Utility Exports (`/assets/js/util/index.js`)

The main utility index file re-exports commonly used functions:

```javascript
/**
 * Utility functions.
 */

// Re-export tracking utilities
import { trackEvent, trackEventOnce } from './tracking';
export { trackEvent, trackEventOnce };

// Re-export specific utility modules
export * from './sanitize';
export * from './stringify';
export * from './storage';
export * from './i18n';
export * from './markdown';
export * from './convert-time';
export * from './dates';
export * from './chart';
export * from './urls';

// Direct utility functions
export function calculateChange( previous, current ) {
    // Implementation...
}

export function validateJSON( stringToValidate ) {
    // Implementation...
}

export function decodeHTMLEntity( str ) {
    // Implementation...
}
```

### Module Utility Exports

Module utilities follow a consistent export pattern:

```javascript
// /assets/js/modules/adsense/util/index.js
/**
 * AdSense utility functions.
 */
export * from './is-zero-report';
export * from './parsing';
export * from './validation';

// Module-specific functions
export function reduceAdSenseData( rows ) {
    // Implementation...
}
```

### Component Utility Exports

Component-specific utilities are typically smaller and focused:

```javascript
// /assets/js/googlesitekit/widgets/util/index.js
export { default as combineWidgets } from './combine-widgets';
export { default as isInactiveWidgetState } from './is-inactive-widget-state';
export { default as withWidgetComponentProps } from './with-widget-component-props';

// Constants export
export * from './constants';
```

## Import and Usage Patterns

### Importing Global Utilities

```javascript
// Import from main utility index
import { 
    trackEvent, 
    calculateChange, 
    getDateString,
    sanitizeHTML 
} from 'googlesitekit-util';

// Import specific utility modules
import { getChartDifferenceArrow } from '../../../util/chart';
import { whenActive } from '../../../util/when-active';
```

### Importing Module Utilities

```javascript
// Import module-specific utilities
import { 
    isValidAccountID, 
    reduceAdSenseData 
} from '../util';

// Import from specific utility files
import { isZeroReport } from '../util/is-zero-report';
import { parseAdSenseData } from '../util/parsing';
```

### Import Aliases and Path Mapping

Site Kit uses webpack aliases for clean imports:

```javascript
// Configured aliases in webpack
resolve: {
    alias: {
        'googlesitekit-util': path.resolve( __dirname, 'assets/js/util' ),
        'googlesitekit-modules': path.resolve( __dirname, 'assets/js/modules' ),
    }
}

// Usage with aliases
import { trackEvent } from 'googlesitekit-util';
import { MODULES_ANALYTICS_4 } from 'googlesitekit-modules';
```

## Best Practices for Utility Organization

### File Naming Conventions

1. **Descriptive Names**: Use clear, descriptive names that indicate the utility's purpose
   - `when-active.js` for module activation HOC
   - `report-validation.js` for report validation utilities
   - `is-zero-report.js` for zero-state checking

2. **Consistent Naming**: Follow established patterns
   - HOCs start with `when` or `with` (e.g., `whenActive`, `withWidgetComponentProps`)
   - Validation functions start with `is` (e.g., `isValidAccountID`, `isZeroReport`)
   - Processing functions use descriptive verbs (e.g., `reduceAdSenseData`, `parseAnalyticsReport`)

### Organization Guidelines

1. **Global vs. Module-Specific**: 
   - Place utilities in `/assets/js/util/` if used across multiple modules
   - Place utilities in module `/util/` directories if module-specific

2. **Single Responsibility**: Each utility file should have a focused purpose
   - `dates.js` only for date manipulation
   - `validation.js` only for validation functions
   - `parsing.js` only for data parsing

3. **Consistent Exports**: Use consistent export patterns
   - Use named exports for specific functions
   - Use barrel exports (`index.js`) to re-export related utilities
   - Document all exports with JSDoc comments

### Testing Utilities

All utilities should have corresponding test files:

```javascript
// /assets/js/util/dates.test.js
import { getDateString, isValidDateString, stringToDate } from './dates';

describe( 'dates utilities', () => {
    describe( 'getDateString', () => {
        it( 'should format date correctly', () => {
            const date = new Date( 2023, 11, 25 ); // December 25, 2023
            expect( getDateString( date ) ).toBe( '2023-12-25' );
        } );
    } );
} );
```

### Documentation Standards

1. **JSDoc Comments**: All utility functions should include comprehensive JSDoc
2. **Usage Examples**: Include examples in documentation
3. **Parameter Validation**: Use invariant checks for required parameters
4. **Return Type Documentation**: Clearly document return types and possible values

This systematic approach to utility organization ensures code reusability, maintainability, and consistent patterns across Site Kit's complex codebase.

### Error Handling
1. **Provide meaningful error states** with WidgetReportError
2. **Use error boundaries** (automatically provided)
3. **Clear errors** after successful recovery
4. **Provide user-friendly fallbacks**
