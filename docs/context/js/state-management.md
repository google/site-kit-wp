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
