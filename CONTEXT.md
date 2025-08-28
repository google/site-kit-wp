This is comprehensive development guidelines and conventions for the Site Kit by Google WordPress plugin. You should:

1. **Use as Reference**: Treat this as the authoritative source for Site Kit's coding conventions, architectural patterns, and best practices
2. **Follow Conventions**: Apply the documented patterns when writing, modifying, or reviewing Site Kit code
3. **Prioritize Guidelines**: These guidelines override general programming conventions
4. **Context-Aware**: Consider the specific context (React components, datastore, widgets, testing) when applying recommendations
5. **Maintain Consistency**: Ensure all code changes align with the established patterns documented here

The content covers:
- React component structure and naming conventions
- State management architecture using WordPress data stores
- Widget system implementation patterns
- Testing strategies and utilities
- Code organization and file structure standards

---

# Site Kit React Component Conventions

## Import Structure

All imports must be organized in the following order with comment separators:

### 1. External Dependencies
External libraries and packages, grouped together with comment:

```javascript
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Link as RouterLink } from 'react-router-dom';
```

### 2. WordPress Dependencies
WordPress packages and utilities, grouped together with comment:

```javascript
/**
 * WordPress dependencies
 */
import { forwardRef, useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
```

### 3. Internal Dependencies
Project-specific imports, including components, utilities, and datastore, grouped together with comment:

```javascript
/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import PreviewBlock from './PreviewBlock';
import { sanitizeHTML } from '../util';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
```

## Component Structure

### Function Declaration
Use function declarations for components, not arrow functions:

```javascript
//  Correct
export default function ComponentName( { prop1, prop2 } ) {
    // component logic
}

//  Also correct for forwardRef
const ComponentName = forwardRef( ( props, ref ) => {
    // component logic
});

// L Avoid
const ComponentName = ( { prop1, prop2 } ) => {
    // component logic
};
```

### Component Naming
- Use PascalCase for component names
- File names should match component names exactly
- Use descriptive names that clearly indicate purpose

### Props Destructuring
Destructure props in the function parameter with default values when appropriate:

```javascript
function Badge( { 
    label, 
    className, 
    hasLeftSpacing = false, 
    ...rest 
} ) {
    // component implementation
}
```

## PropTypes

Every component must include PropTypes validation after the component definition:

```javascript
ComponentName.propTypes = {
    // Required props
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    
    // Optional props with types
    className: PropTypes.string,
    isActive: PropTypes.bool,
    onClick: PropTypes.func,
    
    // Complex types
    error: PropTypes.shape({
        message: PropTypes.string,
    }),
    
    // Arrays
    items: PropTypes.arrayOf(PropTypes.string),
};
```

### Common PropTypes patterns:
- `PropTypes.string` - for text
- `PropTypes.bool` - for boolean flags
- `PropTypes.func` - for callback functions
- `PropTypes.node` - for any renderable content
- `PropTypes.element` - for React elements
- `PropTypes.string.isRequired` - for required props
- `PropTypes.shape({})` - for object structures
- `PropTypes.arrayOf()` - for arrays

## Example Complete Component

```javascript
/**
 * Badge component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const Badge = forwardRef(
    ( { label, className, hasLeftSpacing = false, ...rest }, ref ) => (
        <span
            ref={ ref }
            { ...rest }
            className={ classnames( 'googlesitekit-badge', className, {
                'googlesitekit-badge--has-left-spacing': hasLeftSpacing,
            } ) }
        >
            { label }
        </span>
    )
);

Badge.displayName = 'Badge';

Badge.propTypes = {
    label: PropTypes.string.isRequired,
    hasLeftSpacing: PropTypes.bool,
};

export default Badge;
```

## Key Guidelines

1. **Always include the file header** with the correct license information
2. **Group imports** in the specified order with comment separators
3. **Use function declarations** for component definitions
4. **Always include PropTypes** for all props, marking required ones appropriately
5. **Use descriptive prop names** that clearly indicate their purpose
6. **Follow consistent naming conventions** throughout the codebase

# JSDoc Documentation Standards

Site Kit maintains comprehensive JSDoc documentation for utility functions, hooks, and complex API functionality while relying on PropTypes for React component type documentation.

## JSDoc Usage Patterns

### File-Level Documentation

Every JavaScript file must include the standardized header format (same as component header):

```javascript
/**
 * [Component/Module Name] [component/utility/etc.]
 *
 * Site Kit by Google, Copyright [current year] Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
```

### Function Documentation Standards

All utility functions, hooks, and complex API functions should follow this pattern:

```javascript
/**
 * [Brief description of function purpose]
 *
 * @since n.e.x.t
 *
 * @param {type} paramName Description of parameter.
 * @param {type} [optionalParam] Description of optional parameter.
 * @return {type} Description of return value.
 */
function myFunction( paramName, optionalParam = defaultValue ) {
    // implementation
}
```

### Required JSDoc Tags

#### @since Tag
**Always required** - Documents when the feature was introduced, always use `n.e.x.t` value which will be replaced with the actual version later on.

```javascript
/**
 * Returns a callback to activate a module.
 *
 * @since n.e.x.t
 *
 * @param {string} moduleSlug Module slug.
 * @return {Function|null} Callback to activate module.
 */
```

#### @param Tag
**Required for all parameters** - Documents parameter types and descriptions:

```javascript
// Basic parameter
@param {string} dateRange The date range slug.

// Optional parameter with default
@param {boolean} [invertColor=false] Whether to reverse the +/- colors.

// Complex object parameter
@param {Object} options Configuration options.
@param {string} options.baseName The base name to use.
@param {Function} options.controlCallback Callback function to issue the API request.
@param {Function} [options.validateParams] Optional validation function.
```

#### @return Tag
**Required for functions that return values** - Documents return type and description:

```javascript
@return {Object} Partial store object with properties 'actions', 'controls', and 'reducer'.
@return {Function|null} Callback function or null if module doesn't exist.
@return {Array.<Object>} Array of widget objects.
```

### Complex Type Documentation

#### @typedef for Complex Data Structures

Use `@typedef` to define complex object structures:

```javascript
/**
 * Parse Analytics 4 report into data suitable for rendering.
 *
 * @typedef {Object} OverallPageMetricsData
 * @property {string}         metric          Google Analytics metric identifier.
 * @property {string}         title           Translated metric title.
 * @property {Array.<Object>} sparkLineData   Data for rendering the sparkline.
 * @property {string}         [datapointUnit] Optional datapoint unit, e.g. '%', 's'.
 * @property {number}         total           Total count for the metric.
 * @property {number}         change          Monthly change for the metric.
 *
 * @param {Object} report Raw Analytics report data.
 * @return {OverallPageMetricsData} Processed metrics data.
 */
function parseReportData( report ) {
    // implementation
}
```

#### Hook Documentation

Custom hooks require comprehensive JSDoc documentation:

```javascript
/**
 * Returns a callback to activate a module. If the call to activate the module
 * fails, an error will be returned to the returned callback.
 *
 * @since n.e.x.t
 *
 * @param {string} moduleSlug Module slug.
 * @return {Function|null} Callback to activate module, null if the module doesn't exist.
 */
export default function useActivateModuleCallback( moduleSlug ) {
    // hook implementation
}
```

### Utility Function Documentation

Utility functions require detailed documentation with examples for complex cases:

```javascript
/**
 * Creates a store object implementing the necessary infrastructure for making
 * asynchronous API requests and storing their data.
 *
 * @since n.e.x.t
 *
 * @param {Object}   args                   Arguments for creating the fetch store.
 * @param {string}   args.baseName          The base name to use for all actions.
 * @param {Function} args.controlCallback   Callback function to issue the API request.
 * @param {Function} [args.reducerCallback] Optional reducer to modify state.
 * @param {Function} [args.argsToParams]    Function that reduces argument list to params.
 * @param {Function} [args.validateParams]  Function that validates params before request.
 * @return {Object} Partial store object with properties 'actions', 'controls', and 'reducer'.
 */
export default function createFetchStore( {
    baseName,
    controlCallback,
    reducerCallback,
    argsToParams = ( ...args ) => args[ 0 ] || {},
    validateParams = () => {},
} ) {
    // implementation
}
```

## JSDoc Documentation Requirements

### Always Document
1. **Utility functions** - Complete JSDoc with all tags
2. **Custom hooks** - Full documentation with usage patterns
3. **API functions** - Detailed parameter and return documentation
4. **Complex algorithms** - Step-by-step documentation
5. **Public interfaces** - Complete interface documentation

### Conditionally Document
2. **Event handlers** - Document complex callback functions
3. **Internal helpers** - Document if logic is non-obvious

### Never Document (Use PropTypes Instead)
1. **Component props** - Use PropTypes for type checking
2. **Simple getters/setters** - Self-explanatory functions
3. **Trivial functions** - One-line utility functions

## Best Practices

### Parameter Documentation
1. **Use descriptive parameter names** in the function signature
2. **Document optional parameters** with bracket notation: `[optionalParam]`
3. **Include default values** in documentation: `[enabled=true]`
4. **Document object properties** when passing configuration objects

### Type Documentation
1. **Use specific types** instead of generic `Object` when possible
2. **Document array contents**: `Array.<string>` instead of `Array`
3. **Use union types**: `{Function|null}` for multiple possible types
4. **Create typedefs** for complex recurring data structures

### Version Tracking
1. **Always include @since** for new functions and significant changes using `n.e.x.t` value
3. **Document breaking changes** in function descriptions

### Consistency Rules
1. **Follow established patterns** for similar function types
2. **Use consistent terminology** across related functions
3. **Maintain uniform formatting** for JSDoc blocks
4. **Keep descriptions concise** but complete

# State Management Architecture

Site Kit uses a sophisticated state management system based on `@wordpress/data` (similar to Redux) with a modular datastore architecture.

## Overview

The state management follows a hierarchical structure:
- **Global Datastores**: Core functionality (`core/site`, `core/user`, `core/forms`)
- **Module Datastores**: Individual Google service modules (`modules/analytics-4`, `modules/adsense`, etc.)
- **Specialized Stores**: Settings, notifications, error handling

## Core Datastore Structure

### 1. Global Datastores

#### CORE_SITE (`core/site`)
Manages site-wide settings and information:

```javascript
/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';

// Using selectors in components
function MyComponent() {
    const dashboardURL = useSelect( ( select ) =>
        select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
    );
    
    const isGoogleTagGatewayEnabled = useSelect( ( select ) =>
        select( CORE_SITE ).isGoogleTagGatewayEnabled()
    );
    
    return <div>Dashboard URL: {dashboardURL}</div>;
}
```

#### CORE_USER (`core/user`)
Manages user-specific data and authentication:

```javascript
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';

function AuthenticatedComponent() {
    const isAuthenticated = useSelect( ( select ) =>
        select( CORE_USER ).isAuthenticated()
    );
    
    const keyMetrics = useSelect( ( select ) =>
        select( CORE_USER ).getKeyMetrics()
    );
    
    const { setKeyMetrics } = useDispatch( CORE_USER );
    
    if ( !isAuthenticated ) {
        return <div>Please authenticate</div>;
    }
    
    return (
        <div>
            User metrics: {keyMetrics?.length} items
            <button onClick={() => setKeyMetrics([])}>
                Reset Metrics
            </button>
        </div>
    );
}
```

### 2. Module Datastores

Each Google service module has its own datastore following a consistent pattern:

#### Module Store Structure
```javascript
// modules/analytics-4/datastore/base.js
import Modules from 'googlesitekit-modules';
import { MODULES_ANALYTICS_4 } from './constants';

const baseModuleStore = Modules.createModuleStore( MODULE_SLUG_ANALYTICS_4, {
    // Settings managed by this module
    settingSlugs: [
        'accountID',
        'propertyID', 
        'webDataStreamID',
        'measurementID',
        // ... more settings
    ],
    
    // Settings that cause the module owner change when saved by another admin
    ownedSettingsSlugs: [
        'accountID',
        'propertyID',
        'webDataStreamID',
        // ... owned settings
    ],
    
    // Custom validation and submission logic
    submitChanges,
    rollbackChanges,
    validateCanSubmitChanges,
    validateHaveSettingsChanged,
} );
```

#### Using Module Datastores in Components
```javascript
import { useSelect, useDispatch } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../modules/analytics-4/datastore/constants';

function AnalyticsSettings() {
    // Selectors: Reading data from the store
    const propertyID = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).getPropertyID()
    );
    
    const hasSettingsChanged = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).haveSettingsChanged()
    );
    
    const isDoingSaveSettings = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).isDoingSaveSettings()
    );
    
    // Actions: Dispatching changes to the store
    const { setPropertyID, saveSettings } = useDispatch( MODULES_ANALYTICS_4 );
    
    const handleSave = async () => {
        const { error } = await saveSettings();
        if ( error ) {
            // Handle error
        }
    };
    
    return (
        <div>
            <input 
                value={propertyID || ''} 
                onChange={(e) => setPropertyID(e.target.value)}
            />
            <button 
                onClick={handleSave}
                disabled={!hasSettingsChanged || isDoingSaveSettings}
            >
                {isDoingSaveSettings ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
}
```

## Settings Store Pattern

### Creating Settings Stores
Settings stores are created using the `createSettingsStore` factory:

```javascript
import { createSettingsStore } from '../../../googlesitekit/data/create-settings-store';

const settingsStore = createSettingsStore(
    'modules',        // type: 'core' or 'modules'
    'analytics-4',    // identifier: module slug
    'settings',       // datapoint: API endpoint
    {
        settingSlugs: [
            'accountID',
            'propertyID',
            'measurementID'
        ],
        ownedSettingsSlugs: [
            'accountID',
            'propertyID' 
        ]
    }
);
```

### Dynamic Selector and Action Generation

The `createSettingsStore` factory **dynamically generates selectors and actions** for each setting slug provided in the `settingSlugs` array. This uses case transformation utilities to create consistent naming patterns:

#### Case Transformations
- **camelCase** → **PascalCase**: `accountID` → `AccountID`
- **camelCase** → **CONSTANT_CASE**: `accountID` → `ACCOUNT_ID`

#### Generated Actions
For each setting slug (e.g., `'accountID'`), the factory creates:

```javascript
// Generated action: set + PascalCase
actions.setAccountID = ( value ) => {
    return {
        payload: { value },
        type: 'SET_ACCOUNT_ID',  // CONSTANT_CASE
    };
};

// Corresponding reducer
settingReducers['SET_ACCOUNT_ID'] = ( state, { payload } ) => {
    state.settings = {
        ...( state.settings || {} ),
        accountID: payload.value,  // Original camelCase
    };
};
```

#### Generated Selectors
For each setting slug, the factory creates:

```javascript
// Generated selector: get + PascalCase
selectors.getAccountID = createRegistrySelector(
    ( select ) => () => {
        const settings = select( STORE_NAME ).getSettings() || {};
        return settings.accountID;  // Original camelCase
    }
);
```

#### Example: Complete Dynamic Generation
Given `settingSlugs: ['accountID', 'propertyID', 'webDataStreamID']`, the factory generates:

**Actions:**
- `setAccountID( value )`
- `setPropertyID( value )`
- `setWebDataStreamID( value )`

**Selectors:**
- `getAccountID()`
- `getPropertyID()`
- `getWebDataStreamID()`

**Action Types:**
- `SET_ACCOUNT_ID`
- `SET_PROPERTY_ID`
- `SET_WEB_DATA_STREAM_ID`

### Settings Store Methods

#### Base Selectors (Always Available)
```javascript
// Get all settings
const settings = select( STORE_NAME ).getSettings();

// Check if any settings changed
const hasChanged = select( STORE_NAME ).haveSettingsChanged();

// Check specific setting change
const accountChanged = select( STORE_NAME ).hasSettingChanged( 'accountID' );

// Get owned settings slugs
const ownedSlugs = select( STORE_NAME ).getOwnedSettingsSlugs();

// Check if owned settings changed
const ownedChanged = select( STORE_NAME ).haveOwnedSettingsChanged();

// Check if saving is in progress
const isSaving = select( STORE_NAME ).isDoingSaveSettings();
```

#### Base Actions (Always Available)
```javascript
const { 
    setSettings,        // Set multiple settings at once
    saveSettings,       // Save all settings to server
    rollbackSettings,   // Revert all changes
    rollbackSetting,    // Revert specific setting
} = useDispatch( STORE_NAME );

// Set multiple settings
setSettings({ 
    accountID: 'GA_12345',
    propertyID: '67890' 
});

// Save to server
const { error } = await saveSettings();

// Revert all changes
rollbackSettings();

// Revert specific setting
rollbackSetting( 'accountID' );
```

#### Dynamic Actions (Generated per Setting)
```javascript
const { 
    setAccountID,       // Generated for 'accountID'
    setPropertyID,      // Generated for 'propertyID'
    setMeasurementID,   // Generated for 'measurementID'
} = useDispatch( STORE_NAME );

// Set individual settings using generated actions
setAccountID( 'GA_12345' );
setPropertyID( '67890' );
```

#### Dynamic Selectors (Generated per Setting)
```javascript
// Get individual settings using generated selectors
const accountID = useSelect( ( select ) =>
    select( STORE_NAME ).getAccountID()
);

const propertyID = useSelect( ( select ) =>
    select( STORE_NAME ).getPropertyID()
);

const measurementID = useSelect( ( select ) =>
    select( STORE_NAME ).getMeasurementID()
);
```

## Fetch Store Pattern

### Creating Fetch Stores
Fetch stores handle asynchronous API operations and are created using the `createFetchStore` factory:

```javascript
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetSettingsStore = createFetchStore( {
    baseName: 'getSettings',
    controlCallback: () => {
        return get( 'modules', 'analytics-4', 'settings', {}, {
            useCache: false,
        } );
    },
    reducerCallback: createReducer( ( state, settings ) => {
        state.settings = { ...settings };
    } ),
} );

const fetchSaveSettingsStore = createFetchStore( {
    baseName: 'saveSettings',
    controlCallback: ( params ) => {
        return set( 'modules', 'analytics-4', 'settings', params.values );
    },
    reducerCallback: createReducer( ( state, settings ) => {
        state.settings = { ...settings };
    } ),
    argsToParams: ( values ) => ({ values }),
    validateParams: ( { values } ) => {
        invariant( isPlainObject( values ), 'values is required.' );
    },
} );
```

### Dynamic Generation by createFetchStore

The `createFetchStore` factory **dynamically generates actions, selectors, and controls** based on the `baseName` parameter:

#### Generated Names Pattern
For `baseName: 'getSettings'`:
- **Action**: `fetchGetSettings()`
- **Receive Action**: `receiveGetSettings()`
- **Selector**: `isFetchingGetSettings()`
- **Control**: `FETCH_GET_SETTINGS`

#### Case Transformations in Fetch Stores
- **camelCase** → **PascalCase**: `getSettings` → `GetSettings`
- **camelCase** → **CONSTANT_CASE**: `getSettings` → `GET_SETTINGS`

#### Generated Actions
```javascript
// Generated fetch action: fetch + PascalCase
actions.fetchGetSettings = function* ( ...args ) {
    const params = argsToParams( ...args );
    validateParams( params );
    
    // Start fetch (sets loading state)
    yield { type: 'START_FETCH_GET_SETTINGS', payload: { params } };
    
    // Clear any previous errors
    yield clearError( 'getSettings', args );
    
    try {
        // Call the control to make API request
        const response = yield { type: 'FETCH_GET_SETTINGS', payload: { params } };
        
        // Store the response
        yield actions.receiveGetSettings( response, params );
        
        // Finish fetch (clear loading state)
        yield { type: 'FINISH_FETCH_GET_SETTINGS', payload: { params } };
    } catch ( error ) {
        // Handle error
        yield receiveError( error, 'getSettings', args );
        yield { type: 'CATCH_FETCH_GET_SETTINGS', payload: { params } };
    }
    
    return { response, error };
};

// Generated receive action: receive + PascalCase
actions.receiveGetSettings = ( response, params ) => {
    return {
        type: 'RECEIVE_GET_SETTINGS',
        payload: { response, params }
    };
};
```

#### Generated Selectors
```javascript
// Generated loading selector: isFetching + PascalCase
selectors.isFetchingGetSettings = ( state, ...args ) => {
    if ( state.isFetchingGetSettings === undefined ) {
        return false;
    }
    
    const params = argsToParams( ...args );
    return !! state.isFetchingGetSettings[ stringifyObject( params ) ];
};
```

#### Generated Controls
```javascript
controls.FETCH_GET_SETTINGS = ( { payload } ) => {
    return controlCallback( payload.params );
};
```

### Loading State Management

Fetch stores automatically manage loading states for each unique parameter combination:

```javascript
// Different parameter combinations have separate loading states
const isLoadingSettings = useSelect( ( select ) =>
    select( STORE_NAME ).isFetchingGetSettings()
);

const isLoadingReport = useSelect( ( select ) =>
    select( STORE_NAME ).isFetchingGetReport( startDate, endDate, metrics )
);

// Each combination of parameters gets its own loading state
const isLoadingUserReport = useSelect( ( select ) =>
    select( STORE_NAME ).isFetchingGetReport( startDate, endDate, 'sessions', 'user' )
);
```

### Fetch Store Usage in Regular Datastores

Fetch stores are typically used within regular datastore actions and resolvers:

#### In Actions
```javascript
const actions = {
    *setShowAdminBar( enabled ) {
        // Use the generated fetch action from fetchSetAdminBarSettingsStore
        const { response, error } = yield fetchSetAdminBarSettingsStore.actions.fetchSetAdminBarSettings( { enabled } );
        return { response, error };
    },
};
```

#### In Resolvers
```javascript
const resolvers = {
    *getSettings() {
        const registry = yield commonActions.getRegistry();
        const existingSettings = registry.select( STORE_NAME ).getSettings();
        
        // Only fetch if settings don't exist
        if ( ! existingSettings ) {
            // Use the generated fetch action from fetchGetSettingsStore
            yield fetchGetSettingsStore.actions.fetchGetSettings();
        }
    },
};
```

#### Combined in Settings Stores
```javascript
// Settings stores automatically combine fetch stores
const store = combineStores(
    commonStore,
    fetchGetSettingsStore,    // Provides: fetchGetSettings, isFetchingGetSettings
    fetchSaveSettingsStore,   // Provides: fetchSaveSettings, isFetchingSaveSettings
    {
        initialState,
        actions,
        controls,
        reducer,
        resolvers,
        selectors,
    }
);
```

### Parameter Handling

Fetch stores handle parameters through `argsToParams` and `validateParams`:

```javascript
const fetchStore = createFetchStore( {
    baseName: 'getReport',
    controlCallback: ( { startDate, endDate, metrics } ) => {
        return get( 'modules', 'analytics-4', 'report', {
            startDate,
            endDate,
            metrics
        } );
    },
    // Transform function arguments to parameter object
    argsToParams: ( startDate, endDate, metrics = [] ) => {
        return { startDate, endDate, metrics };
    },
    // Validate parameters before making request
    validateParams: ( { startDate, endDate, metrics } ) => {
        invariant( startDate, 'startDate is required' );
        invariant( endDate, 'endDate is required' );
        invariant( Array.isArray( metrics ), 'metrics must be an array' );
    },
} );
```

#### Usage with Parameters
```javascript
// Call with parameters
const { response, error } = yield actions.fetchGetReport( 
    '2024-01-01', 
    '2024-01-31', 
    ['sessions', 'users'] 
);

// Check loading state for specific parameters
const isLoading = select( STORE_NAME ).isFetchingGetReport( 
    '2024-01-01', 
    '2024-01-31', 
    ['sessions', 'users'] 
);
```

## Additional Store Factories

### Error Store Factory

The `createErrorStore` factory provides centralized error handling for any datastore:

```javascript
import { createErrorStore } from '../../../googlesitekit/data/create-error-store';

// Create error store for a specific store
const errorStore = createErrorStore( STORE_NAME );

// Combine with other stores
const store = combineStores(
    settingsStore,
    errorStore,    // Provides error handling functionality
    // ... other stores
);
```

#### Error Store API

**Actions:**
```javascript
const { receiveError, clearError, clearErrors } = useDispatch( STORE_NAME );

// Store an error for a specific selector/action
receiveError( error, 'getSettings', [] );

// Clear specific error
clearError( 'getSettings', [] );

// Clear all errors for a base name
clearErrors( 'getSettings' );
```

**Selectors:**
```javascript
// Get error for specific selector with args
const error = useSelect( ( select ) =>
    select( STORE_NAME ).getErrorForSelector( 'getSettings', [] )
);

// Get error for specific action with args
const actionError = useSelect( ( select ) =>
    select( STORE_NAME ).getErrorForAction( 'saveSettings', [ values ] )
);

// Get all unique errors
const errors = useSelect( ( select ) =>
    select( STORE_NAME ).getErrors()
);

// Check if store has any errors
const hasErrors = useSelect( ( select ) =>
    select( STORE_NAME ).hasErrors()
);

// Get metadata for an error (baseName and args)
const errorMeta = useSelect( ( select ) =>
    select( STORE_NAME ).getMetaDataForError( error )
);

// Get selector data for error retry functionality
const selectorData = useSelect( ( select ) =>
    select( STORE_NAME ).getSelectorDataForError( error )
);
```

#### Error Key Generation
Errors are stored using MD5 hashes of the baseName and arguments:

```javascript
// Error keys generated automatically
const key = generateErrorKey( 'getReport', [ startDate, endDate, metrics ] );
// Results in: 'getReport::a1b2c3d4e5f6...'
```

### Existing Tag Store Factory

The `createExistingTagStore` factory detects existing tracking tags on a website:

```javascript
import { createExistingTagStore } from '../../../googlesitekit/data/create-existing-tag-store';

const existingTagStore = createExistingTagStore( {
    storeName: STORE_NAME,
    tagMatchers: [
        /gtag\('config',\s*'GA_MEASUREMENT_ID-[^']*'\)/,
        /ga\('create',\s*'UA-[^']*'\)/,
    ],
    isValidTag: ( tag ) => {
        return tag && tag.includes( 'GA_MEASUREMENT_ID' );
    },
} );
```

#### Existing Tag Store API

**Actions:**
```javascript
const { fetchGetExistingTag, receiveGetExistingTag } = useDispatch( STORE_NAME );

// Manually trigger tag detection
const existingTag = await fetchGetExistingTag();

// Store a detected tag
receiveGetExistingTag( 'GA_MEASUREMENT_ID-XXXXXXXX' );
```

**Selectors:**
```javascript
// Get the existing tag (string, null, or undefined)
const existingTag = useSelect( ( select ) =>
    select( STORE_NAME ).getExistingTag()
);

// Check if an existing tag is present
const hasExistingTag = useSelect( ( select ) =>
    select( STORE_NAME ).hasExistingTag()
);
```

#### Tag Detection Process
1. Gets home URL and AMP mode from site store
2. Generates list of URLs to check for tags
3. Fetches HTML content for each URL
4. Uses provided `tagMatchers` regex patterns to find tags
5. Validates found tags with `isValidTag` function
6. Returns first valid tag found or null

### Notifications Store Factory

The `createNotificationsStore` factory manages server-side notifications:

```javascript
import { createNotificationsStore } from '../../../googlesitekit/data/create-notifications-store';

const notificationsStore = createNotificationsStore(
    'modules',           // type: 'core' or 'modules'
    'analytics-4',       // identifier: module slug
    'notifications',     // datapoint: API endpoint
    {
        server: true,    // Enable server notifications (default: true)
        storeName: 'custom-store-name'  // Optional custom store name
    }
);
```

#### Notifications Store API

**Selectors:**
```javascript
// Get all notifications (array or undefined if not loaded)
const notifications = useSelect( ( select ) =>
    select( STORE_NAME ).getNotifications()
);
```

**Auto-resolvers:**
The store automatically fetches notifications when `getNotifications()` is called and no notifications exist.

#### Internal Structure
```javascript
// Notifications are stored as objects with IDs as keys
state.serverNotifications = {
    'notification-1': { id: 'notification-1', message: 'Setup required', type: 'warning' },
    'notification-2': { id: 'notification-2', message: 'Connected successfully', type: 'success' },
};

// getNotifications() returns array of notification objects
const notifications = Object.values( state.serverNotifications );
```

### Snapshot Store Factory

The `createSnapshotStore` factory provides state persistence across page reloads:

```javascript
import { createSnapshotStore } from '../../../googlesitekit/data/create-snapshot-store';

const snapshotStore = createSnapshotStore( STORE_NAME );

// Combine with other stores to enable snapshotting
const store = combineStores(
    settingsStore,
    snapshotStore,    // Adds snapshot functionality
    // ... other stores
);
```

#### Snapshot Store API

**Actions:**
```javascript
const { 
    createSnapshot, 
    restoreSnapshot, 
    deleteSnapshot 
} = useDispatch( STORE_NAME );

// Create a snapshot of current state
const success = await createSnapshot();

// Restore state from snapshot (clears snapshot by default)
const restored = await restoreSnapshot();

// Restore state without clearing snapshot
const restored = await restoreSnapshot( { clearAfterRestore: false } );

// Delete existing snapshot
const deleted = await deleteSnapshot();
```

#### Snapshot Lifecycle
1. **Create**: Saves current store state to browser cache with 1-hour TTL
2. **Restore**: Loads state from cache and applies to store, excluding errors
3. **Delete**: Removes snapshot from cache

#### Global Snapshot Utilities
```javascript
import { 
    snapshotAllStores, 
    restoreAllSnapshots, 
    getStoresWithSnapshots 
} from '../../../googlesitekit/data/create-snapshot-store';

// Create snapshots for all supporting stores
await snapshotAllStores();

// Restore all available snapshots
await restoreAllSnapshots();

// Get list of stores that support snapshots
const storesWithSnapshots = getStoresWithSnapshots();
```

### createReducer Utility

The `createReducer` utility enables immutable state updates using Immer:

```javascript
import { createReducer } from '../../../googlesitekit/data/create-reducer';

// Create an Immer-enabled reducer
const reducer = createReducer( ( state, { type, payload } ) => {
    switch ( type ) {
        case 'SET_SETTING':
            // Mutate state directly - Immer handles immutability
            state.settings[ payload.key ] = payload.value;
            break;
            
        case 'ADD_ITEM':
            // Push to arrays directly
            state.items.push( payload.item );
            break;
            
        case 'UPDATE_NESTED':
            // Nested updates work naturally
            state.nested.deep.property = payload.value;
            break;
    }
} );
```

#### Benefits of createReducer
1. **Immutable Updates**: Immer automatically creates immutable copies
2. **Simpler Syntax**: Write mutations like normal JavaScript
3. **Performance**: Efficient structural sharing under the hood
4. **Type Safety**: Better TypeScript support with draft state

#### Without createReducer (Traditional Redux)
```javascript
// Traditional Redux reducer - verbose and error-prone
function reducer( state = initialState, { type, payload } ) {
    switch ( type ) {
        case 'SET_SETTING':
            return {
                ...state,
                settings: {
                    ...state.settings,
                    [ payload.key ]: payload.value,
                }
            };
        case 'ADD_ITEM':
            return {
                ...state,
                items: [ ...state.items, payload.item ]
            };
    }
}
```

#### With createReducer (Immer-enabled)
```javascript
// Immer-enabled reducer - clean and simple
const reducer = createReducer( ( state, { type, payload } ) => {
    switch ( type ) {
        case 'SET_SETTING':
            state.settings[ payload.key ] = payload.value;
            break;
        case 'ADD_ITEM':
            state.items.push( payload.item );
            break;
    }
} );
```

## Factory Integration Patterns

### Combining Multiple Factories
Most Site Kit datastores combine several factories:

```javascript
import { combineStores } from 'googlesitekit-data';
import { createSettingsStore } from '../../../googlesitekit/data/create-settings-store';
import { createErrorStore } from '../../../googlesitekit/data/create-error-store';
import { createNotificationsStore } from '../../../googlesitekit/data/create-notifications-store';
import { createSnapshotStore } from '../../../googlesitekit/data/create-snapshot-store';

const settingsStore = createSettingsStore( 'modules', 'analytics-4', 'settings', {
    settingSlugs: [ 'accountID', 'propertyID' ]
} );

const notificationsStore = createNotificationsStore( 'modules', 'analytics-4', 'notifications' );

const errorStore = createErrorStore( STORE_NAME );

const snapshotStore = createSnapshotStore( STORE_NAME );

// Combine all stores
const store = combineStores(
    settingsStore,        // Settings management
    notificationsStore,   // Server notifications
    errorStore,          // Error handling
    snapshotStore,       // State persistence
    {
        // Custom store additions
        initialState: customInitialState,
        actions: customActions,
        selectors: customSelectors,
    }
);
```

### Factory Usage in Components
```javascript
function AnalyticsSettingsComponent() {
    // Settings store selectors and actions
    const accountID = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).getAccountID()
    );
    
    const { setAccountID, saveSettings } = useDispatch( MODULES_ANALYTICS_4 );
    
    // Error store selectors and actions
    const saveError = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).getErrorForAction( 'saveSettings', [] )
    );
    
    const { clearError } = useDispatch( MODULES_ANALYTICS_4 );
    
    // Notifications store selectors
    const notifications = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).getNotifications()
    );
    
    // Snapshot store actions
    const { createSnapshot, restoreSnapshot } = useDispatch( MODULES_ANALYTICS_4 );
    
    return (
        <div>
            {/* Settings UI */}
            <input 
                value={accountID || ''} 
                onChange={(e) => setAccountID(e.target.value)}
            />
            
            {/* Error handling */}
            {saveError && (
                <div>
                    Error: {saveError.message}
                    <button onClick={() => clearError( 'saveSettings', [] )}>
                        Dismiss
                    </button>
                </div>
            )}
            
            {/* Notifications */}
            {notifications?.map( notification => (
                <div key={notification.id}>{notification.message}</div>
            ))}
            
            {/* Actions */}
            <button onClick={() => createSnapshot()}>Save Draft</button>
            <button onClick={() => restoreSnapshot()}>Restore Draft</button>
        </div>
    );
}
```

## Advanced Patterns

### Custom Validation
Modules can provide custom validation logic:

```javascript
export function validateCanSubmitChanges( select ) {
    const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();
    
    invariant( 
        isValidPropertySelection( propertyID ),
        'a valid propertyID is required to submit changes'
    );
}

export function validateHaveSettingsChanged( select, state, keys ) {
    const { settings, savedSettings } = state;
    const hasExternalChanges = select( CORE_SITE ).haveSettingsChanged();
    
    invariant(
        !isEqual( settings, savedSettings ) || hasExternalChanges,
        'no settings have changed'
    );
}
```

### Complex Submission Logic
```javascript
export async function submitChanges( { dispatch, select, resolveSelect } ) {
    // Create property if needed
    let propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();
    if ( propertyID === PROPERTY_CREATE ) {
        const { response: property, error } = await dispatch(
            MODULES_ANALYTICS_4
        ).createProperty( accountID );
        
        if ( error ) {
            return { error };
        }
        
        propertyID = property._id;
        dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );
    }
    
    // Save settings
    const { error } = await dispatch( MODULES_ANALYTICS_4 ).saveSettings();
    if ( error ) {
        return { error };
    }
    
    // Invalidate cache
    await invalidateCache( 'modules', MODULE_SLUG_ANALYTICS_4 );
    
    return {};
}
```

### Registry Selectors
For cross-store data access:

```javascript
import { createRegistrySelector } from 'googlesitekit-data';

const selectors = {
    // Access multiple stores
    getConnectedServices: createRegistrySelector( ( select ) => () => {
        const isAnalyticsConnected = select( MODULES_ANALYTICS_4 ).isConnected();
        const isAdSenseConnected = select( MODULES_ADSENSE ).isConnected();
        
        return {
            analytics: isAnalyticsConnected,
            adsense: isAdSenseConnected
        };
    } ),
    
    // Computed values from multiple sources
    hasRequiredPermissions: createRegistrySelector( 
        ( select ) => ( state, moduleSlug ) => {
            const userPermissions = select( CORE_USER ).getPermissions();
            const modulePermissions = select( `modules/${moduleSlug}` ).getRequiredScopes();
            
            return modulePermissions.every( scope => 
                userPermissions.includes( scope )
            );
        }
    )
};
```

## Common Datastore Patterns

### Error Handling
```javascript
import { useSelect } from 'googlesitekit-data';

function ComponentWithErrorHandling() {
    const error = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [ args ] )
    );
    
    const { clearError } = useDispatch( MODULES_ANALYTICS_4 );
    
    if ( error ) {
        return (
            <div>
                Error: {error.message}
                <button onClick={() => clearError( 'getReport', [ args ] )}>
                    Retry
                </button>
            </div>
        );
    }
    
    return <div>Component content</div>;
}
```

### Loading States
```javascript
function ComponentWithLoading() {
    const isLoading = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).isFetchingGetSettings()
    );
    
    const settings = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).getSettings()
    );
    
    if ( isLoading ) {
        return <div>Loading...</div>;
    }
    
    return <div>Settings: {JSON.stringify(settings)}</div>;
}
```

## Best Practices

1. **Always use useSelect and useDispatch hooks** for datastore access
2. **Import store constants** from the appropriate constants file
3. **Handle loading and error states** in components
4. **Use createRegistrySelector** when accessing multiple stores
5. **Follow naming conventions**: `get*`, `set*`, `have*Changed`, `isDoingSave*`
6. **Validate data** before submission using custom validation functions
7. **Clear errors** after successful operations or user actions
8. **Use invariant assertions** for development-time validation
9. **Batch related state changes** when possible
10. **Handle async operations** properly with error checking

# Widgets API Architecture

Site Kit uses a sophisticated three-tier widget system for building modular, dynamic dashboard interfaces.

## Overview

The widgets system follows a hierarchical structure:
- **Contexts**: Top-level containers that define dashboard sections
- **Areas**: Subsections within contexts that group related widgets
- **Widgets**: Individual components that display specific data or functionality

## Widget System Architecture

### Three-Tier Hierarchy

#### 1. Contexts
Contexts represent major dashboard sections or pages:

```javascript
// Widget contexts are the highest level containers
const contextSlug = 'googlesitekit-dashboard-view-only';
const contextSlug = 'googlesitekit-dashboard';
const contextSlug = 'googlesitekit-module-page-analytics-4';
```

#### 2. Areas
Areas are subsections within contexts that group related widgets:

```javascript
// Widget areas group widgets within a context
const areaSlug = 'googlesitekit-dashboard-header';
const areaSlug = 'googlesitekit-dashboard-traffic';
const areaSlug = 'googlesitekit-dashboard-monetization';
```

#### 3. Widgets
Individual components that render specific data:

```javascript
// Individual widgets display specific metrics or functionality
const widgetSlug = 'analyticsAllTraffic';
const widgetSlug = 'adsenseTopEarningContent';
const widgetSlug = 'searchConsolePopularKeywords';
```

## Widget Registration System

### Widget Registration

Widgets are registered using the `registerWidget` action:

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';

...

const { registerWidget } = useDispatch( CORE_WIDGETS );

registerWidget(
    'analyticsPopularContent',  // Widget slug
    {
        Component: PopularContentWidget,        // React component
        priority: 10,                          // Display priority (lower = higher priority)
        width: WIDGET_WIDTHS.HALF,            // Width: QUARTER, HALF, FULL
        wrapWidget: true,                     // Whether to wrap with Widget component
        modules: ['analytics-4'],             // Associated modules
        isActive: ( select ) => {             // Activation callback
            return select( MODULES_ANALYTICS_4 ).isConnected();
        },
        isPreloaded: ( select ) => {          // Preload callback (requires isActive)
            return select( MODULES_ANALYTICS_4 ).hasDataForLastMonth();
        },
        hideOnBreakpoints: [                  // Hide on specific screen sizes
            BREAKPOINT_SMALL,
            BREAKPOINT_TABLET
        ]
    }
);
```

### Widget Area Registration

Widget areas are registered using the `registerWidgetArea` action:

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_WIDGETS, WIDGET_AREA_STYLES } from '../../googlesitekit/widgets/datastore/constants';

...

const { registerWidgetArea } = useDispatch( CORE_WIDGETS );

registerWidgetArea(
    'googlesitekit-dashboard-traffic',  // Area slug
    {
        title: 'Traffic insights',         // Area title
        subtitle: 'How your users found your site',  // Subtitle
        Icon: TrafficIcon,                 // Icon component
        style: WIDGET_AREA_STYLES.BOXES,  // BOXES or COMPOSITE
        priority: 20,                     // Display priority
        hasNewBadge: false,               // Show "new" badge
        CTA: TrafficCTAComponent,         // Call-to-action component
        Footer: TrafficFooterComponent,   // Footer component
        filterActiveWidgets: ( select, widgets ) => {  // Custom filtering
            return widgets.filter( widget => 
                select( MODULES_ANALYTICS_4 ).hasDataForWidget( widget.slug )
            );
        }
    }
);
```

### Widget Assignment to Areas

Widgets are assigned to areas using the `assignWidget` action:

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';

...

const { assignWidget } = useDispatch( CORE_WIDGETS );

// Assign single widget to single area
assignWidget( 'analyticsPopularContent', 'googlesitekit-dashboard-traffic' );

// Assign single widget to multiple areas
assignWidget( 'analyticsPopularContent', [
    'googlesitekit-dashboard-traffic',
    'googlesitekit-module-analytics-4-main'
] );
```

### Widget Area Assignment to Contexts

Areas are assigned to contexts using the `assignWidgetArea` action:

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';

...

const { assignWidgetArea } = useDispatch( CORE_WIDGETS );

// Assign area to context
assignWidgetArea( 'googlesitekit-dashboard-traffic', 'googlesitekit-dashboard' );

// Assign area to multiple contexts
assignWidgetArea( 'googlesitekit-dashboard-traffic', [
    'googlesitekit-dashboard',
    'googlesitekit-dashboard-view-only'
] );
```

## Widget Component Structure

### Basic Widget Component

```javascript
/**
 * PopularContentWidget component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

function PopularContentWidget( props ) {
    const { Widget } = props;  // Widget wrapper component passed automatically
    
    // Use data selectors to fetch required data
    const reportOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        metrics: ['screenPageViews'],
        dimensions: ['pagePath']
    };
    
    const report = useInViewSelect(
        ( select ) => select( MODULES_ANALYTICS_4 ).getReport( reportOptions ),
        [ reportOptions ]
    );
    
    const loading = useSelect( ( select ) =>
        ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [ reportOptions ] )
    );
    
    const error = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [ reportOptions ] )
    );
    
    // Handle loading state
    if ( loading ) {
        return <Widget>Loading...</Widget>;
    }
    
    // Handle error state
    if ( error ) {
        return <Widget>Error: {error.message}</Widget>;
    }
    
    // Render widget content
    return (
        <Widget>
            <h3>Popular Content</h3>
            {/* Widget content */}
        </Widget>
    );
}

PopularContentWidget.propTypes = {
    Widget: PropTypes.elementType.isRequired,  // Always required
};

// Use whenActive HOC to show fallback when module is not connected
export default whenActive( {
    moduleName: 'analytics-4',
    FallbackComponent: ConnectGA4CTATileWidget,
} )( PopularContentWidget );
```

### Widget Props Interface

All widget components receive standardized props via `getWidgetComponentProps`:

```javascript
// Props automatically passed to widget components
const widgetProps = {
    widgetSlug: 'analyticsPopularContent',           // The widget's slug
    Widget: Widget,                                  // Base Widget wrapper component
    WidgetReportZero: WidgetReportZero,             // Zero-data state component
    WidgetReportError: WidgetReportError,           // Error state component
    WidgetNull: WidgetNull,                         // Null/hidden state component
    WidgetRecoverableModules: WidgetRecoverableModules,  // Recovery component
};

// These components are automatically scoped to the widget slug
function MyWidget( { Widget, WidgetReportZero, WidgetReportError, widgetSlug } ) {
    const hasData = useSelect( ( select ) => 
        select( MODULES_ANALYTICS_4 ).hasDataForWidget( widgetSlug )
    );
    
    if ( !hasData ) {
        return <WidgetReportZero />;  // Automatically includes widgetSlug
    }
    
    return (
        <Widget>  {/* Automatically includes widgetSlug */}
            Widget content
        </Widget>
    );
}
```

### Higher-Order Components for Widgets

#### withWidgetComponentProps
Automatically injects widget props:

```javascript
import { withWidgetComponentProps } from '../../../googlesitekit/widgets/util';

function BasicWidget( { Widget, WidgetReportError, widgetSlug } ) {
    return <Widget>Content for {widgetSlug}</Widget>;
}

export default withWidgetComponentProps( 'analyticsPopularContent' )( BasicWidget );
```

#### whenActive
Shows widget only when associated module is active:

```javascript
import whenActive from '../../../util/when-active';
import ConnectAnalyticsCTA from './ConnectAnalyticsCTA';

function AnalyticsWidget( props ) {
    // Only rendered when Analytics is connected
    return <div>Analytics data</div>;
}

export default whenActive( {
    moduleName: 'analytics-4',
    FallbackComponent: ConnectAnalyticsCTA,  // Shown when module inactive
} )( AnalyticsWidget );
```

## Widget Rendering System

### Context Renderer

The `WidgetContextRenderer` renders an entire context with its areas and widgets:

```javascript
import WidgetContextRenderer from '../../../googlesitekit/widgets/components/WidgetContextRenderer';

function DashboardPage() {
    return (
        <div className="googlesitekit-dashboard">
            <WidgetContextRenderer
                id="googlesitekit-dashboard-main"
                slug="googlesitekit-dashboard"
                className="dashboard-context"
                Header={ DashboardHeader }     // Optional header component
                Footer={ DashboardFooter }     // Optional footer component
            />
        </div>
    );
}
```

### Area Renderer

The `WidgetAreaRenderer` renders a specific widget area:

```javascript
import WidgetAreaRenderer from '../../../googlesitekit/widgets/components/WidgetAreaRenderer';

function CustomArea() {
    return (
        <WidgetAreaRenderer
            slug="googlesitekit-dashboard-traffic"
            contextID="googlesitekit-dashboard-main"
        />
    );
}
```

### Widget Renderer

Individual widgets are rendered through the `WidgetRenderer`:

```javascript
import WidgetRenderer from '../../../googlesitekit/widgets/components/WidgetRenderer';

function SingleWidget() {
    return (
        <WidgetRenderer
            slug="analyticsPopularContent"
            OverrideComponent={ CustomContentComponent }  // Optional override
        />
    );
}
```

## Widget State Management

### Widget Activation

Widgets can be conditionally active based on various factors:

```javascript
// Widget registration with activation logic
registerWidget( 'analyticsPopularContent', {
    Component: PopularContentWidget,
    isActive: ( select ) => {
        const isConnected = select( MODULES_ANALYTICS_4 ).isConnected();
        const hasData = select( MODULES_ANALYTICS_4 ).hasReportData();
        return isConnected && hasData;
    },
    isPreloaded: ( select ) => {
        // Preload widget data even if not active (requires isActive)
        return select( MODULES_ANALYTICS_4 ).shouldPreloadData();
    }
} );
```

### Widget State Actions

Widgets can set temporary state for special rendering:

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_WIDGETS } from '../../../googlesitekit/widgets/datastore/constants';

function WidgetWithState() {
    const { setWidgetState, unsetWidgetState } = useDispatch( CORE_WIDGETS );
    
    const handleShowDetails = () => {
        // Set widget to show detailed view
        setWidgetState( 
            'analyticsPopularContent',      // Widget slug
            DetailedViewComponent,          // Component to render
            { expanded: true }              // Metadata
        );
    };
    
    const handleHideDetails = () => {
        // Unset widget state (returns to normal rendering)
        unsetWidgetState( 
            'analyticsPopularContent',
            DetailedViewComponent,
            { expanded: true }
        );
    };
    
    return (
        <div>
            <button onClick={ handleShowDetails }>Show Details</button>
            <button onClick={ handleHideDetails }>Hide Details</button>
        </div>
    );
}
```

### Widget State Selectors

Query widget state and activity:

```javascript
import { useSelect } from 'googlesitekit-data';
import { CORE_WIDGETS } from '../../../googlesitekit/widgets/datastore/constants';

function WidgetStateExample() {
    // Check if widget is active
    const isActive = useSelect( ( select ) =>
        select( CORE_WIDGETS ).isWidgetActive( 'analyticsPopularContent' )
    );
    
    // Check if widget is registered
    const isRegistered = useSelect( ( select ) =>
        select( CORE_WIDGETS ).isWidgetRegistered( 'analyticsPopularContent' )
    );
    
    // Check if widget is preloaded
    const isPreloaded = useSelect( ( select ) =>
        select( CORE_WIDGETS ).isWidgetPreloaded( 'analyticsPopularContent' )
    );
    
    // Get widget configuration
    const widget = useSelect( ( select ) =>
        select( CORE_WIDGETS ).getWidget( 'analyticsPopularContent' )
    );
    
    // Get widget's current state (if any)
    const widgetState = useSelect( ( select ) =>
        select( CORE_WIDGETS ).getWidgetState( 'analyticsPopularContent' )
    );
    
    return (
        <div>
            <p>Active: {isActive ? 'Yes' : 'No'}</p>
            <p>Preloaded: {isPreloaded ? 'Yes' : 'No'}</p>
            {widgetState && <p>Special state: {widgetState.Component.name}</p>}
        </div>
    );
}
```

## Widget Layout System

### Widget Widths

Widgets can specify their width requirements:

```javascript
import { WIDGET_WIDTHS } from '../../../googlesitekit/widgets/datastore/constants';

registerWidget( 'analyticsPopularContent', {
    Component: PopularContentWidget,
    width: WIDGET_WIDTHS.QUARTER,    // QUARTER, HALF, FULL
    // OR array for responsive widths
    width: [ WIDGET_WIDTHS.HALF, WIDGET_WIDTHS.QUARTER ]
} );
```

### Widget Area Styles

Areas can use different layout styles:

```javascript
import { WIDGET_AREA_STYLES } from '../../../googlesitekit/widgets/datastore/constants';

registerWidgetArea( 'dashboard-main', {
    title: 'Main Dashboard',
    style: WIDGET_AREA_STYLES.BOXES,      // Individual boxes
    // OR
    style: WIDGET_AREA_STYLES.COMPOSITE   // Unified composite area
} );
```

### Responsive Behavior

Widgets can be hidden on specific breakpoints:

```javascript
import { 
    BREAKPOINT_SMALL, 
    BREAKPOINT_TABLET,
    BREAKPOINT_DESKTOP,
    BREAKPOINT_XLARGE 
} from '../../../hooks/useBreakpoint';

registerWidget( 'detailedAnalytics', {
    Component: DetailedAnalyticsWidget,
    hideOnBreakpoints: [
        BREAKPOINT_SMALL,    // Hide on mobile
        BREAKPOINT_TABLET    // Hide on tablet
    ]
} );
```

## Advanced Widget Patterns

### Module-Based Filtering

Filter widgets by associated modules:

```javascript
// Get widgets for specific modules only
const analyticsWidgets = useSelect( ( select ) =>
    select( CORE_WIDGETS ).getWidgets( 'dashboard-main', {
        modules: ['analytics-4', 'search-console']
    } )
);

// Check if area is active for specific modules
const isActiveForModules = useSelect( ( select ) =>
    select( CORE_WIDGETS ).isWidgetAreaActive( 'dashboard-main', {
        modules: ['analytics-4']
    } )
);
```

### Custom Widget Filtering

Areas can implement custom widget filtering:

```javascript
registerWidgetArea( 'conditional-area', {
    title: 'Conditional Widgets',
    filterActiveWidgets: ( select, widgets ) => {
        // Only show widgets that have recent data
        return widgets.filter( widget => {
            const hasRecentData = select( `modules/${widget.modules[0]}` )
                .hasDataForLastWeek();
            return hasRecentData;
        } );
    }
} );
```

### Error Boundary Integration

Widgets are automatically wrapped with error boundaries:

```javascript
import WidgetErrorHandler from '../../../components/WidgetErrorHandler';

// Widgets are automatically wrapped like this:
function WidgetWithErrorBoundary( { slug } ) {
    return (
        <WidgetErrorHandler slug={ slug }>
            <WidgetRenderer slug={ slug } />
        </WidgetErrorHandler>
    );
}
```

### View-Only Dashboard Support

Widgets automatically adapt to view-only mode:

```javascript
import useViewOnly from '../../../hooks/useViewOnly';

function ResponsiveWidget( { Widget } ) {
    const viewOnlyDashboard = useViewOnly();
    
    // Get viewable modules in view-only mode
    const viewableModules = useSelect( ( select ) => {
        if ( ! viewOnlyDashboard ) {
            return null;
        }
        return select( CORE_USER ).getViewableModules();
    } );
    
    if ( viewOnlyDashboard && ! viewableModules?.includes( 'analytics-4' ) ) {
        return <Widget>Not available in view-only mode</Widget>;
    }
    
    return <Widget>Full widget content</Widget>;
}
```

## Widget Integration Patterns

### Complete Widget Implementation

A complete widget implementation typically includes:

```javascript
// 1. Widget component registration during app initialization
function registerDashboardWidgets() {
    const { registerWidget, assignWidget } = useDispatch( CORE_WIDGETS );
    
    // Register widget
    registerWidget( 'analyticsPopularContent', {
        Component: PopularContentWidget,
        priority: 10,
        width: WIDGET_WIDTHS.HALF,
        modules: ['analytics-4'],
        isActive: ( select ) => select( MODULES_ANALYTICS_4 ).isConnected()
    } );
    
    // Assign to area
    assignWidget( 'analyticsPopularContent', 'googlesitekit-dashboard-traffic' );
}

// 2. Widget area registration
function registerDashboardAreas() {
    const { registerWidgetArea, assignWidgetArea } = useDispatch( CORE_WIDGETS );
    
    // Register area
    registerWidgetArea( 'googlesitekit-dashboard-traffic', {
        title: 'Traffic Insights',
        subtitle: 'How users found your site',
        style: WIDGET_AREA_STYLES.BOXES,
        priority: 20
    } );
    
    // Assign to context
    assignWidgetArea( 'googlesitekit-dashboard-traffic', 'googlesitekit-dashboard' );
}

// 3. Widget component implementation
function PopularContentWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
    const reportOptions = useReportOptions();
    
    const report = useInViewSelect(
        ( select ) => select( MODULES_ANALYTICS_4 ).getReport( reportOptions ),
        [ reportOptions ]
    );
    
    const loading = useSelect( ( select ) =>
        ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [ reportOptions ] )
    );
    
    const error = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [ reportOptions ] )
    );
    
    if ( loading ) {
        return <Widget>Loading...</Widget>;
    }
    
    if ( error ) {
        return <WidgetReportError />;
    }
    
    if ( ! report?.rows?.length ) {
        return <WidgetReportZero />;
    }
    
    return (
        <Widget>
            {/* Widget content */}
        </Widget>
    );
}

export default whenActive( {
    moduleName: 'analytics-4',
    FallbackComponent: ConnectGA4CTATileWidget
} )( PopularContentWidget );
```

## Best Practices

### Widget Development
1. **Use whenActive HOC** for module-dependent widgets
2. **Handle loading, error, and zero-data states** appropriately
3. **Use useInViewSelect** for expensive data fetching
4. **Implement proper PropTypes** validation
5. **Follow responsive design patterns** with hideOnBreakpoints

### Registration Patterns
1. **Register widgets during app initialization**
2. **Use consistent naming conventions** for slugs
3. **Set appropriate priorities** for display order
4. **Associate widgets with relevant modules**
5. **Implement meaningful isActive callbacks**

### State Management
1. **Use widget state sparingly** for temporary overrides
2. **Prefer datastore state** for persistent data
3. **Clear widget states** when no longer needed
4. **Handle view-only mode** appropriately

### Performance
1. **Use useInViewSelect** for widgets below the fold
2. **Implement preloading** for critical widgets
3. **Avoid unnecessary re-renders** with proper dependency arrays
4. **Cache expensive computations** in selectors

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

# Storybook Stories

Site Kit uses Storybook for component documentation, visual testing, and development workflow enhancement.

## Story Organization

### File Structure and Naming

Stories follow consistent patterns:

```
assets/js/
├── components/
│   ├── Component.js
│   └── Component.stories.js          // Basic component stories
├── googlesitekit/
│   └── components-gm2/
│       └── Button/
│           └── index.stories.js      // Material Design stories
└── modules/
    └── analytics-4/
        └── components/
            └── dashboard/
                └── Widget.stories.js // Module-specific stories
```

### Story Categories

Stories are organized by hierarchical categories:

- **Components**: Basic UI components (`Components/Badge`, `Components/Link`)
- **Key Metrics**: Metric widgets (`Key Metrics/WidgetTiles/MetricTileNumeric`)
- **Material Design**: GM2 components (`Material Design/Button`, `Material Design/TextField`)
- **Module Components**: Module-specific UI (`Analytics 4/Dashboard Widget`)
- **Blocks**: WordPress block components (`Blocks/Reader Revenue Manager`)

## Story Creation Patterns

### Basic Story Structure

Simple component stories follow this template:

```javascript
/**
 * Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 */

/**
 * Internal dependencies
 */
import Component from './Component';

function Template( args ) {
    return <Component { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default Component';
Default.args = {
    title: 'Example Title',
    value: 'Example Value',
};

export const Alternative = Template.bind( {} );
Alternative.storyName = 'Alternative State';
Alternative.args = {
    title: 'Alternative Title',
    variant: 'secondary',
};

export default {
    title: 'Components/Component',
    component: Component,
};
```

### Advanced Story Patterns

Complex stories with multiple variants:

```javascript
/**
 * Link Component Stories.
 */
import { Fragment } from '@wordpress/element';
import PencilIcon from './../../svg/icons/pencil-alt.svg';
import Link from './Link';
import VisuallyHidden from './VisuallyHidden';

function Template( args ) {
    const { children, ...rest } = args;
    return (
        <p>
            <Link { ...rest }>{ children }</Link>
        </p>
    );
}

export const Default = Template.bind( {} );
Default.args = {
    href: 'http://google.com',
    children: 'Default Link',
};

export const LinkButtonWithIconPrefix = Template.bind( {} );
LinkButtonWithIconPrefix.args = {
    onClick: () => {},
    children: 'Default Link Button With Icon Prefix',
    leadingIcon: <PencilIcon width={ 18 } height={ 18 } />,
};

export const ExternalLinkWithVisuallyHiddenContent = Template.bind( {} );
ExternalLinkWithVisuallyHiddenContent.args = {
    href: 'http://google.com',
    children: (
        <Fragment>
            External <VisuallyHidden>I am hiding </VisuallyHidden>
            Link with VisuallyHidden content
        </Fragment>
    ),
    external: true,
};

// Visual Regression Testing story
export function VRTStory() {
    const linkStories = [
        Default,
        LinkButtonWithIconPrefix,
        ExternalLinkWithVisuallyHiddenContent,
        // ... more stories
    ];

    return (
        <div>
            { linkStories.map( ( Story, index ) => (
                <p key={ index }>
                    <Story { ...Story.args } />
                </p>
            ) ) }
        </div>
    );
}
VRTStory.storyName = 'All Links VRT';
VRTStory.scenario = {
    hoverSelector: '.googlesitekit-cta-link--hover',
    postInteractionWait: 1000,
    onReadyScript: 'mouse.js',
};

export default {
    title: 'Components/Link',
    component: Link,
};
```

### Widget Stories with HOCs

Widget components often use higher-order components:

```javascript
/**
 * MetricTileNumeric Component Stories.
 */
import MetricTileNumeric from './MetricTileNumeric';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';

const WidgetWithComponentProps = 
    withWidgetComponentProps( 'test' )( MetricTileNumeric );

function Template( { ...args } ) {
    return <WidgetWithComponentProps { ...args } />;
}

export const Positive = Template.bind( {} );
Positive.storyName = 'Positive';
Positive.args = {
    title: 'New Visitors',
    metricValue: 100,
    subText: 'of 1,234 total visitors',
    currentValue: 100,
    previousValue: 91,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
    title: 'New Visitors',
    loading: true,
};
Loading.decorators = [
    ( Story ) => {
        // Ensure animation is paused for VRT tests
        return (
            <div className="googlesitekit-vrt-animation-paused">
                <Story />
            </div>
        );
    },
];

export default {
    title: 'Key Metrics/WidgetTiles/MetricTileNumeric',
    component: MetricTileNumeric,
};
```

## Storybook Configuration

### Main Configuration

Storybook is configured in `storybook/main.js`:

```javascript
module.exports = {
    stories: [
        '../assets/js/**/*.stories.js',
        '../assets/blocks/**/*.stories.js',
    ],
    addons: [ '@storybook/addon-viewport', '@storybook/addon-postcss' ],
    previewHead: ( head ) => {
        if ( process.env.VRT === '1' ) {
            return `${ head }\n${ vrtHead() }`;
        }
        return head;
    },
};
```

### Preview Configuration

Global decorators and parameters in `storybook/preview.js`:

```javascript
/**
 * Storybook preview config.
 */
import { createTestRegistry, provideUserInfo, setEnabledFeatures } from '../tests/js/test-utils';
import { RegistryProvider } from 'googlesitekit-data';
import InViewProvider from '../assets/js/components/InViewProvider';
import FeaturesProvider from '../assets/js/components/FeaturesProvider';

// Decorators run from last added to first (reverse order)
export const decorators = [
    ( Story, { parameters, kind } ) => {
        const { padding } = parameters || {};
        const styles = padding !== undefined ? { padding } : {};

        // Different layout for block stories
        if ( kind.startsWith( 'Blocks/' ) ) {
            return (
                <Grid style={ styles }>
                    <Story />
                </Grid>
            );
        }

        return (
            <Grid className="googlesitekit-plugin-preview js" style={ styles }>
                <Row>
                    <Cell size={ 12 } className="googlesitekit-plugin">
                        <Story />
                    </Cell>
                </Row>
            </Grid>
        );
    },
    
    // Features and registry setup
    ( Story, { parameters } ) => {
        const { features = [], route } = parameters;
        const registry = createTestRegistry();
        const featuresToEnable = new Set( features );

        // Populate basic test data
        provideUserInfo( registry );
        setEnabledFeatures( features );

        return (
            <InViewProvider value={ inViewState }>
                <RegistryProvider value={ registry }>
                    <FeaturesProvider value={ featuresToEnable }>
                        <Router history={ history }>
                            <Story />
                        </Router>
                    </FeaturesProvider>
                </RegistryProvider>
            </InViewProvider>
        );
    },
];

export const parameters = {
    layout: 'fullscreen',
    options: {
        storySort: {
            method: 'alphabetical',
        },
    },
};
```

## Visual Regression Testing

### VRT Story Patterns

Stories for visual regression testing include special configuration:

```javascript
export function VRTStory() {
    const buttonStories = [
        DefaultButton,
        DangerButton,
        DisabledButton,
        TertiaryButton,
        // ... all button variants
    ];

    return (
        <div>
            { buttonStories.map( ( ButtonStory, index ) => (
                <p key={ index }>
                    <ButtonStory { ...ButtonStory.args } />
                </p>
            ) ) }
        </div>
    );
}
VRTStory.storyName = 'All Buttons VRT';
VRTStory.scenario = {
    hoverSelector: '.googlesitekit-button--icon',
    postInteractionWait: 3000,
    onReadyScript: 'mouse.js',
};
```

### Hover and Interaction States

Stories can test interactive states:

```javascript
export const HoverButton = Template.bind( {} );
HoverButton.storyName = 'Default Button Hover';
HoverButton.args = {
    children: 'Default Button Hover',
    className: 'googlesitekit-cta-link--hover',  // CSS class for hover state
};

// VRT scenario for interactions
VRTStory.scenario = {
    hoverSelector: '.googlesitekit-button--icon',
    postInteractionWait: 3000,
    onReadyScript: 'mouse.js',
};
```

### Loading State Testing

Loading states require special animation handling:

```javascript
export const Loading = Template.bind( {} );
Loading.decorators = [
    ( Story ) => {
        // Ensure animation is paused for VRT tests
        return (
            <div className="googlesitekit-vrt-animation-paused">
                <Story />
            </div>
        );
    },
];
```

## Story Development Guidelines

### Story Parameters

Stories can accept configuration through parameters:

```javascript
// Story with custom parameters
export const FeatureStory = Template.bind( {} );
FeatureStory.parameters = {
    features: [ 'userInput', 'keyMetrics' ],  // Enable feature flags
    route: '/dashboard',                       // Set router location
    padding: '20px',                          // Custom styling
};
```

### Best Practices

1. **Comprehensive Coverage**: Create stories for all component states (default, loading, error, empty)
2. **Descriptive Names**: Use clear story names that explain the variant
3. **Minimal Props**: Provide only necessary props to demonstrate the specific state
4. **VRT Considerations**: Include VRT stories for visual regression testing
5. **Documentation**: Add comments explaining complex story setups
6. **Consistent Structure**: Follow established patterns for similar component types

### Testing Integration

Stories can be tested alongside regular unit tests:

```javascript
// stories.test.js - validates all stories can render
import { composeStories } from '@storybook/testing-react';
import { render } from '@testing-library/react';
import * as stories from './Component.stories';

const { Default, Loading, Error } = composeStories( stories );

describe( 'Component Stories', () => {
    it( 'should render Default story', () => {
        render( <Default /> );
        // Assertions...
    } );

    it( 'should render Loading story', () => {
        render( <Loading /> );
        // Assertions...
    } );
} );
```

### Development Workflow

1. **Create Component**: Develop the component functionality
2. **Write Tests**: Add unit and integration tests
3. **Create Stories**: Document all component states
4. **Visual Review**: Use Storybook for development and review
5. **VRT Setup**: Configure visual regression testing scenarios
6. **Documentation**: Ensure stories serve as living documentation

Storybook serves as both a development tool and documentation system, enabling component-driven development and maintaining visual consistency across Site Kit's interface.

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

# Custom Hooks Architecture

Site Kit uses a comprehensive custom hooks system to encapsulate reusable logic, provide consistent APIs, and manage complex state interactions across the application.

## Hook Organization and Storage

### Global-Level Hooks Location

**Primary Location**: `/assets/js/hooks/`

All application-wide custom hooks are stored in the **`/assets/js/hooks/`** directory. This is the centralized location for hooks that are used across multiple components, modules, or contexts.

```
assets/js/hooks/
├── useActivateModuleCallback.js     # Module activation logic
├── useBreakpoint.js                 # Responsive breakpoint detection
├── useChecks.js                     # System checks and validations
├── useDashboardType.js              # Dashboard type detection
├── useDebounce.js                   # Debouncing utilities
├── useDebouncedState.js             # Debounced state management
├── useFeature.js                    # Feature flag access
├── useInView.js                     # Viewport detection
├── useInViewSelect.js               # Performance-optimized datastore selectors
├── useLatestIntersection.js         # Advanced intersection observer
├── useQueryArg.js                   # URL query parameter management
├── useViewContext.js                # Application view context
├── useViewOnly.js                   # View-only mode detection
├── useWindowSize.js                 # Window size tracking
└── useRefocus.js                    # Focus management
```

### Module-Specific Hooks

Module-specific hooks are stored within each module's directory structure:

```
assets/js/modules/[module-name]/hooks/
├── useExistingTagEffect.js          # Module-specific tag detection
├── useCustomDimensionsData.js       # Module-specific data hooks
└── useCreateCustomDimensionEffect.js # Module-specific effects
```

### Component-Specific Hooks

Component-specific hooks are co-located with their components:

```
assets/js/components/[component-name]/hooks/
├── useDisplayCTAWidget.js           # Component-specific logic
└── useNavChipHelpers.js             # Navigation-specific helpers
```

## Hook Categories and Patterns

### 1. State Management Hooks

#### Basic State Management

```javascript
import { useDebouncedState } from '../hooks/useDebouncedState';

function SearchComponent() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Debounce search input to avoid excessive API calls
    const debouncedSearchTerm = useDebouncedState(searchTerm, 300);
    
    useEffect(() => {
        if (debouncedSearchTerm) {
            // Trigger search API call
        }
    }, [debouncedSearchTerm]);
    
    return (
        <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
        />
    );
}
```

#### URL State Management

```javascript
import useQueryArg from '../hooks/useQueryArg';

function FilterableList() {
    const [filter, setFilter] = useQueryArg('filter', 'all');
    const [sortBy, setSortBy] = useQueryArg('sort', 'name');
    
    // URL automatically updates when state changes
    // State is restored from URL on page load
    
    return (
        <div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
            
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Name</option>
                <option value="date">Date</option>
            </select>
        </div>
    );
}
```

### 2. Performance Optimization Hooks

#### Viewport-Based Loading

```javascript
import { useInViewSelect } from '../hooks/useInViewSelect';
import { useSelect } from 'googlesitekit-data';

function ExpensiveWidget() {
    // Only fetch data when component is in viewport
    const reportData = useInViewSelect(
        (select) => select(MODULES_ANALYTICS_4).getReport(reportOptions),
        [reportOptions]
    );
    
    // Regular useSelect for lightweight data
    const isLoading = useSelect((select) => 
        !select(MODULES_ANALYTICS_4).hasFinishedResolution('getReport', [reportOptions])
    );
    
    if (!reportData) {
        return <div>Widget not in view</div>;
    }
    
    return <div>Report data: {JSON.stringify(reportData)}</div>;
}
```

#### Debounced Operations

```javascript
import { useDebounce } from '../hooks/useDebounce';

function AutoSaveForm() {
    const [formData, setFormData] = useState({});
    const { saveSettings } = useDispatch(MODULES_ANALYTICS_4);
    
    // Debounce save operation to avoid excessive API calls
    const debouncedSave = useDebounce(
        useCallback(async (data) => {
            await saveSettings(data);
        }, [saveSettings]),
        1000  // 1 second delay
    );
    
    useEffect(() => {
        if (Object.keys(formData).length > 0) {
            debouncedSave(formData);
        }
    }, [formData, debouncedSave]);
    
    return (
        <form onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})}>
            {/* Form fields */}
        </form>
    );
}
```

### 3. Responsive Design Hooks

#### Breakpoint Detection

```javascript
import { useBreakpoint, BREAKPOINT_SMALL, BREAKPOINT_TABLET } from '../hooks/useBreakpoint';

function ResponsiveComponent() {
    const breakpoint = useBreakpoint();
    
    const isMobile = breakpoint === BREAKPOINT_SMALL;
    const isTablet = breakpoint === BREAKPOINT_TABLET;
    
    return (
        <div>
            {isMobile && <MobileLayout />}
            {isTablet && <TabletLayout />}
            {!isMobile && !isTablet && <DesktopLayout />}
        </div>
    );
}
```

#### Window Size Tracking

```javascript
import { useWindowWidth, useWindowHeight, useWindowSize } from '../hooks/useWindowSize';

function AdaptiveComponent() {
    const windowWidth = useWindowWidth();
    const windowHeight = useWindowHeight();
    const [width, height] = useWindowSize();
    
    const showSidebar = windowWidth > 1024;
    const cardColumns = Math.floor(windowWidth / 300);
    
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cardColumns}, 1fr)` }}>
            {showSidebar && <Sidebar />}
            <MainContent />
        </div>
    );
}
```

### 4. Context and Feature Detection Hooks

#### View Context Detection

```javascript
import useViewContext from '../hooks/useViewContext';
import useDashboardType, { DASHBOARD_TYPE_MAIN, DASHBOARD_TYPE_ENTITY } from '../hooks/useDashboardType';
import useViewOnly from '../hooks/useViewOnly';

function ContextAwareComponent() {
    const viewContext = useViewContext();
    const dashboardType = useDashboardType();
    const isViewOnly = useViewOnly();
    
    if (isViewOnly) {
        return <ViewOnlyComponent />;
    }
    
    if (dashboardType === DASHBOARD_TYPE_MAIN) {
        return <MainDashboardWidget />;
    }
    
    if (dashboardType === DASHBOARD_TYPE_ENTITY) {
        return <EntityDashboardWidget />;
    }
    
    return <DefaultComponent />;
}
```

#### Feature Flag Detection

```javascript
import { useFeature } from '../hooks/useFeature';

function ConditionalFeature() {
    const isNewFeatureEnabled = useFeature('newDashboardLayout');
    const isBetaFeatureEnabled = useFeature('betaAnalytics');
    
    return (
        <div>
            {isNewFeatureEnabled && <NewDashboardLayout />}
            {isBetaFeatureEnabled && <BetaAnalyticsWidget />}
            <StandardContent />
        </div>
    );
}
```

### 5. Module Integration Hooks

#### Module Activation

```javascript
import useActivateModuleCallback from '../hooks/useActivateModuleCallback';

function ModuleConnectCTA({ moduleSlug }) {
    const activateModule = useActivateModuleCallback(moduleSlug);
    
    // Returns null if user lacks permissions or module doesn't exist
    if (!activateModule) {
        return null;
    }
    
    return (
        <button onClick={activateModule}>
            Connect {moduleSlug}
        </button>
    );
}
```

#### Module-Specific Effects

```javascript
// In analytics-4/hooks/useExistingTagEffect.js
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from 'googlesitekit-data';

export default function useExistingTagEffect() {
    const { setUseSnippet } = useDispatch(MODULES_ANALYTICS_4);
    
    const existingTag = useSelect((select) =>
        select(MODULES_ANALYTICS_4).getExistingTag()
    );
    const measurementID = useSelect((select) =>
        select(MODULES_ANALYTICS_4).getMeasurementID()
    );
    
    const skipEffect = useRef(true);
    
    useEffect(() => {
        if (existingTag && measurementID !== undefined) {
            if (measurementID === '' || skipEffect.current) {
                skipEffect.current = false;
                return;
            }
            
            if (measurementID === existingTag) {
                // Disable snippet if existing tag matches
                setUseSnippet(false);
            } else {
                // Enable snippet for different measurement ID
                setUseSnippet(true);
            }
        }
    }, [setUseSnippet, existingTag, measurementID]);
}

// Usage in component
function AnalyticsSettings() {
    useExistingTagEffect(); // Automatically manages snippet settings
    
    return <SettingsForm />;
}
```

### 6. Widget and Component State Hooks

#### Widget State Management

```javascript
import useWidgetStateEffect from '../googlesitekit/widgets/hooks/useWidgetStateEffect';

function ExpandableWidget({ widgetSlug }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Automatically set/unset widget state
    useWidgetStateEffect(
        widgetSlug,
        isExpanded ? ExpandedComponent : null,
        { expanded: isExpanded }
    );
    
    return (
        <div>
            <button onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Collapse' : 'Expand'}
            </button>
            {/* Widget content */}
        </div>
    );
}
```

### 7. Advanced Intersection Observer Hooks

#### Latest Intersection Tracking

```javascript
import useLatestIntersection from '../hooks/useLatestIntersection';

function LazyLoadedComponent() {
    const elementRef = useRef();
    
    const intersectionEntry = useLatestIntersection(elementRef, {
        rootMargin: '100px',  // Load 100px before element enters viewport
        threshold: 0.1        // Trigger when 10% visible
    });
    
    const isVisible = intersectionEntry?.isIntersecting;
    
    return (
        <div ref={elementRef}>
            {isVisible ? <ExpensiveComponent /> : <PlaceholderComponent />}
        </div>
    );
}
```

## Hook Implementation Patterns

### 1. Custom Hook Structure

All custom hooks follow this standardized structure:

```javascript
/**
 * `useCustomHook` hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';

/**
 * Custom hook description.
 *
 * @since 1.25.0
 *
 * @param {string} parameter Description of parameter.
 * @return {*} Description of return value.
 */
export default function useCustomHook(parameter) {
    // Hook implementation
    
    return hookReturnValue;
}
```

### 2. Error Handling in Hooks

```javascript
import { useState, useEffect } from '@wordpress/element';

export default function useAsyncOperation(operation) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await operation(...args);
            setData(result);
            return { data: result, error: null };
        } catch (err) {
            setError(err);
            return { data: null, error: err };
        } finally {
            setLoading(false);
        }
    }, [operation]);
    
    return {
        data,
        loading,
        error,
        execute,
        reset: () => {
            setData(null);
            setError(null);
        }
    };
}
```

### 3. Datastore Integration Patterns

```javascript
import { useSelect, useDispatch } from 'googlesitekit-data';
import { useCallback } from '@wordpress/element';

export default function useModuleSettings(moduleSlug) {
    // Selectors
    const settings = useSelect((select) =>
        select(`modules/${moduleSlug}`).getSettings()
    );
    
    const hasChanges = useSelect((select) =>
        select(`modules/${moduleSlug}`).haveSettingsChanged()
    );
    
    const isSaving = useSelect((select) =>
        select(`modules/${moduleSlug}`).isDoingSaveSettings()
    );
    
    // Actions
    const { setSettings, saveSettings, rollbackSettings } = useDispatch(`modules/${moduleSlug}`);
    
    // Composed operations
    const updateSetting = useCallback((key, value) => {
        setSettings({ [key]: value });
    }, [setSettings]);
    
    const handleSave = useCallback(async () => {
        const { error } = await saveSettings();
        return { success: !error, error };
    }, [saveSettings]);
    
    return {
        settings,
        hasChanges,
        isSaving,
        updateSetting,
        saveSettings: handleSave,
        rollbackSettings
    };
}
```

### 4. Complex State Management

```javascript
import { useReducer, useCallback } from '@wordpress/element';

const actionTypes = {
    SET_LOADING: 'SET_LOADING',
    SET_DATA: 'SET_DATA',
    SET_ERROR: 'SET_ERROR',
    RESET: 'RESET'
};

function dataReducer(state, action) {
    switch (action.type) {
        case actionTypes.SET_LOADING:
            return { ...state, loading: action.payload, error: null };
        case actionTypes.SET_DATA:
            return { ...state, data: action.payload, loading: false, error: null };
        case actionTypes.SET_ERROR:
            return { ...state, error: action.payload, loading: false };
        case actionTypes.RESET:
            return { data: null, loading: false, error: null };
        default:
            return state;
    }
}

export default function useDataFetcher(fetchFunction) {
    const [state, dispatch] = useReducer(dataReducer, {
        data: null,
        loading: false,
        error: null
    });
    
    const fetchData = useCallback(async (...args) => {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        
        try {
            const data = await fetchFunction(...args);
            dispatch({ type: actionTypes.SET_DATA, payload: data });
        } catch (error) {
            dispatch({ type: actionTypes.SET_ERROR, payload: error });
        }
    }, [fetchFunction]);
    
    const reset = useCallback(() => {
        dispatch({ type: actionTypes.RESET });
    }, []);
    
    return {
        ...state,
        fetchData,
        reset
    };
}
```

## Hook Composition Patterns

### 1. Compound Hooks

Combine multiple hooks for complex functionality:

```javascript
export default function useAnalyticsDashboard() {
    const viewContext = useViewContext();
    const isViewOnly = useViewOnly();
    const breakpoint = useBreakpoint();
    
    const isAnalyticsConnected = useSelect((select) =>
        select(MODULES_ANALYTICS_4).isConnected()
    );
    
    const reportOptions = useMemo(() => ({
        startDate: '30daysAgo',
        endDate: 'today',
        metrics: ['sessions', 'users']
    }), []);
    
    const reportData = useInViewSelect(
        (select) => select(MODULES_ANALYTICS_4).getReport(reportOptions),
        [reportOptions]
    );
    
    const showMobileLayout = breakpoint === BREAKPOINT_SMALL;
    const canViewReports = isAnalyticsConnected && !isViewOnly;
    
    return {
        viewContext,
        isViewOnly,
        breakpoint,
        showMobileLayout,
        canViewReports,
        reportData
    };
}
```

### 2. Hook Factories

Create hooks dynamically for different modules:

```javascript
function createModuleHook(moduleSlug) {
    return function useModule() {
        const isConnected = useSelect((select) =>
            select(CORE_MODULES).isModuleConnected(moduleSlug)
        );
        
        const moduleData = useSelect((select) =>
            select(`modules/${moduleSlug}`).getSettings()
        );
        
        const activateModule = useActivateModuleCallback(moduleSlug);
        
        return {
            isConnected,
            moduleData,
            activateModule
        };
    };
}

// Usage
const useAnalytics = createModuleHook('analytics-4');
const useAdSense = createModuleHook('adsense');
```

## Advanced Hook Patterns

### 1. Conditional Hook Execution

```javascript
export default function useConditionalEffect(condition, effect, deps) {
    const shouldRun = useRef(false);
    
    useEffect(() => {
        if (condition && !shouldRun.current) {
            shouldRun.current = true;
            effect();
        } else if (!condition) {
            shouldRun.current = false;
        }
    }, [condition, effect, ...deps]);
}
```

### 2. Hook Cleanup Management

```javascript
export default function useAsyncEffect(asyncFunction, deps) {
    useEffect(() => {
        let cancelled = false;
        
        (async () => {
            try {
                const result = await asyncFunction();
                if (!cancelled) {
                    // Handle result
                }
            } catch (error) {
                if (!cancelled) {
                    // Handle error
                }
            }
        })();
        
        return () => {
            cancelled = true;
        };
    }, deps);
}
```

### 3. Previous Value Tracking

```javascript
export default function usePrevious(value) {
    const ref = useRef();
    
    useEffect(() => {
        ref.current = value;
    }, [value]);
    
    return ref.current;
}

// Usage
function ComponentWithPreviousValue({ currentValue }) {
    const previousValue = usePrevious(currentValue);
    
    useEffect(() => {
        if (previousValue !== undefined && previousValue !== currentValue) {
            console.log(`Value changed from ${previousValue} to ${currentValue}`);
        }
    }, [currentValue, previousValue]);
    
    return <div>Current: {currentValue}, Previous: {previousValue}</div>;
}
```

## Testing Custom Hooks

### 1. Basic Hook Testing

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
    it('should debounce function calls', async () => {
        const mockFn = jest.fn();
        const { result } = renderHook(() => useDebounce(mockFn, 100));
        
        act(() => {
            result.current();
            result.current();
            result.current();
        });
        
        expect(mockFn).not.toHaveBeenCalled();
        
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 150));
        });
        
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
});
```

### 2. Hook Testing with Context

```javascript
import { renderHook } from '@testing-library/react-hooks';
import { useFeature } from '../useFeature';
import FeaturesProvider from '../components/FeaturesProvider';

const wrapper = ({ children }) => (
    <FeaturesProvider value={['newFeature']}>
        {children}
    </FeaturesProvider>
);

describe('useFeature', () => {
    it('should return true for enabled features', () => {
        const { result } = renderHook(
            () => useFeature('newFeature'),
            { wrapper }
        );
        
        expect(result.current).toBe(true);
    });
});
```

## Best Practices

### Hook Development
1. **Use descriptive names** starting with "use"
2. **Follow the standard file header** format
3. **Include comprehensive JSDoc** documentation
4. **Return consistent data structures** across similar hooks
5. **Handle edge cases** and error states

### Performance
1. **Use useCallback and useMemo** appropriately for expensive operations
2. **Implement proper cleanup** in useEffect
3. **Avoid unnecessary re-renders** with dependency arrays
4. **Use useInViewSelect** for data fetching in widgets

### Code Organization
1. **Place global hooks** in `/assets/js/hooks/`
2. **Co-locate module-specific hooks** with modules
3. **Co-locate component-specific hooks** with components
4. **Export hook constants** for reuse across components

### Error Handling
1. **Provide fallback values** for failed operations
2. **Use error boundaries** for hook-related errors
3. **Log errors appropriately** for debugging
4. **Return error states** in hook return values

### Testing
1. **Test hook behavior** not implementation details
2. **Mock external dependencies** (datastore, APIs)
3. **Test cleanup functions** and memory leaks
4. **Cover edge cases** and error scenarios

# Notifications and Banners System

Site Kit uses a sophisticated notifications and banners system to communicate important information, errors, setup requirements, and success messages to users across different dashboard contexts.

## Notification System Architecture

### Core Components

The notification system is built around several key concepts:

1. **Notification Areas**: Specific locations where notifications can be displayed
2. **Notification Groups**: Logical groupings for managing notification queues
3. **View Contexts**: Different dashboard/page contexts where notifications appear
4. **Priority System**: Numeric priority system for ordering notifications
5. **Dismissal System**: User dismissal with optional retry limits

### Notification Areas

Notifications are rendered in specific areas defined by `NOTIFICATION_AREAS`:

```javascript
import { NOTIFICATION_AREAS } from '../googlesitekit/notifications/constants';

const NOTIFICATION_AREAS = {
    HEADER: 'notification-area-header',           // Top of page notifications
    DASHBOARD_TOP: 'notification-area-dashboard-top',  // Dashboard banner area
    OVERLAYS: 'notification-area-overlays',       // Full-screen overlay notifications
};
```

### Notification Groups

Notifications are organized into groups for queue management:

```javascript
import { NOTIFICATION_GROUPS } from '../googlesitekit/notifications/constants';

const NOTIFICATION_GROUPS = {
    DEFAULT: 'default',        // Standard notifications
    SETUP_CTAS: 'setup-ctas',  // Setup call-to-action notifications
};
```

### Priority System

Notifications use a priority system where lower numbers have higher priority:

```javascript
import { PRIORITY } from '../googlesitekit/notifications/constants';

const PRIORITY = {
    ERROR_HIGH: 30,      // Critical errors
    ERROR_LOW: 60,       // Non-critical errors  
    WARNING: 100,        // Warning messages
    INFO: 150,           // Informational messages
    SETUP_CTA_HIGH: 150, // High-priority setup CTAs
    SETUP_CTA_LOW: 200,  // Low-priority setup CTAs
};
```

## Notification Registration

### Basic Registration

```javascript
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../googlesitekit/notifications/datastore/constants';
import { NOTIFICATION_AREAS, NOTIFICATION_GROUPS, PRIORITY } from '../googlesitekit/notifications/constants';

const { registerNotification } = useDispatch(CORE_NOTIFICATIONS);

registerNotification('my-notification-id', {
    Component: MyNotificationComponent,          // React component to render
    priority: PRIORITY.INFO,                     // Display priority
    areaSlug: NOTIFICATION_AREAS.HEADER,        // Where to display
    groupID: NOTIFICATION_GROUPS.DEFAULT,       // Notification group
    viewContexts: [                              // Which contexts to show in
        VIEW_CONTEXT_MAIN_DASHBOARD,
        VIEW_CONTEXT_ENTITY_DASHBOARD
    ],
    checkRequirements: async ({ select, resolveSelect }) => {
        // Async function to determine if notification should show
        await resolveSelect(CORE_MODULES).getModules();
        const isConnected = select(CORE_MODULES).isModuleConnected('analytics-4');
        return !isConnected;
    },
    isDismissible: true,                         // Can user dismiss it
    dismissRetries: 0,                          // How many times to show after dismissal
    featureFlag: 'myFeatureFlag',               // Optional feature flag requirement
});
```

### Advanced Registration Example

```javascript
// Complete notification registration with all options
registerNotification('setup-success-banner', {
    Component: SetupSuccessBanner,
    priority: PRIORITY.INFO,
    areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
    groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
    viewContexts: [VIEW_CONTEXT_MAIN_DASHBOARD],
    
    checkRequirements: async ({ select, resolveSelect, dispatch }) => {
        // Wait for required data to be available
        await Promise.all([
            resolveSelect(CORE_USER).getAuthentication(),
            resolveSelect(CORE_MODULES).getModules(),
        ]);
        
        // Check URL parameters for setup success
        const notification = getQueryArg(location.href, 'notification');
        const moduleSlug = getQueryArg(location.href, 'slug');
        
        if (notification === 'authentication_success' && moduleSlug) {
            const module = select(CORE_MODULES).getModule(moduleSlug);
            return module?.active === true;
        }
        
        return false;
    },
    
    isDismissible: true,
    dismissRetries: 2,  // Show up to 2 more times after dismissal
    featureFlag: 'enhancedNotifications',
});
```

## Notification Layout Components

### BannerNotification

Full-width banner notifications with rich content and actions:

```javascript
import BannerNotification, { TYPES } from '../googlesitekit/notifications/components/layout/BannerNotification';

function MyBannerNotification({ id, Notification }) {
    return (
        <Notification>
            <BannerNotification
                notificationID={id}
                type={TYPES.WARNING}  // INFO, WARNING, ERROR
                title="Important Update Required"
                description="Your Analytics connection needs to be updated to continue receiving data."
                
                learnMoreLink={{
                    url: 'https://example.com/docs',
                    label: 'Learn more about this update',
                    external: true
                }}
                
                ctaButton={{
                    text: 'Update Now',
                    onClick: async () => {
                        // Handle CTA click
                        await updateAnalyticsConnection();
                    },
                    dismissOnClick: true,  // Dismiss notification after click
                    dismissOptions: { expiresInSeconds: 0 }  // Permanent dismissal
                }}
                
                dismissButton={{
                    onClick: async () => {
                        // Handle custom dismiss logic
                        await trackDismissal('analytics-update-banner');
                    },
                    dismissOptions: { expiresInSeconds: 86400 }  // Dismiss for 24 hours
                }}
                
                gaTrackingEventArgs={{
                    category: 'Analytics Setup',
                    label: 'Update Banner',
                    value: 1
                }}
            />
        </Notification>
    );
}
```

### NoticeNotification

Compact notice-style notifications:

```javascript
import NoticeNotification from '../googlesitekit/notifications/components/layout/NoticeNotification';
import { TYPES } from '../components/Notice/constants';

function MyNoticeNotification({ id, Notification }) {
    return (
        <Notification>
            <NoticeNotification
                notificationID={id}
                type={TYPES.SUCCESS}  // SUCCESS, WARNING, ERROR, INFO
                title="Connection Successful"
                description="Your Analytics account has been connected successfully."
                
                ctaButton={{
                    text: 'View Dashboard',
                    onClick: async () => {
                        navigateTo('/dashboard');
                    }
                }}
                
                dismissButton
                
                gaTrackingEventArgs={{
                    category: 'Setup Success',
                    label: 'Analytics Connected'
                }}
            />
        </Notification>
    );
}
```

### OverlayNotification

Full-screen overlay notifications for important messages:

```javascript
import OverlayNotification from '../googlesitekit/notifications/components/layout/OverlayNotification';

function MyOverlayNotification({ id, Notification }) {
    return (
        <Notification>
            <OverlayNotification
                notificationID={id}
                title="Account Linking Detected"
                description="We detected that your Analytics and AdSense accounts are already linked."
                
                ctaButton={{
                    text: 'Continue Setup',
                    onClick: async () => {
                        await completeAccountLinking();
                    }
                }}
                
                dismissButton={{
                    text: 'Skip for Now',
                    onClick: async () => {
                        await trackSkipLinking();
                    },
                    dismissOptions: { expiresInSeconds: 604800 }  // 7 days
                }}
                
                gaTrackingEventArgs={{
                    category: 'Account Linking',
                    confirmAction: 'confirm_linking',
                    dismissAction: 'skip_linking'
                }}
            />
        </Notification>
    );
}
```

## Notification Component Structure

### Basic Notification Component

All notification components follow this standard structure:

```javascript
/**
 * MyNotification component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BannerNotification from '../googlesitekit/notifications/components/layout/BannerNotification';

export default function MyNotification({ id, Notification }) {
    return (
        <Notification>
            <BannerNotification
                notificationID={id}
                title={__('Notification Title', 'google-site-kit')}
                description={__('Notification description text.', 'google-site-kit')}
                dismissButton
            />
        </Notification>
    );
}

MyNotification.propTypes = {
    id: PropTypes.string.isRequired,           // Notification ID (automatically provided)
    Notification: PropTypes.elementType.isRequired,  // Wrapper component (automatically provided)
};
```

### Advanced Notification with Data Integration

```javascript
import { useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../modules/analytics-4/datastore/constants';

function DataDrivenNotification({ id, Notification }) {
    // Fetch data for notification content
    const accountName = useSelect((select) =>
        select(MODULES_ANALYTICS_4).getAccountName()
    );
    
    const propertyName = useSelect((select) =>
        select(MODULES_ANALYTICS_4).getPropertyName()
    );
    
    const isLoading = useSelect((select) =>
        !select(MODULES_ANALYTICS_4).hasFinishedResolution('getSettings')
    );
    
    if (isLoading) {
        return null;  // Don't render until data is available
    }
    
    return (
        <Notification>
            <BannerNotification
                notificationID={id}
                title={__('Analytics Account Connected', 'google-site-kit')}
                description={sprintf(
                    __('Successfully connected to %1$s account with property %2$s.', 'google-site-kit'),
                    accountName,
                    propertyName
                )}
                
                ctaButton={{
                    text: __('View Analytics Dashboard', 'google-site-kit'),
                    onClick: async () => {
                        navigateTo('/analytics-dashboard');
                    },
                    dismissOnClick: true
                }}
                
                dismissButton
            />
        </Notification>
    );
}
```

## Notification Rendering

### Notifications Component

The main component for rendering notifications in specific areas:

```javascript
import Notifications from '../components/notifications/Notifications';
import { NOTIFICATION_AREAS, NOTIFICATION_GROUPS } from '../googlesitekit/notifications/constants';

function DashboardHeader() {
    return (
        <div className="dashboard-header">
            {/* Render notifications for the header area */}
            <Notifications 
                areaSlug={NOTIFICATION_AREAS.HEADER}
                groupID={NOTIFICATION_GROUPS.DEFAULT}
            />
            
            {/* Other header content */}
        </div>
    );
}

function DashboardMain() {
    return (
        <div className="dashboard-main">
            {/* Render setup CTAs */}
            <Notifications 
                areaSlug={NOTIFICATION_AREAS.DASHBOARD_TOP}
                groupID={NOTIFICATION_GROUPS.SETUP_CTAS}
            />
            
            {/* Dashboard content */}
        </div>
    );
}
```

### Manual Notification Rendering

For specific notification instances:

```javascript
import { useSelect } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../googlesitekit/notifications/datastore/constants';

function SpecificNotificationRenderer() {
    const notification = useSelect((select) =>
        select(CORE_NOTIFICATIONS).getNotification('my-notification-id')
    );
    
    if (!notification) {
        return null;
    }
    
    const { Component } = notification;
    const props = getNotificationComponentProps('my-notification-id');
    
    return <Component {...props} />;
}
```

## Notification State Management

### Dismissing Notifications

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../googlesitekit/notifications/datastore/constants';

function useNotificationActions() {
    const { dismissNotification } = useDispatch(CORE_NOTIFICATIONS);
    
    const dismissPermanently = async (notificationId) => {
        await dismissNotification(notificationId, {
            expiresInSeconds: 0  // Permanent dismissal
        });
    };
    
    const dismissTemporarily = async (notificationId, hours = 24) => {
        await dismissNotification(notificationId, {
            expiresInSeconds: hours * 3600
        });
    };
    
    const dismissWithRetries = async (notificationId) => {
        // For notifications with dismissRetries > 0, this will
        // show the notification again until retry limit is reached
        await dismissNotification(notificationId);
    };
    
    return {
        dismissPermanently,
        dismissTemporarily,
        dismissWithRetries
    };
}
```

### Checking Notification State

```javascript
import { useSelect } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../googlesitekit/notifications/datastore/constants';

function useNotificationState(notificationId) {
    const notification = useSelect((select) =>
        select(CORE_NOTIFICATIONS).getNotification(notificationId)
    );
    
    const isDismissed = useSelect((select) =>
        select(CORE_NOTIFICATIONS).isNotificationDismissed(notificationId)
    );
    
    const isFinalDismissal = useSelect((select) =>
        select(CORE_NOTIFICATIONS).isNotificationDismissalFinal(notificationId)
    );
    
    const seenDates = useSelect((select) =>
        select(CORE_NOTIFICATIONS).getNotificationSeenDates(notificationId)
    );
    
    return {
        notification,
        isDismissed,
        isFinalDismissal,
        seenDates,
        viewCount: seenDates?.length || 0
    };
}
```

## Analytics and Tracking

### Automatic Event Tracking

Notifications automatically track user interactions:

```javascript
// These events are automatically tracked when users interact with notifications:

// View events - when notification becomes visible
trackEvent('notification_view', 'notification_category', 'notification_label');

// Dismiss events - when user dismisses notification
trackEvent('notification_dismiss', 'notification_category', 'notification_label');

// CTA events - when user clicks main action button
trackEvent('notification_confirm', 'notification_category', 'notification_label');

// Learn More events - when user clicks learn more link
trackEvent('notification_learn_more', 'notification_category', 'notification_label');
```

### Custom Tracking

```javascript
import useNotificationEvents from '../googlesitekit/notifications/hooks/useNotificationEvents';

function TrackedNotification({ id, Notification }) {
    const trackEvents = useNotificationEvents(
        id,
        'Custom Category',  // Event category
        {
            viewAction: 'custom_view',       // Custom view action
            confirmAction: 'custom_confirm', // Custom confirm action
            dismissAction: 'custom_dismiss'  // Custom dismiss action
        }
    );
    
    const handleCustomAction = async () => {
        // Track custom event
        trackEvents.confirm('Custom Label', 1);
        
        // Perform action
        await performCustomAction();
    };
    
    return (
        <Notification>
            <BannerNotification
                notificationID={id}
                title="Tracked Notification"
                ctaButton={{
                    text: 'Custom Action',
                    onClick: handleCustomAction
                }}
                gaTrackingEventArgs={{
                    category: 'Custom Category',
                    label: 'Custom Label',
                    value: 1
                }}
            />
        </Notification>
    );
}
```

## Module-Specific Notifications

### Creating Module Notification Store

```javascript
import { createNotificationsStore } from '../googlesitekit/data/create-notifications-store';

// Create notifications store for a module
const notificationsStore = createNotificationsStore(
    'modules',           // Store type
    'analytics-4',       // Module identifier
    'notifications',     // API endpoint
    {
        server: true,    // Enable server-side notifications
        storeName: 'modules/analytics-4/notifications'
    }
);

// Register the store
export function registerStore(registry) {
    registry.registerStore(notificationsStore.STORE_NAME, notificationsStore);
}
```

### Using Module Notifications

```javascript
import { useSelect } from 'googlesitekit-data';

function ModuleNotifications() {
    const notifications = useSelect((select) =>
        select('modules/analytics-4/notifications').getNotifications()
    );
    
    const isLoading = useSelect((select) =>
        !select('modules/analytics-4/notifications').hasFinishedResolution('getNotifications')
    );
    
    if (isLoading) {
        return <LoadingSpinner />;
    }
    
    return (
        <div>
            {notifications?.map((notification) => (
                <NotificationFromServer 
                    key={notification.id} 
                    notification={notification} 
                />
            ))}
        </div>
    );
}
```

## View Context Integration

### Context-Aware Notifications

```javascript
import useViewContext from '../hooks/useViewContext';
import useViewOnly from '../hooks/useViewOnly';

function ContextAwareNotification({ id, Notification }) {
    const viewContext = useViewContext();
    const isViewOnly = useViewOnly();
    
    // Different content based on context
    const getTitle = () => {
        if (isViewOnly) {
            return __('Limited Access Dashboard', 'google-site-kit');
        }
        
        switch (viewContext) {
            case VIEW_CONTEXT_MAIN_DASHBOARD:
                return __('Main Dashboard Notice', 'google-site-kit');
            case VIEW_CONTEXT_ENTITY_DASHBOARD:
                return __('Page-Specific Notice', 'google-site-kit');
            default:
                return __('General Notice', 'google-site-kit');
        }
    };
    
    const getCTAText = () => {
        return isViewOnly 
            ? __('Request Full Access', 'google-site-kit')
            : __('Configure Settings', 'google-site-kit');
    };
    
    return (
        <Notification>
            <BannerNotification
                notificationID={id}
                title={getTitle()}
                ctaButton={{
                    text: getCTAText(),
                    onClick: isViewOnly ? requestAccess : configureSettings
                }}
            />
        </Notification>
    );
}
```

## Server-Side Notifications

### Server Notification Structure

Server notifications follow a specific format:

```php
// PHP server-side notification example
$notification = [
    'id' => 'server-notification-id',
    'type' => 'warning',
    'title' => 'Server Warning',
    'content' => 'Important server-side message',
    'ctaURL' => 'https://example.com/action',
    'ctaLabel' => 'Take Action',
    'learnMoreURL' => 'https://example.com/docs',
    'dismissExpires' => 86400, // 24 hours
    'showOnce' => false,
];
```

### Rendering Server Notifications

```javascript
import NotificationFromServer from '../components/NotificationFromServer';

function ServerNotificationRenderer({ notification }) {
    return (
        <NotificationFromServer
            notification={notification}
            onView={() => {
                // Track server notification view
                trackEvent('server_notification_view', notification.type, notification.id);
            }}
            onDismiss={() => {
                // Track server notification dismissal
                trackEvent('server_notification_dismiss', notification.type, notification.id);
            }}
        />
    );
}
```

## Advanced Notification Patterns

### Conditional Notification Chains

```javascript
// Register a sequence of related notifications
const registerNotificationChain = () => {
    // Step 1: Initial setup prompt
    registerNotification('setup-step-1', {
        Component: SetupStep1Notification,
        priority: PRIORITY.SETUP_CTA_HIGH,
        areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
        groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
        checkRequirements: async ({ select }) => {
            const isAnalyticsConnected = select(CORE_MODULES).isModuleConnected('analytics-4');
            return !isAnalyticsConnected;
        }
    });
    
    // Step 2: Configuration reminder (shows after step 1 is completed)
    registerNotification('setup-step-2', {
        Component: SetupStep2Notification,
        priority: PRIORITY.SETUP_CTA_HIGH,
        areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
        groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
        checkRequirements: async ({ select }) => {
            const isAnalyticsConnected = select(CORE_MODULES).isModuleConnected('analytics-4');
            const isConfigured = select(MODULES_ANALYTICS_4).isConfigured();
            return isAnalyticsConnected && !isConfigured;
        }
    });
};
```

### Dynamic Notification Content

```javascript
function DynamicNotification({ id, Notification }) {
    const [dynamicContent, setDynamicContent] = useState(null);
    
    useEffect(() => {
        const loadDynamicContent = async () => {
            const response = await api.get('dynamic-notification-content', { id });
            setDynamicContent(response);
        };
        
        loadDynamicContent();
    }, [id]);
    
    if (!dynamicContent) {
        return null;
    }
    
    return (
        <Notification>
            <BannerNotification
                notificationID={id}
                title={dynamicContent.title}
                description={dynamicContent.description}
                ctaButton={dynamicContent.cta ? {
                    text: dynamicContent.cta.text,
                    onClick: () => navigateTo(dynamicContent.cta.url)
                } : undefined}
            />
        </Notification>
    );
}
```

### Notification Queue Management

```javascript
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../googlesitekit/notifications/datastore/constants';

function useNotificationQueue(groupID = NOTIFICATION_GROUPS.DEFAULT) {
    const viewContext = useViewContext();
    const { resetQueue } = useDispatch(CORE_NOTIFICATIONS);
    
    const queuedNotifications = useSelect((select) =>
        select(CORE_NOTIFICATIONS).getQueuedNotifications(viewContext, groupID)
    );
    
    const clearQueue = () => {
        resetQueue(groupID);
    };
    
    const getQueueLength = () => queuedNotifications?.length || 0;
    
    const getNextNotification = () => queuedNotifications?.[0];
    
    return {
        queuedNotifications,
        queueLength: getQueueLength(),
        nextNotification: getNextNotification(),
        clearQueue
    };
}
```

## Best Practices

### Notification Development
1. **Use appropriate layout components** (BannerNotification, NoticeNotification, OverlayNotification)
2. **Follow standard component structure** with proper PropTypes
3. **Implement proper checkRequirements** logic for conditional display
4. **Use meaningful notification IDs** that describe the purpose
5. **Consider view contexts** when registering notifications

### User Experience  
1. **Use appropriate priorities** - errors should have higher priority than info
2. **Make notifications dismissible** unless critical
3. **Limit retry notifications** to avoid annoying users
4. **Provide clear CTAs** with descriptive text
5. **Use progressive disclosure** for complex workflows

### Performance
1. **Implement efficient checkRequirements** functions
2. **Use proper data dependencies** in requirements checks
3. **Avoid expensive operations** in notification rendering
4. **Cache notification states** appropriately
5. **Clean up dismissed notifications** from state

### Analytics
1. **Use consistent tracking categories** across similar notifications
2. **Track all user interactions** (view, dismiss, confirm, learn more)
3. **Include meaningful labels and values** for analytics
4. **Use custom tracking** for specific notification types
5. **Monitor notification performance** and user engagement

### Testing
1. **Test notification requirements** logic thoroughly
2. **Verify dismissal behavior** and retry limits
3. **Test across different view contexts** and user permissions
4. **Mock external dependencies** in requirements checks
5. **Test notification queue ordering** and priority handling

# Feature Flags System

Site Kit uses a comprehensive feature flag system to control the availability of experimental features and gradual rollouts.

## Core Architecture

### Feature Flag Definition
Feature flags are defined in `/feature-flags.json` at the project root:

```json
[
  "adsPax",
  "gtagUserData", 
  "googleTagGateway",
  "privacySandboxModule"
]
```

### Server Integration
Feature flags are passed from the server to the client via a global JavaScript variable:
- `global._googlesitekitBaseData.enabledFeatures` contains the array of enabled feature flags
- This data is set during PHP rendering and made available to the frontend

### JavaScript Implementation
The feature flag system consists of several key files:

#### `/assets/js/features/index.js`
Core feature flag utilities:

```javascript
// Global set of enabled features from server
export const enabledFeatures = new Set(
    global?._googlesitekitBaseData?.enabledFeatures || []
);

// Check if a feature is enabled
export function isFeatureEnabled(
    feature,
    _enabledFeatures = enabledFeatures
) {
    if ( ! ( _enabledFeatures instanceof Set ) ) {
        return false;
    }
    return _enabledFeatures.has( feature );
}
```

#### `/assets/js/hooks/useFeature.js`
React hook for feature flag checking:

```javascript
import { useContext } from '@wordpress/element';
import FeaturesContext from '../components/FeaturesProvider/FeaturesContext';
import { isFeatureEnabled } from '../features';

export function useFeature( feature ) {
    const enabledFeatures = useContext( FeaturesContext );
    return isFeatureEnabled( feature, enabledFeatures );
}
```

#### `/assets/js/components/FeaturesProvider/FeaturesContext.js`
React context for feature flags:

```javascript
import { createContext } from '@wordpress/element';
import { enabledFeatures } from '../../features';

const FeaturesContext = createContext( enabledFeatures );
export default FeaturesContext;
```

## Usage Patterns

### Component Level Feature Flags
Components can conditionally render features based on flags:

```javascript
import { useFeature } from '../../../../hooks/useFeature';

export default function SettingsView() {
    const gtgEnabled = useFeature( 'googleTagGateway' );
    const paxEnabled = useFeature( 'adsPax' );
    
    return (
        <div>
            {gtgEnabled && <GoogleTagGatewaySettings />}
            {paxEnabled && <AdsPaxConfiguration />}
        </div>
    );
}
```

### Notification Level Feature Flags
Notifications can be controlled by feature flags using the `featureFlag` property:

```javascript
// In notification registration
{
    Component: GoogleTagGatewaySetupBanner,
    featureFlag: 'googleTagGateway',
    // other notification properties...
}
```

The notification system automatically checks feature flags when determining which notifications to show:

```javascript
// From shouldNotificationBeAddedToQueue.js
if (
    notification?.featureFlag &&
    ! isFeatureEnabled(
        notification.featureFlag,
        _enabledFeatureFlags ? new Set( _enabledFeatureFlags ) : undefined
    )
) {
    return false;
}
```

## Implementation Guidelines

### Adding New Feature Flags
1. Add the flag name to `/feature-flags.json`
2. Use `useFeature` hook in React components
3. Use `isFeatureEnabled` function in utility code
4. Add `featureFlag` property to notifications if needed

### Best Practices
- Feature flag names should be camelCase
- Use descriptive names that clearly indicate the feature
- Always provide fallback behavior when flags are disabled
- Test both enabled and disabled states
- Remove feature flags and conditional code after full rollout

### Testing
Feature flags support testing through optional parameters:
- `_enabledFeatureFlags` parameter in `isFeatureEnabled` for unit tests
- Context providers can be mocked for component testing
- Notification queue testing supports feature flag simulation

# Feature Tours System

Site Kit includes a comprehensive feature tours system that guides users through new features and interface changes using interactive tooltips powered by `react-joyride`.

## Core Architecture

### Feature Tours Structure

Feature tours are defined as objects with specific properties and stored in `/assets/js/feature-tours/` directory:

```javascript
const myFeatureTour = {
    slug: 'myFeatureTour',                    // Unique identifier
    version: '1.25.0',                       // Site Kit version when tour was added
    contexts: [                              // Where tour can be shown
        VIEW_CONTEXT_MAIN_DASHBOARD,
        VIEW_CONTEXT_ENTITY_DASHBOARD
    ],
    gaEventCategory: 'main_dashboard_tour',   // Analytics category (string or function)
    steps: [                                 // Array of tour steps
        {
            target: '.my-feature-selector',  // CSS selector for target element
            title: 'New Feature Available',   // Step title
            content: 'This is how to use...',// Step content (can be JSX)
            placement: 'bottom',              // Tooltip placement
            cta: <CustomCTAButton />          // Optional custom CTA component
        }
    ],
    checkRequirements: async (registry) => { // Optional requirements function
        const isFeatureEnabled = await registry
            .resolveSelect(CORE_MODULES)
            .isModuleConnected('analytics-4');
        return isFeatureEnabled;
    },
    callback: (data, registry) => {          // Optional callback for tour events
        // Handle tour interactions
    }
};
```

### Feature Tours Registration

Tours are imported and exported from the main tours index:

```javascript
// /assets/js/feature-tours/index.js
import sharedKeyMetrics from './shared-key-metrics';
import myNewTour from './my-new-tour';

export default [
    sharedKeyMetrics,
    myNewTour,
    // Additional tours...
];
```

## State Management

### Core User Datastore Integration

Feature tours are managed through the `CORE_USER` datastore in `/assets/js/googlesitekit/datastore/user/feature-tours.js`:

#### Tour State Properties
```javascript
const initialState = {
    lastDismissedAt: undefined,              // Timestamp of last tour dismissal
    dismissedTourSlugs: undefined,           // Array of dismissed tour slugs
    tours: featureTours,                     // All available tours
    currentTour: undefined,                  // Currently active tour
    shownTour: undefined,                    // Tour shown in current page view
};
```

#### Key Actions
```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';

const { 
    dismissTour,           // Dismiss a tour by slug
    triggerTourForView,    // Trigger tour for specific view context
    triggerOnDemandTour,   // Trigger tour on demand (manual)
    triggerTour            // Set current tour
} = useDispatch(CORE_USER);

// Dismiss a tour permanently
await dismissTour('myTourSlug');

// Trigger tours for current view
await triggerTourForView(VIEW_CONTEXT_MAIN_DASHBOARD);

// Trigger specific tour manually
await triggerOnDemandTour(myTourObject);
```

#### Key Selectors
```javascript
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';

// Get currently active tour
const currentTour = useSelect((select) =>
    select(CORE_USER).getCurrentTour()
);

// Check if specific tour is dismissed
const isTourDismissed = useSelect((select) =>
    select(CORE_USER).isTourDismissed('myTourSlug')
);

// Check if tours are on cooldown (2 hours after last dismissal)
const areToursOnCooldown = useSelect((select) =>
    select(CORE_USER).areFeatureToursOnCooldown()
);

// Get all available tours
const allTours = useSelect((select) =>
    select(CORE_USER).getAllFeatureTours()
);

// Get tour shown in current page view
const shownTour = useSelect((select) =>
    select(CORE_USER).getShownTour()
);
```

### Tour Qualification Logic

Tours must pass several requirements to be shown:

1. **View Context Match**: Tour contexts must include current view context
2. **Version Check**: Tour version must be newer than user's initial Site Kit version
3. **Dismissal Check**: Tour must not have been previously dismissed
4. **Custom Requirements**: Optional `checkRequirements` function must return true
5. **Cooldown Check**: No tours dismissed within last 2 hours

```javascript
// Example tour qualification checking
const tourQualifies = await checkTourRequirements({
    tour,
    viewContext: VIEW_CONTEXT_MAIN_DASHBOARD
});

if (tourQualifies) {
    triggerTour(tour);
}
```

## Tour Components

### FeatureTours Component

Main component that manages tour rendering and lifecycle:

```javascript
import FeatureTours from '../components/FeatureTours';

// Usage in main application
function App() {
    return (
        <div>
            {/* Main app content */}
            <FeatureTours />  {/* Renders active tours */}
        </div>
    );
}
```

#### FeatureTours Implementation Pattern
```javascript
import { useMount } from 'react-use';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import useViewContext from '../hooks/useViewContext';
import TourTooltips from './TourTooltips';

export default function FeatureTours() {
    const viewContext = useViewContext();
    const { triggerTourForView } = useDispatch(CORE_USER);
    
    // Trigger tours on mount
    useMount(() => {
        triggerTourForView(viewContext);
    });
    
    // Get current active tour
    const tour = useSelect((select) =>
        select(CORE_USER).getCurrentTour()
    );
    
    if (!tour) {
        return null;
    }
    
    return (
        <TourTooltips
            tourID={tour.slug}
            steps={tour.steps}
            gaEventCategory={tour.gaEventCategory}
            callback={tour.callback}
        />
    );
}
```

### TourTooltips Component

Renders the actual tour using `react-joyride`:

```javascript
import TourTooltips from '../components/TourTooltips';

<TourTooltips
    tourID="myTourSlug"                    // Unique tour identifier
    steps={[                               // Array of tour steps
        {
            target: '.target-element',     // CSS selector
            title: 'Step Title',           // Step title
            content: 'Step content...',    // Step content
            placement: 'bottom'            // Tooltip placement
        }
    ]}
    gaEventCategory="dashboard_tour"       // Analytics category
    callback={(data, registry) => {       // Optional callback
        // Handle tour events
    }}
/>
```

#### Tour Events and Analytics

TourTooltips automatically tracks tour interactions:

```javascript
// Automatic event tracking
export const GA_ACTIONS = {
    VIEW: 'feature_tooltip_view',          // When tooltip is viewed
    NEXT: 'feature_tooltip_advance',       // When user clicks next
    PREV: 'feature_tooltip_return',        // When user clicks back
    DISMISS: 'feature_tooltip_dismiss',    // When user dismisses tour
    COMPLETE: 'feature_tooltip_complete',  // When tour is completed
};

// Events are automatically tracked when:
trackEvent(gaEventCategory, GA_ACTIONS.VIEW, stepNumber);
trackEvent(gaEventCategory, GA_ACTIONS.COMPLETE, stepNumber);
```

### TourTooltip Component

Custom tooltip component for individual tour steps:

```javascript
import TourTooltip from '../components/TourTooltip';

// Used internally by TourTooltips
function MyCustomTooltip(props) {
    const {
        step,           // Step configuration
        index,          // Current step index
        size,           // Total number of steps
        backProps,      // Back button props
        primaryProps,   // Primary button props
        closeProps,     // Close button props
        tooltipProps    // Tooltip wrapper props
    } = props;
    
    return (
        <div className="tour-tooltip" {...tooltipProps}>
            <h2>{step.title}</h2>
            <div>{step.content}</div>
            {/* Navigation buttons */}
        </div>
    );
}
```

### JoyrideTooltip Component

Alternative tooltip component for simple, single-step tours:

```javascript
import JoyrideTooltip from '../components/JoyrideTooltip';

function SimpleTooltip() {
    return (
        <JoyrideTooltip
            title="Quick Tip"
            content="This is a simple tooltip"
            target=".my-element"
            dismissLabel="Got it"
            placement="bottom"
            disableOverlay={true}
        />
    );
}
```

## Tour Implementation Patterns

### Basic Tour Definition

```javascript
// /assets/js/feature-tours/my-new-feature.js
import { __ } from '@wordpress/i18n';
import { 
    VIEW_CONTEXT_MAIN_DASHBOARD,
    VIEW_CONTEXT_ENTITY_DASHBOARD 
} from '../googlesitekit/constants';

const myNewFeatureTour = {
    slug: 'myNewFeature',
    version: '1.50.0',
    contexts: [
        VIEW_CONTEXT_MAIN_DASHBOARD,
        VIEW_CONTEXT_ENTITY_DASHBOARD
    ],
    gaEventCategory: 'new_feature_tour',
    steps: [
        {
            target: '.new-feature-button',
            title: __('New Feature Available', 'google-site-kit'),
            content: __('Click here to access the new feature.', 'google-site-kit'),
            placement: 'bottom-start'
        },
        {
            target: '.feature-settings',
            title: __('Configure Settings', 'google-site-kit'),
            content: __('Customize the feature to your needs.', 'google-site-kit'),
            placement: 'top'
        }
    ]
};

export default myNewFeatureTour;
```

### Tour with Requirements

```javascript
const conditionalTour = {
    slug: 'conditionalFeature',
    version: '1.45.0',
    contexts: [VIEW_CONTEXT_MAIN_DASHBOARD],
    gaEventCategory: 'conditional_tour',
    steps: [
        {
            target: '.analytics-widget',
            title: __('Analytics Enhancement', 'google-site-kit'),
            content: __('New analytics features are available.', 'google-site-kit'),
            placement: 'bottom'
        }
    ],
    checkRequirements: async (registry) => {
        // Only show if Analytics is connected and has data
        const isAnalyticsConnected = await registry
            .resolveSelect(MODULES_ANALYTICS_4)
            .isConnected();
            
        const hasData = await registry
            .resolveSelect(MODULES_ANALYTICS_4)
            .hasDataForLastMonth();
            
        return isAnalyticsConnected && hasData;
    }
};
```

### Tour with Custom Callback

```javascript
const trackableTour = {
    slug: 'trackableFeature',
    version: '1.48.0',
    contexts: [VIEW_CONTEXT_MAIN_DASHBOARD],
    gaEventCategory: 'trackable_tour',
    steps: [
        {
            target: '.special-feature',
            title: __('Special Feature', 'google-site-kit'),
            content: __('This feature requires special tracking.', 'google-site-kit'),
            placement: 'bottom'
        }
    ],
    callback: (data, registry) => {
        const { action, index, status } = data;
        
        // Custom tracking for specific interactions
        if (action === 'next' && index === 0) {
            registry.dispatch(CORE_USER).setUserProperty(
                'completed_special_tour_step_1',
                true
            );
        }
        
        // Custom completion logic
        if (status === 'finished') {
            registry.dispatch(CORE_UI).setValue(
                'special-feature-tour-completed',
                Date.now()
            );
        }
    }
};
```

### On-Demand Tours

```javascript
// Hook for triggering on-demand tours
import { useChangeMetricsFeatureTourEffect } from '../components/KeyMetrics/hooks/useChangeMetricsFeatureTourEffect';

function KeyMetricsComponent() {
    const renderChangeMetricLink = useSelect((select) => {
        // Logic to determine if change metric link should render
        return shouldShowChangeLink;
    });
    
    // Hook automatically triggers tour when conditions are met
    useChangeMetricsFeatureTourEffect({
        renderChangeMetricLink
    });
    
    return <div>Key metrics content...</div>;
}
```

#### On-Demand Tour Hook Implementation

```javascript
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import sharedKeyMetrics from '../feature-tours/shared-key-metrics';

export function useChangeMetricsFeatureTourEffect({ renderChangeMetricLink }) {
    const keyMetricsSetupCompletedBy = useSelect((select) =>
        select(CORE_SITE).getKeyMetricsSetupCompletedBy()
    );
    
    const currentUserID = useSelect((select) =>
        select(CORE_USER).getID()
    );
    
    const { triggerOnDemandTour } = useDispatch(CORE_USER);
    
    const isUserEligibleForTour = 
        Number.isInteger(keyMetricsSetupCompletedBy) &&
        Number.isInteger(currentUserID) &&
        keyMetricsSetupCompletedBy > 0 &&
        currentUserID !== keyMetricsSetupCompletedBy;
    
    useEffect(() => {
        if (renderChangeMetricLink && isUserEligibleForTour) {
            triggerOnDemandTour(sharedKeyMetrics);
        }
    }, [renderChangeMetricLink, isUserEligibleForTour, triggerOnDemandTour]);
}
```

## Tour Styling and Configuration

### Joyride Styling

Default styles for tours are configured in TourTooltips:

```javascript
export const joyrideStyles = {
    options: {
        arrowColor: '#3c7251',              // Primary green color
        backgroundColor: '#3c7251',         // Primary green color
        overlayColor: 'rgba(0, 0, 0, 0.6)', // Dark overlay
        textColor: '#fff',                  // White text
        zIndex: 20000,                      // High z-index
    },
    spotlight: {
        border: '2px solid #3c7251',        // Green border
        backgroundColor: '#fff',            // White background
    },
};

export const floaterProps = {
    disableAnimation: true,
    styles: {
        arrow: {
            length: 8,
            margin: 56,
            spread: 16,
        },
        floater: {
            filter: 'drop-shadow(rgba(60, 64, 67, 0.3) 0px 1px 2px) drop-shadow(rgba(60, 64, 67, 0.15) 0px 2px 6px)',
        },
    },
};
```

### Tour Localization

```javascript
const joyrideLocale = {
    back: __('Back', 'google-site-kit'),
    close: __('Close', 'google-site-kit'),
    last: __('Got it', 'google-site-kit'),
    next: __('Next', 'google-site-kit'),
};
```

### CSS Classes for Tour State

Tours automatically add CSS classes for styling:

```css
/* Body classes added during tours */
.googlesitekit-showing-feature-tour {
    /* Global tour active styles */
}

.googlesitekit-showing-feature-tour--myTourSlug {
    /* Specific tour active styles */
}

/* Tour component styles */
.googlesitekit-tour-tooltip {
    /* Custom tooltip container styles */
}

.googlesitekit-tooltip-card {
    /* Tooltip card styles */
}

.googlesitekit-tooltip-indicators {
    /* Step indicator styles */
}
```

## Tour Management Features

### Cooldown System

```javascript
// 2-hour cooldown after tour dismissal
export const FEATURE_TOUR_COOLDOWN_SECONDS = 60 * 60 * 2;

// Check if tours are on cooldown
const areToursOnCooldown = useSelect((select) =>
    select(CORE_USER).areFeatureToursOnCooldown()
);

// Tours won't show if cooldown is active
if (areToursOnCooldown) {
    return; // Skip tour triggering
}
```

### Tour Dismissal Tracking

```javascript
// Tours track dismissal at both client and server level
const dismissedTourSlugs = useSelect((select) =>
    select(CORE_USER).getDismissedFeatureTourSlugs()
);

// Dismiss tour permanently
await dismissTour('myTourSlug');

// Check specific tour dismissal
const isTourDismissed = useSelect((select) =>
    select(CORE_USER).isTourDismissed('myTourSlug')
);
```

### Version-Based Tour Qualification

```javascript
// Tours only show to users who installed Site Kit before the tour's version
const initialVersion = await registry
    .resolveSelect(CORE_USER)
    .getInitialSiteKitVersion();

if (compareVersions.compare(initialVersion, tour.version, '>=')) {
    return false; // User already had this feature, skip tour
}
```

## Advanced Tour Patterns

### Dynamic Tour Content

```javascript
const dynamicTour = {
    slug: 'dynamicContent',
    version: '1.52.0',
    contexts: [VIEW_CONTEXT_MAIN_DASHBOARD],
    gaEventCategory: (viewContext) => `${viewContext}_dynamic_tour`,
    steps: [
        {
            target: '.dynamic-element',
            title: __('Dynamic Feature', 'google-site-kit'),
            content: (
                <div>
                    <p>{__('Content can include JSX:', 'google-site-kit')}</p>
                    <ul>
                        <li>{__('Lists', 'google-site-kit')}</li>
                        <li>{__('Links', 'google-site-kit')}</li>
                        <li>{__('Custom components', 'google-site-kit')}</li>
                    </ul>
                </div>
            ),
            placement: 'bottom',
            cta: (
                <Button
                    onClick={() => {
                        // Custom CTA action
                        window.open('https://example.com/docs');
                    }}
                >
                    {__('Learn More', 'google-site-kit')}
                </Button>
            )
        }
    ]
};
```

### Responsive Tour Behavior

```javascript
// Tours can adapt to different screen sizes
function ResponsiveTourStep() {
    const breakpoint = useBreakpoint();
    
    const getPlacement = () => {
        if (breakpoint === BREAKPOINT_SMALL) {
            return 'bottom';
        }
        return 'right';
    };
    
    const getContent = () => {
        if (breakpoint === BREAKPOINT_SMALL) {
            return __('Mobile-specific content', 'google-site-kit');
        }
        return __('Desktop content with more detail', 'google-site-kit');
    };
    
    return {
        target: '.responsive-element',
        title: __('Responsive Feature', 'google-site-kit'),
        content: getContent(),
        placement: getPlacement()
    };
}
```

### Multi-Step Complex Tours

```javascript
const complexTour = {
    slug: 'complexWorkflow',
    version: '1.55.0',
    contexts: [VIEW_CONTEXT_MAIN_DASHBOARD],
    gaEventCategory: 'complex_workflow_tour',
    steps: [
        // Step 1: Introduction
        {
            target: '.workflow-start',
            title: __('New Workflow Available', 'google-site-kit'),
            content: __(
                'We'll guide you through the new workflow in 4 steps.',
                'google-site-kit'
            ),
            placement: 'bottom'
        },
        // Step 2: Configuration
        {
            target: '.configuration-panel',
            title: __('Step 1: Configure Settings', 'google-site-kit'),
            content: (
                <div>
                    <p>{__('First, set up your preferences:', 'google-site-kit')}</p>
                    <ol>
                        <li>{__('Choose your metrics', 'google-site-kit')}</li>
                        <li>{__('Set date ranges', 'google-site-kit')}</li>
                        <li>{__('Configure notifications', 'google-site-kit')}</li>
                    </ol>
                </div>
            ),
            placement: 'left'
        },
        // Step 3: Data review
        {
            target: '.data-preview',
            title: __('Step 2: Review Your Data', 'google-site-kit'),
            content: __(
                'Your configured data will appear here. Take a moment to review it.',
                'google-site-kit'
            ),
            placement: 'top'
        },
        // Step 4: Completion
        {
            target: '.save-workflow',
            title: __('Step 3: Save Your Workflow', 'google-site-kit'),
            content: __(
                'Click here to save your workflow and start using the new features.',
                'google-site-kit'
            ),
            placement: 'bottom-end',
            cta: (
                <Button variant="primary">
                    {__('Save & Continue', 'google-site-kit')}
                </Button>
            )
        }
    ],
    callback: (data, registry) => {
        const { action, index, status } = data;
        
        // Track completion of each major step
        if (action === 'next') {
            const stepNames = ['intro', 'configure', 'review', 'save'];
            registry.dispatch(CORE_USER).setUserProperty(
                `workflow_tour_${stepNames[index]}_completed`,
                true
            );
        }
        
        // Special handling for tour completion
        if (status === 'finished') {
            registry.dispatch(CORE_UI).setValue(
                'complex-workflow-tour-completed',
                Date.now()
            );
            
            // Optionally trigger next workflow step
            registry.dispatch(CORE_UI).setValue(
                'show-workflow-success-message',
                true
            );
        }
    }
};
```

## Testing Tours

### Tour Testing Utilities

```javascript
// Mock tour state in tests
const mockTour = {
    slug: 'testTour',
    version: '1.0.0',
    contexts: [VIEW_CONTEXT_MAIN_DASHBOARD],
    gaEventCategory: 'test_tour',
    steps: [
        {
            target: '.test-element',
            title: 'Test Title',
            content: 'Test content',
            placement: 'bottom'
        }
    ]
};

// Test tour qualification
describe('Tour Qualification', () => {
    it('should qualify tour when requirements are met', async () => {
        registry.dispatch(CORE_USER).receiveCurrentTour(mockTour);
        
        const currentTour = registry.select(CORE_USER).getCurrentTour();
        expect(currentTour).toEqual(mockTour);
    });
    
    it('should not show dismissed tours', async () => {
        registry.dispatch(CORE_USER).receiveGetDismissedTours(['testTour']);
        
        const isDismissed = registry.select(CORE_USER).isTourDismissed('testTour');
        expect(isDismissed).toBe(true);
    });
});
```

### Component Testing

```javascript
// Test TourTooltips component
import { render, fireEvent } from '@testing-library/react';
import TourTooltips from '../TourTooltips';

describe('TourTooltips', () => {
    const mockSteps = [
        {
            target: '.test-target',
            title: 'Test Step',
            content: 'Test content',
            placement: 'bottom'
        }
    ];
    
    it('should render tour steps', () => {
        const { getByText } = render(
            <TourTooltips
                tourID="testTour"
                steps={mockSteps}
                gaEventCategory="test_category"
            />
        );
        
        expect(getByText('Test Step')).toBeInTheDocument();
        expect(getByText('Test content')).toBeInTheDocument();
    });
    
    it('should track events on interaction', () => {
        const mockTrackEvent = jest.fn();
        global.trackEvent = mockTrackEvent;
        
        const { getByText } = render(
            <TourTooltips
                tourID="testTour"
                steps={mockSteps}
                gaEventCategory="test_category"
            />
        );
        
        fireEvent.click(getByText('Next'));
        
        expect(mockTrackEvent).toHaveBeenCalledWith(
            'test_category',
            'feature_tooltip_advance',
            1
        );
    });
});
```

## Best Practices

### Tour Development
1. **Keep tours concise** - Maximum 3-4 steps for better user experience
2. **Use clear, actionable titles** - Tell users what they'll learn
3. **Provide valuable content** - Focus on benefits, not just features
4. **Test target selectors** - Ensure elements exist before tour shows
5. **Consider mobile experience** - Test tours on different screen sizes

### Requirements and Targeting
1. **Be specific with requirements** - Only show tours when truly relevant
2. **Use semantic selectors** - Prefer class names over IDs for targeting
3. **Handle dynamic content** - Account for async loading and state changes
4. **Respect user context** - Show appropriate tours for user's role/permissions
5. **Version appropriately** - Set tour versions to match feature releases

### Analytics and Tracking
1. **Use consistent naming** - Follow established patterns for event categories
2. **Track key interactions** - View, advance, dismiss, and complete events
3. **Monitor tour performance** - Analyze completion rates and drop-off points
4. **Custom tracking for important tours** - Add specific metrics for critical features
5. **A/B test tour content** - Experiment with different messaging and flows

### User Experience
1. **Respect dismissal** - Honor user preferences and cooldown periods
2. **Progressive disclosure** - Introduce features gradually, not all at once
3. **Contextual timing** - Show tours when users are most likely to benefit
4. **Accessible design** - Ensure tours work with screen readers and keyboard navigation
5. **Performance consideration** - Don't impact core functionality with tour overhead

# Event Tracking System

Site Kit implements a comprehensive event tracking system using Google Analytics to measure user interactions and feature usage across the plugin.

## Architecture Overview

The event tracking system consists of several layers:
- **Core Tracking Functions**: `trackEvent()` and `trackEventOnce()` for sending events
- **Data Layer Integration**: Google Tag Manager data layer for event buffering
- **Snippet Management**: Dynamic gtag script injection and configuration
- **Configuration System**: Global tracking settings and user preferences

## Core Tracking Functions

### trackEvent()

The primary function for tracking user interactions:

```javascript
import { trackEvent } from '../util';

// Basic event tracking
await trackEvent(
    'category',    // Event category (required)
    'action',      // Event action (required)
    'label',       // Event label (optional)
    value          // Event value (optional, non-negative integer)
);

// Example: Track widget view
trackEvent( `${viewContext}_pagespeed-widget`, 'widget_view' );

// Example: Track user action with context
trackEvent(
    `${viewContext}_widget-activation-cta`,
    'activate_module',
    moduleSlug
);
```

### trackEventOnce()

Prevents duplicate tracking of the same event during a session:

```javascript
import { trackEventOnce } from '../util';

// Will only track once per session with same parameters
trackEventOnce(
    'setup_flow',
    'step_complete',
    'authentication'
);
```

## Function Parameters

### trackEvent( category, action, label, value )

- **category** (string, required): High-level grouping for the event (e.g., `'main-dashboard_analytics-widget'`)
- **action** (string, required): Specific user action (e.g., `'widget_view'`, `'click_link'`, `'activate_module'`)
- **label** (string, optional): Additional context or identifier (e.g., module slug, widget name)
- **value** (number, optional): Non-negative integer for measurable outcomes (e.g., count, duration)

### Promise-based Execution

Both functions return promises that resolve when the event is sent or timeout:

```javascript
// Async/await pattern
const trackModuleActivation = async () => {
    try {
        await trackEvent('setup', 'module_activated', 'analytics-4');
        // Continue with post-tracking logic
        navigateToNextStep();
    } catch (error) {
        // Event tracking should not block user flow
        console.warn('Tracking failed:', error);
        navigateToNextStep();
    }
};

// Promise pattern
trackEvent('dashboard', 'widget_expand', 'traffic')
    .then(() => {
        // Event tracked successfully
        updateUIState();
    })
    .catch(() => {
        // Handle gracefully - tracking failures shouldn't affect UX
        updateUIState();
    });
```

## Event Naming Conventions

### Category Patterns

Categories follow consistent naming patterns for analytics organization:

```javascript
// View context + widget/component type
`${viewContext}_pagespeed-widget`       // 'main-dashboard_pagespeed-widget'
`${viewContext}_analytics-widget`       // 'entity-dashboard_analytics-widget'
`${viewContext}_setup-flow`            // 'module-page-analytics-4_setup-flow'

// Feature-specific categories
`${viewContext}_shared_key-metrics`     // Feature tours
`${viewContext}_widget-activation-cta`  // Widget activation CTAs
`${viewContext}_audience-segmentation`  // Audience features
```

### Action Standards

Common action names used across the plugin:

```javascript
// Widget interactions
'widget_view'           // Widget enters viewport
'widget_expand'         // Widget expanded/opened
'widget_collapse'       // Widget collapsed/closed
'tab_select'           // Tab selection within widget

// User actions
'click_link'           // External link clicks
'activate_module'      // Module activation
'setup_complete'       // Setup flow completion
'dismiss_notice'       // Notice/banner dismissals

// Feature tours
'feature_tooltip_view'      // Tour step viewed
'feature_tooltip_advance'   // Tour step advanced
'feature_tooltip_dismiss'   // Tour dismissed
'feature_tooltip_complete'  // Tour completed
```

## Integration Patterns

### Component-level Tracking

```javascript
import { useCallback } from '@wordpress/element';
import { trackEvent } from '../../../util';
import useViewContext from '../../../hooks/useViewContext';

export default function WidgetComponent() {
    const viewContext = useViewContext();
    
    const handleExpand = useCallback( async () => {
        await trackEvent(
            `${viewContext}_my-widget`,
            'widget_expand',
            'detailed_view'
        );
        setExpanded( true );
    }, [ viewContext ] );
    
    return (
        <button onClick={handleExpand}>
            View Details
        </button>
    );
}
```

### Hook-based Tracking

```javascript
import { useEffect } from '@wordpress/element';
import { trackEvent } from '../util';

export function useModuleActivationTracking( moduleSlug, isActive ) {
    useEffect( () => {
        if ( isActive ) {
            trackEvent(
                'module_lifecycle',
                'module_activated',
                moduleSlug
            );
        }
    }, [ isActive, moduleSlug ] );
}
```

### Intersection Observer Tracking

```javascript
import { useEffect, useRef } from '@wordpress/element';
import { useInViewSelect } from 'googlesitekit-data';
import { trackEvent } from '../../../util';

export default function TrackableWidget() {
    const widgetRef = useRef();
    const inView = useInViewSelect( widgetRef );
    const hasBeenInView = useRef( false );
    
    useEffect( () => {
        if ( inView && ! hasBeenInView.current ) {
            hasBeenInView.current = true;
            trackEvent(
                `${viewContext}_my-widget`,
                'widget_view'
            );
        }
    }, [ inView, viewContext ] );
    
    return <div ref={widgetRef}>Widget Content</div>;
}
```

## Analytics Configuration

### Global Configuration

Tracking is configured via global JavaScript variables set by PHP:

```javascript
// Global tracking configuration (set by PHP)
const {
    activeModules = [],
    isSiteKitScreen,
    trackingEnabled,
    trackingID,
    referenceSiteURL,
    userIDHash,
    isAuthenticated,
    userRoles,
} = global._googlesitekitTrackingData || {};
```

### Conditional Tracking

Events are only sent when tracking is enabled:

```javascript
// Tracking respects user preferences and configuration
const config = {
    trackingEnabled: true,  // Set via admin settings
    trackingID: 'G-XXXXXXXX',  // Google Analytics measurement ID
    // ... other config
};

// trackEvent automatically checks trackingEnabled before sending
if ( ! config.trackingEnabled ) {
    return; // Event not sent
}
```

## Data Layer Integration

### Google Tag Manager Integration

Events are sent through the Google Tag Manager data layer:

```javascript
// Internal data layer structure
function dataLayerPush() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push( arguments );
}

// Event data structure
const eventData = {
    send_to: 'site_kit',
    event_category: category,
    event_label: label,
    value: value,
    event_callback: callbackFunction
};

dataLayerPush( 'event', action, eventData );
```

### User Properties

Analytics includes user context for segmentation:

```javascript
// User properties sent with events
{
    plugin_version: '1.113.0',
    enabled_features: 'audience-segmentation,key-metrics',
    active_modules: 'analytics-4,search-console,adsense',
    authenticated: '1',
    user_properties: {
        user_roles: 'administrator,editor',
        user_identifier: 'hashed_user_id'
    }
}
```

## Error Handling and Reliability

### Timeout Protection

Events include timeout mechanisms to prevent blocking:

```javascript
// 1-second timeout prevents hanging user interactions
const failTimeout = setTimeout( failCallback, 1000 );

function failCallback() {
    console.warn(
        `Tracking event "${action}" (category "${category}") took too long to fire.`
    );
    resolve(); // Always resolve to not block user flow
}
```

### Client-side Opt-out Support

Respects Google Analytics opt-out browser extension:

```javascript
// Check for client-side opt-out
if ( window._gaUserPrefs?.ioo?.() ) {
    event_callback(); // Immediately resolve
}
```

## Testing and Development

### Testing Tracking Events

```javascript
// Test tracking in development
import { trackEvent } from '../util';

// Mock tracking in tests
jest.mock( '../util', () => ({
    trackEvent: jest.fn().mockResolvedValue(),
    trackEventOnce: jest.fn().mockResolvedValue(),
}));

// Verify tracking calls
expect( trackEvent ).toHaveBeenCalledWith(
    'test_category',
    'test_action',
    'test_label'
);
```

### Debug Mode

Track events without sending to analytics:

```javascript
// Development debugging
const trackEvent = async ( category, action, label, value ) => {
    console.log( 'Track Event:', { category, action, label, value } );
    // Return resolved promise without sending
    return Promise.resolve();
};
```

## Best Practices

1. **Consistent Naming**: Use established category and action patterns
2. **Context Awareness**: Include view context in categories for proper segmentation
3. **Non-blocking**: Never let tracking failures affect user experience
4. **Privacy Respect**: Honor user tracking preferences and opt-out mechanisms
5. **Performance**: Use `trackEventOnce()` for events that shouldn't duplicate
6. **Meaningful Labels**: Provide descriptive labels that aid in data analysis
7. **Error Resilience**: Implement proper error handling and timeouts
8. **Testing**: Mock tracking functions in unit tests to verify event calls

# Module System Architecture

Site Kit implements a modular architecture where each Google service integration is organized as a self-contained module with standardized structure, conventions, and lifecycle management.

## Overview

The module system provides:
- **Standardized Structure**: Consistent organization across all Google service integrations
- **Component Organization**: Logical grouping of UI components by purpose and context
- **Datastore Architecture**: Modular state management with service-specific stores
- **Widget Integration**: Seamless dashboard widget registration and management
- **Notification System**: Module-specific notification and banner management
- **Lifecycle Management**: Standardized setup, settings, and teardown processes

## Module Directory Structure

Each module follows a consistent directory structure under `/assets/js/modules/`:

```
modules/
├── analytics-4/           # Google Analytics 4 integration
├── adsense/              # Google AdSense integration
├── ads/                  # Google Ads integration
├── search-console/       # Google Search Console integration
├── pagespeed-insights/   # PageSpeed Insights integration
├── tagmanager/          # Google Tag Manager integration
├── sign-in-with-google/ # Google Sign-In integration
└── reader-revenue-manager/ # Reader Revenue Manager integration
```

### Individual Module Structure

Each module directory contains standardized subdirectories:

```javascript
module-name/
├── index.js              // Module registration and initialization
├── constants.js          // Module-specific constants
├── components/           // React components organized by purpose
│   ├── common/          // Shared components (forms, selects, switches)
│   ├── dashboard/       // Dashboard-specific widgets and displays
│   ├── settings/        // Settings page components
│   ├── setup/           // Initial setup flow components
│   ├── notifications/   // Notification and banner components
│   ├── widgets/         // Reusable widget components
│   └── module/          // Module page specific components
├── datastore/           // State management stores and logic
│   ├── index.js         // Combined store registration
│   ├── base.js          // Base module store with common functionality
│   ├── settings.js      // Settings-specific store
│   ├── constants.js     // Datastore constants and action types
│   ├── __fixtures__/    // Test data fixtures
│   └── [feature].js     // Feature-specific stores (accounts, reports, etc.)
├── utils/               // Module-specific utility functions
├── hooks/               // Custom React hooks for the module
└── util/                // Legacy utility functions (being migrated to utils/)
```

## Module Registration System

### Main Registration Entry Point

Each module exports standardized registration functions from its `index.js`:

```javascript
// modules/analytics-4/index.js
export { registerStore } from './datastore';

export function registerModule( modules ) {
    modules.registerModule( MODULE_SLUG_ANALYTICS_4, {
        storeName: MODULES_ANALYTICS_4,
        SettingsEditComponent: SettingsEdit,      // Settings form component
        SettingsViewComponent: SettingsView,       // Settings read-only view
        SetupComponent: SetupMain,                 // Initial setup component
        DashboardMainEffectComponent,              // Side effects component
        Icon: AnalyticsIcon,                       // Module icon
        features: [                                // Feature descriptions for disconnect
            __( 'Analytics reports will be disabled', 'google-site-kit' ),
            __( 'Site data will not be sent to Google Analytics', 'google-site-kit' )
        ],
        checkRequirements: async ( registry ) => { // Pre-connection validation
            // Custom requirements checking logic
        }
    } );
}

export function registerWidgets( widgets ) {
    // Widget registration logic
}

export function registerNotifications( notifications ) {
    // Notification registration logic
}
```

### Registration Lifecycle

Modules are registered during application initialization:

1. **Store Registration**: Module datastores are registered with the global registry
2. **Module Registration**: Core module metadata and components are registered
3. **Widget Registration**: Dashboard widgets are registered and assigned to areas
4. **Notification Registration**: Module notifications and banners are registered

## Component Organization Patterns

### Common Components (`components/common/`)

Reusable form controls and shared UI elements:

```javascript
// Standardized component types in common/
├── AccountSelect.js          // Service account selection dropdown
├── PropertySelect.js         // Property/resource selection
├── UseSnippetSwitch.js      // Code snippet inclusion toggle
├── SettingsNotice.js        // Settings page notices
├── ErrorNotices.js          // Error display components
└── ValidationComponents.js  // Form validation displays
```

### Dashboard Components (`components/dashboard/`)

Dashboard-specific widgets and displays:

```javascript
// Dashboard component patterns
├── DashboardOverviewWidget.js    // Primary dashboard widget
├── DashboardDataWidget.js        // Data visualization widgets
├── ConnectCTAWidget.js           // Connection call-to-action widgets
├── SetupCTAWidget.js             // Setup call-to-action widgets
└── WarningWidget.js              // Warning and alert widgets
```

### Settings Components (`components/settings/`)

Settings page management components:

```javascript
// Settings component patterns
├── SettingsEdit.js               // Editable settings form
├── SettingsView.js               // Read-only settings display
├── SettingsForm.js               // Form container and validation
├── SettingsControls.js           // Form control components
└── SettingsSetupIncomplete.js    // Incomplete setup state
```

### Setup Components (`components/setup/`)

Initial module configuration flow:

```javascript
// Setup component patterns
├── SetupMain.js                  // Main setup flow orchestrator
├── SetupForm.js                  // Setup form with validation
├── SetupFormFields.js            // Individual form field components
├── SetupAccount.js               // Account selection step
└── SetupComplete.js              // Setup completion confirmation
```

### Widget Components (`components/widgets/`)

Reusable widget components for key metrics:

```javascript
// Widget component patterns
├── PopularContentWidget.js       // Content performance widgets
├── TrafficSourceWidget.js        // Traffic analysis widgets
├── ConversionWidget.js           // Conversion tracking widgets
├── AudienceWidget.js             // Audience analysis widgets
└── ConnectCTATileWidget.js       // Connection prompt widgets
```

## Datastore Architecture

### Combined Store Pattern

Each module combines multiple specialized stores:

```javascript
// modules/analytics-4/datastore/index.js
import { combineStores } from 'googlesitekit-data';
import baseModuleStore from './base';
import accounts from './accounts';
import properties from './properties';
import settings from './settings';
import report from './report';
import service from './service';

const store = combineStores(
    baseModuleStore,        // Core module functionality
    accounts,               // Account management
    properties,             // Property/resource management
    settings,               // Settings persistence
    report,                 // Data reporting
    service,                // API service calls
    createSnapshotStore( MODULES_ANALYTICS_4 )  // State persistence
);
```

### Base Module Store

All modules extend a base store created with `Modules.createModuleStore()`:

```javascript
// modules/analytics-4/datastore/base.js
import Modules from 'googlesitekit-modules';

const baseModuleStore = Modules.createModuleStore( MODULE_SLUG_ANALYTICS_4, {
    storeName: MODULES_ANALYTICS_4,
    
    // Settings that belong to this module
    settingSlugs: [
        'accountID',
        'propertyID',
        'webDataStreamID',
        'measurementID',
        'useSnippet',
        'trackingDisabled'
    ],
    
    // Settings that cause ownership change when modified by another admin
    ownedSettingsSlugs: [
        'accountID',
        'propertyID',
        'webDataStreamID'
    ],
    
    // Custom validation and submission logic
    submitChanges,
    validateCanSubmitChanges,
    rollbackChanges,
    validateHaveSettingsChanged
} );
```

### Specialized Store Types

Modules typically include several specialized stores:

```javascript
// Account management store
├── accounts.js              // Account listing and selection
├── properties.js            // Property/resource management
├── webdatastreams.js        // Data stream configuration

// Data and reporting stores  
├── report.js                // Analytics reporting
├── service.js               // API service integration
├── tags.js                  // Tag detection and management

// Feature-specific stores
├── audiences.js             // Audience segmentation
├── conversion-reporting.js  // Conversion tracking
├── enhanced-measurement.js  // Enhanced measurement features
```

## Widget Registration Patterns

### Standard Widget Registration

Modules register dashboard widgets with consistent patterns:

```javascript
export function registerWidgets( widgets ) {
    // Primary dashboard widget
    widgets.registerWidget(
        'analyticsAllTrafficGA4',
        {
            Component: DashboardAllTrafficWidgetGA4,
            width: widgets.WIDGET_WIDTHS.FULL,
            priority: 1,
            wrapWidget: false,
            modules: [ MODULE_SLUG_ANALYTICS_4 ],
        },
        [
            AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
            AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
        ]
    );
    
    // Key metrics widgets with conditional activation
    widgets.registerWidget(
        KM_ANALYTICS_POPULAR_CONTENT,
        {
            Component: PopularContentWidget,
            width: widgets.WIDGET_WIDTHS.QUARTER,
            priority: 1,
            wrapWidget: false,
            modules: [ MODULE_SLUG_ANALYTICS_4 ],
            isActive: ( select ) =>
                select( CORE_USER ).isKeyMetricActive(
                    KM_ANALYTICS_POPULAR_CONTENT
                ),
        },
        [ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
    );
}
```

### Multi-Module Widgets

Some widgets depend on multiple modules:

```javascript
// Widget requiring both AdSense and Analytics
widgets.registerWidget(
    'adsenseTopEarningPagesGA4',
    {
        Component: DashboardTopEarningPagesWidgetGA4,
        width: [ widgets.WIDGET_WIDTHS.HALF, widgets.WIDGET_WIDTHS.FULL ],
        priority: 3,
        wrapWidget: false,
        modules: [ MODULE_SLUG_ADSENSE, MODULE_SLUG_ANALYTICS_4 ],
    },
    [ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
);
```

## Notification System Integration

### Module Notifications Export

Modules export notification definitions:

```javascript
export const ANALYTICS_4_NOTIFICATIONS = {
    'audience-segmentation-setup-cta': {
        Component: AudienceSegmentationSetupCTABanner,
        priority: PRIORITY.SETUP_CTA_LOW,
        areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
        groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
        viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
        isDismissible: true,
        checkRequirements: async ( { select, resolveSelect } ) => {
            // Complex requirements checking logic
            const analyticsConnected = await resolveSelect( CORE_MODULES )
                .isModuleConnected( MODULE_SLUG_ANALYTICS_4 );
                
            const configuredAudiences = select( CORE_USER )
                .getConfiguredAudiences();
                
            return analyticsConnected && 
                   configuredAudiences === null;
        }
    },
    
    'enhanced-measurement-notification': {
        Component: EnhancedMeasurementActivationBanner,
        priority: PRIORITY.SETUP_CTA_LOW,
        areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
        isDismissible: true,
        checkRequirements: async ( { select, resolveSelect } ) => {
            // Feature-specific activation logic
        }
    }
};
```

### Notification Registration

Notifications are registered during module initialization:

```javascript
export function registerNotifications( notifications ) {
    for ( const notificationID in ANALYTICS_4_NOTIFICATIONS ) {
        notifications.registerNotification(
            notificationID,
            ANALYTICS_4_NOTIFICATIONS[ notificationID ]
        );
    }
}
```

## Module Lifecycle Management

### Setup Flow Components

Each module provides standardized setup components:

```javascript
// Setup component structure
SetupMain.js              // Main setup orchestrator
├── SetupForm.js          // Form with validation and submission
├── SetupFormFields.js    // Individual field components
├── SetupAccount.js       // Account selection step
└── SetupComplete.js      // Completion confirmation
```

### Settings Management

Settings components follow consistent patterns:

```javascript
// Settings component structure
SettingsEdit.js           // Editable settings form
├── SettingsForm.js       // Form container with validation
├── SettingsView.js       // Read-only settings display
└── SettingsControls.js   // Individual setting controls
```

### Module Requirements Checking

Modules can implement custom requirements validation:

```javascript
export function registerModule( modules ) {
    modules.registerModule( MODULE_SLUG_ADSENSE, {
        // ... other config
        checkRequirements: async ( registry ) => {
            const adBlockerActive = await registry
                .resolveSelect( CORE_USER )
                .isAdBlockerActive();

            if ( adBlockerActive ) {
                const message = registry
                    .select( MODULES_ADSENSE )
                    .getAdBlockerWarningMessage();

                throw {
                    code: ERROR_CODE_ADBLOCKER_ACTIVE,
                    message,
                    data: null,
                };
            }
        },
    } );
}
```

## Module Integration Patterns

### Effect Components

Modules can register effect components for side effects:

```javascript
// DashboardMainEffectComponent for handling module-wide effects
export default function DashboardMainEffectComponent() {
    const { triggerOnDemandTour } = useDispatch( CORE_USER );
    const { syncGoogleTagSettings } = useDispatch( MODULES_ANALYTICS_4 );
    
    useEffect( () => {
        // Sync settings when dashboard loads
        syncGoogleTagSettings();
    }, [] );
    
    // Other side effects
    return null; // Effect components don't render
}
```

### Feature Flag Integration

Modules integrate with the feature flag system:

```javascript
import { useFeature } from '../../hooks/useFeature';

function ConditionalFeatureComponent() {
    const isNewFeatureEnabled = useFeature( 'audienceSegmentation' );
    
    if ( ! isNewFeatureEnabled ) {
        return null;
    }
    
    return <NewFeatureComponent />;
}
```

### Cross-Module Dependencies

Some modules depend on others:

```javascript
// AdSense widgets requiring Analytics 4
widgets.registerWidget(
    KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
    {
        Component: TopEarningContentWidget,
        modules: [ MODULE_SLUG_ADSENSE, MODULE_SLUG_ANALYTICS_4 ],
        isActive: ( select ) => {
            const isAdSenseLinked = select( MODULES_ANALYTICS_4 )
                .getAdSenseLinked();
            return isAdSenseLinked;
        },
    },
    [ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
);
```

## Testing Patterns

### Module Testing Structure

Each module follows consistent testing patterns:

```javascript
// Test file organization
module-name/
├── components/
│   ├── ComponentName.js
│   ├── ComponentName.test.js
│   ├── ComponentName.stories.js
│   └── __snapshots__/
│       └── ComponentName.test.js.snap
├── datastore/
│   ├── store.js
│   ├── store.test.js
│   ├── __fixtures__/
│   │   └── test-data.json
│   └── __factories__/
│       └── data-factories.js
└── utils/
    ├── utility.js
    └── utility.test.js
```

### Component Testing

Components are tested with React Testing Library:

```javascript
import { render, screen } from '@testing-library/react';
import { WithTestRegistry } from '../../../../../tests/js/utils';
import MyWidget from './MyWidget';

describe( 'MyWidget', () => {
    let registry;
    
    beforeEach( () => {
        registry = createTestRegistry();
        // Mock required data
    } );
    
    it( 'should render correctly when module is connected', () => {
        registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
            accountID: 'test-account',
        } );
        
        render(
            <WithTestRegistry registry={ registry }>
                <MyWidget />
            </WithTestRegistry>
        );
        
        expect( screen.getByText( 'Analytics Data' ) ).toBeInTheDocument();
    } );
} );
```

### Datastore Testing

Datastore logic is tested with registry mocking:

```javascript
import { createTestRegistry } from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'Analytics 4 datastore', () => {
    let registry;
    
    beforeEach( () => {
        registry = createTestRegistry();
    } );
    
    it( 'should validate settings correctly', () => {
        const { select } = registry;
        
        registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
            accountID: 'invalid-account',
        } );
        
        expect( () => {
            select( MODULES_ANALYTICS_4 ).validateCanSubmitChanges();
        } ).toThrow( 'Invalid account ID' );
    } );
} );
```

## Module Development Best Practices

### Component Development
1. **Follow naming conventions**: Use consistent component naming across modules
2. **Implement proper loading states**: Handle async data loading gracefully
3. **Use module-specific hooks**: Create custom hooks for common module operations
4. **Handle error states**: Provide meaningful error messages and recovery options
5. **Support responsive design**: Ensure components work across all breakpoints

### Datastore Development  
1. **Use factory patterns**: Leverage createSettingsStore, createFetchStore for consistency
2. **Implement proper validation**: Add both client and server-side validation
3. **Handle async operations**: Use proper error handling and loading states
4. **Cache management**: Implement appropriate caching strategies for API data
5. **State persistence**: Use snapshot stores for preserving user state

### Testing Requirements
1. **Unit test coverage**: Test all datastore selectors and actions
2. **Component testing**: Test user interactions and state changes
3. **Integration testing**: Test module registration and widget functionality
4. **Snapshot testing**: Maintain UI consistency with snapshot tests
5. **Mock external dependencies**: Mock API calls and external services

### Performance Considerations
1. **Lazy loading**: Use code splitting for module components
2. **Data optimization**: Fetch only required data for current context
3. **Memory management**: Properly cleanup subscriptions and effects
4. **Bundle optimization**: Minimize module bundle sizes
5. **Caching strategies**: Implement efficient data caching patterns
