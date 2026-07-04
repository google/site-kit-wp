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
