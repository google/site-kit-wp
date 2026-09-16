# Event Tracking System

Site Kit implements a comprehensive event tracking system using Google Analytics to measure user interactions and feature usage across the plugin.

## Architecture Overview

The event tracking system consists of several layers:
- **Core Tracking Functions**: `trackEvent()` and `trackEventOnce()` for sending events
- **Data Layer Integration**: Google Tag Manager data layer for event buffering
- **Snippet Management**: Dynamic gtag script injection and configuration
- **Configuration System**: Global tracking settings and user preferences

The implementation lives in `assets/js/util/tracking/`:
- `index.js` — bootstraps tracking from the global config and re-exports the public API.
- `createTracking.js` — factory that wires up the config, snippet, and event functions.
- `createTrackEvent.js` — builds `trackEvent()`.
- `createInitializeSnippet.js` — injects the gtag `<script>` and pushes the initial `config`.
- `createDataLayerPush.js` — pushes onto the Site Kit data layer.
- `constants.js` — `DATA_LAYER` and `SCRIPT_IDENTIFIER`.

The public functions are also re-exported from `@/js/util`, so most components import
`trackEvent` / `trackEventOnce` from `@/js/util` (or directly from `@/js/util/tracking`).
These files are plain JS today; if migrated to TypeScript, follow the conventions in
`docs/context/js/component-conventions.md`.

## Core Tracking Functions

### trackEvent()

The primary function for tracking user interactions:

```javascript
import { trackEvent } from '@/js/util';

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
import { trackEventOnce } from '@/js/util';

// Will only track once with the same parameters (deduplicated for the page lifetime)
trackEventOnce(
    'setup_flow',
    'step_complete',
    'authentication'
);
```

> Note: `trackEventOnce()` does not return a promise — it fires the underlying
> `trackEvent()` at most once per unique set of arguments (deduplicated via a
> `JSON.stringify` key + Lodash `once`). Use `trackEvent()` directly when you need
> to await the result.

## Function Parameters

### trackEvent( category, action, label, value )

- **category** (string, required): High-level grouping for the event (e.g., `'mainDashboard_analytics-widget'`)
- **action** (string, required): Specific user action (e.g., `'widget_view'`, `'click_link'`, `'activate_module'`)
- **label** (string, optional): Additional context or identifier (e.g., module slug, widget name)
- **value** (number, optional): Non-negative integer for measurable outcomes (e.g., count, duration)

### Promise-based Execution

`trackEvent()` returns a promise that resolves when the event is sent or times out (it
always resolves — it never rejects, so tracking never produces user-facing errors). Note
that `trackEventOnce()` does not return a promise:

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

Categories almost always start with the current view context (from `useViewContext()`)
followed by a widget/feature suffix, so the same widget can be segmented by where it
appears. The view-context value is the raw constant value such as `mainDashboard`,
`entityDashboard`, or `mainDashboardViewOnly` (see `assets/js/googlesitekit/constants.js`).
Real examples:

```javascript
// View context + widget/component type
`${viewContext}_pagespeed-widget`       // 'mainDashboard_pagespeed-widget'
`${viewContext}_adsense-cta-widget`     // 'entityDashboard_adsense-cta-widget'
`${viewContext}_navigation`             // 'mainDashboard_navigation'

// Feature-specific categories
`${viewContext}_shared_key-metrics`     // Feature tour category (see feature-tours/)
`${viewContext}_widget-activation-cta`  // Widget activation CTAs
`${viewContext}_audiences-sidebar`      // Audience segmentation features
```

Feature tours set their category via a `gaEventCategory` callback (e.g.
`assets/js/feature-tours/shared-key-metrics.js`) rather than calling `trackEvent`
directly.

### Action Standards

Actions are lowercase, `snake_case` verbs/identifiers. There is no enforced enum — many
features define their own action names — but reuse an existing action where one fits.
Representative actions actually used in the codebase:

```javascript
// Widget / UI interactions
'widget_view'           // Widget enters viewport
'tab_select'            // Tab selection within a widget
'dismiss_notice'        // Notice/banner dismissals
'dismiss_widget'        // Widget dismissals

// User / setup actions
'activate_module'       // Module activation (e.g. from a widget activation CTA)
'create_account'        // Account creation flows
'view_module_setup'     // Module setup view
'return_to_dashboard'   // Navigation back to the dashboard

// Feature tours (see TourTooltips.js)
'feature_tooltip_view'      // Tour step viewed
'feature_tooltip_advance'   // Tour step advanced
'feature_tooltip_dismiss'   // Tour dismissed
'feature_tooltip_complete'  // Tour completed
```

## Integration Patterns

### Component-level Tracking

```javascript
import { useCallback } from '@wordpress/element';
import { trackEvent } from '@/js/util';
import useViewContext from '@/js/hooks/useViewContext';

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
import { trackEvent } from '@/js/util';

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

To fire a `widget_view` event the first time a widget scrolls into view, observe a
ref with `useIntersection` (from `react-use`) and guard against re-firing. This mirrors
the real pattern in components such as `DashboardPageSpeed` and `AdSenseConnectCTA`.

```javascript
import { useIntersection } from 'react-use';
import { useEffect, useRef, useState } from '@wordpress/element';
import { trackEvent } from '@/js/util';
import useViewContext from '@/js/hooks/useViewContext';

export default function TrackableWidget() {
    const viewContext = useViewContext();
    const trackingRef = useRef();
    const [ hasBeenInView, setHasBeenInView ] = useState( false );

    const intersectionEntry = useIntersection( trackingRef, {
        threshold: 0.25,
    } );
    const inView = !! intersectionEntry?.intersectionRatio;

    useEffect( () => {
        if ( inView && ! hasBeenInView ) {
            trackEvent( `${ viewContext }_my-widget`, 'widget_view' );
            setHasBeenInView( true );
        }
    }, [ inView, viewContext, hasBeenInView ] );

    return <div ref={ trackingRef }>Widget Content</div>;
}
```

## Analytics Configuration

### Global Configuration

Tracking is configured via global JavaScript variables set by PHP:

```javascript
// Global tracking configuration (set by PHP via the `_googlesitekitTrackingData`
// inline global; see Assets::get_inline_tracking_data() and the
// `googlesitekit_inline_tracking_data` filter).
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

// The plugin version is read separately from `global.GOOGLESITEKIT_VERSION`
// (Webpack DefinePlugin replaces it at build time and does not support destructuring).
const pluginVersion = global.GOOGLESITEKIT_VERSION;
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

Events are sent through a dedicated Site Kit data layer (not the default `window.dataLayer`).
The data layer global is `_googlesitekitDataLayer` (exported as `DATA_LAYER` from
`constants.js`):

```javascript
// Internal data layer structure (createDataLayerPush.js).
// NOTE: it must push the `arguments` object itself — using an ES6 spread
// (`...args`) causes tracking events to silently fail. See issue #1181.
function dataLayerPush() {
    target[ DATA_LAYER ] = target[ DATA_LAYER ] || []; // DATA_LAYER === '_googlesitekitDataLayer'
    target[ DATA_LAYER ].push( arguments );
}

// Event data structure (createTrackEvent.js)
const eventData = {
    send_to: 'site_kit',
    event_category: category,
    event_label: label,
    value,
};

dataLayerPush( 'event', action, { ...eventData, event_callback } );
```

### User Properties

When the snippet initializes (`createInitializeSnippet.js`), it pushes a `config` command
that includes plugin/user context for segmentation. The shape is:

```javascript
// dataLayerPush( 'config', config.trackingID, { ... } )
{
    groups: 'site_kit',
    send_page_view: config.isSiteKitScreen,
    domain: referenceSiteURL,
    plugin_version: pluginVersion || '',          // from global.GOOGLESITEKIT_VERSION
    enabled_features: 'audience-segmentation,key-metrics', // Array.from( enabledFeatures ).join( ',' )
    active_modules: 'analytics-4,search-console,adsense',   // activeModules.join( ',' )
    authenticated: isAuthenticated ? '1' : '0',
    user_properties: {
        user_roles: 'administrator,editor', // userRoles.join( ',' ), '' if unavailable
        user_identifier: userIDHash,
    },
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

The common pattern in the codebase is to import the tracking module namespace and spy on
`trackEvent` (see `assets/js/hooks/useActivateModuleCallback.test.js`):

```javascript
import * as tracking from '@/js/util/tracking';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

// ...inside a test:
expect( mockTrackEvent ).toHaveBeenCalledWith(
    'test_category',
    'test_action',
    'test_label'
);
```

Remember to clear the spy between tests (e.g. `mockTrackEvent.mockClear()` in
`beforeEach`). Test files may be `.test.js`, `.test.tsx`, etc.; run a single file with
`npm -w tests/js run test:js -- <path>`.

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
