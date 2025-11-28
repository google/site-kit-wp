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
