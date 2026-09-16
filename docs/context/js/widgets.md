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
Contexts represent major dashboard sections or pages. Their slugs are defined as
constants in `assets/js/googlesitekit/widgets/default-contexts.js`:

```javascript
// Widget contexts are the highest level containers.
import {
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,    // 'mainDashboardTraffic'
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS, // 'mainDashboardKeyMetrics'
	CONTEXT_ENTITY_DASHBOARD_TRAFFIC,   // 'entityDashboardTraffic'
} from '@/js/googlesitekit/widgets/default-contexts';
```

Note: a context slug (e.g. `mainDashboardTraffic`) is distinct from the WordPress
admin page slug `googlesitekit-dashboard` used with `CORE_SITE`'s `getAdminURL`.

#### 2. Areas
Areas are subsections within contexts that group related widgets. Their slugs are
defined as constants in `assets/js/googlesitekit/widgets/default-areas.js`:

```javascript
// Widget areas group widgets within a context.
import {
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,    // 'mainDashboardTrafficPrimary'
	AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY, // 'mainDashboardKeyMetricsPrimary'
	AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY, // 'mainDashboardMonetizationPrimary'
} from '@/js/googlesitekit/widgets/default-areas';
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

Each module registers its widgets via an exported `registerWidgets( widgets )`
function (e.g. `assets/js/modules/analytics-4/widgets/index.js`). The `widgets`
argument is a registry-bound API object created by `createWidgets()`
(`assets/js/googlesitekit/widgets/index.js`) which exposes `registerWidget`,
`registerWidgetArea`, `assignWidget`, `assignWidgetArea`, the
`WIDGET_WIDTHS`/`WIDGET_AREA_STYLES` constants, and the `isWidget*Registered`
checks. These API methods proxy to the underlying `core/widgets`
(`CORE_WIDGETS`) datastore actions documented below; prefer the `widgets` API
when registering from a module.

### Widget Registration

Widgets are registered with the `registerWidget` API method (or the
`CORE_WIDGETS` action of the same name). The third argument optionally assigns
the widget to one or more areas in a single call:

```javascript
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
} from '@/js/hooks/useBreakpoint';
import { AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';

export function registerWidgets( widgets ) {
	widgets.registerWidget(
		'analyticsPopularContent', // Widget slug
		{
			Component: PopularContentWidget,        // React component
			priority: 10,                           // Display priority (lower = higher priority)
			width: widgets.WIDGET_WIDTHS.HALF,      // Width: QUARTER, HALF, FULL
			wrapWidget: true,                       // Whether to wrap with Widget component
			modules: [ 'analytics-4' ],             // Associated modules
			isActive: ( select ) => {               // Activation callback
				return select( CORE_MODULES ).isModuleConnected( 'analytics-4' );
			},
			isPreloaded: ( select ) => {            // Preload callback (requires isActive)
				return select( MODULES_ANALYTICS_4 ).isGatheringData() === false;
			},
			hideOnBreakpoints: [                    // Hide on specific screen sizes
				BREAKPOINT_SMALL,
				BREAKPOINT_TABLET,
			],
		},
		[ AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY ]     // Optional: area slug(s) to assign to
	);
}
```

The same registration can be done directly against the datastore action via
`useDispatch( CORE_WIDGETS ).registerWidget( slug, settings )`, but the datastore
action does not accept the area-assignment argument (use `assignWidget`
separately for that). `registerWidget` also accepts an optional `pdf` setting
(`{ Component, getData, label }`) for widgets that support PDF export.

### Widget Area Registration

Widget areas are registered with the `registerWidgetArea` API method (or the
`CORE_WIDGETS` action of the same name). The third argument optionally assigns
the area to one or more contexts in a single call:

```javascript
import { WIDGET_AREA_STYLES } from '@/js/googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';
import { CONTEXT_MAIN_DASHBOARD_TRAFFIC } from '@/js/googlesitekit/widgets/default-contexts';

export function registerWidgets( widgets ) {
	widgets.registerWidgetArea(
		AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY, // Area slug
		{
			title: 'Traffic insights',        // Area title (optional)
			subtitle: 'How your users found your site', // Subtitle (optional)
			Icon: TrafficIcon,                // Icon component (optional)
			style: WIDGET_AREA_STYLES.BOXES,  // BOXES or COMPOSITE
			priority: 20,                     // Display priority
			hasNewBadge: false,               // Show "new" badge
			CTA: TrafficCTAComponent,         // Call-to-action component (optional)
			Footer: TrafficFooterComponent,   // Footer component (optional)
			pdfTitle: 'Traffic',              // Short title for PDF export (optional)
			filterActiveWidgets: ( select, areaWidgets ) => { // Custom filtering
				return areaWidgets.filter( ( widget ) =>
					select( CORE_WIDGETS ).isWidgetActive( widget.slug )
				);
			},
		},
		[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ]    // Optional: context slug(s) to assign to
	);
}
```

As with `registerWidget`, the underlying `CORE_WIDGETS` action does not accept
the context-assignment argument; use `assignWidgetArea` separately when
dispatching the datastore action directly.

### Widget Assignment to Areas

Widgets are assigned to areas using the `assignWidget` action (or the `widgets`
API method of the same name). Area slugs are the `AREA_*` constants from
`default-areas.js`:

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import {
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
} from '@/js/googlesitekit/widgets/default-areas';

...

const { assignWidget } = useDispatch( CORE_WIDGETS );

// Assign single widget to single area
assignWidget( 'analyticsPopularContent', AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY );

// Assign single widget to multiple areas
assignWidget( 'analyticsPopularContent', [
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
] );
```

### Widget Area Assignment to Contexts

Areas are assigned to contexts using the `assignWidgetArea` action (or the
`widgets` API method of the same name). Context slugs are the `CONTEXT_*`
constants from `default-contexts.js`:

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';
import {
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
	CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';

...

const { assignWidgetArea } = useDispatch( CORE_WIDGETS );

// Assign area to context
assignWidgetArea(
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC
);

// Assign area to multiple contexts
assignWidgetArea( AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY, [
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
	CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

function PopularContentWidget( props ) {
    const { Widget } = props;  // Widget wrapper component passed automatically

    // Use data selectors to fetch required data.
    const reportOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        metrics: [ 'screenPageViews' ],
        dimensions: [ 'pagePath' ],
    };

    const report = useInViewSelect(
        ( select ) => select( MODULES_ANALYTICS_4 ).getReport( reportOptions ),
        [ reportOptions ]
    );

    const loading = useSelect(
        ( select ) =>
            ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
                'getReport',
                [ reportOptions ]
            )
    );

    const error = useSelect( ( select ) =>
        select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
            reportOptions,
        ] )
    );

    // Handle loading state.
    if ( loading ) {
        return <Widget>Loading...</Widget>;
    }

    // Handle error state.
    if ( error ) {
        return <Widget>Error: { error.message }</Widget>;
    }

    // Render widget content.
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

// Use whenActive HOC to show fallback when module is not connected.
export default whenActive( {
    moduleName: 'analytics-4',
    FallbackComponent: ConnectGA4CTATileWidget,
} )( PopularContentWidget );
```

> **TypeScript:** Newer widget components are written in TypeScript (e.g. the
> base `Widget` wrapper is `Widget.tsx`, which types its props with an
> `interface` and an `FC<WidgetProps>` signature). In a `.tsx` widget, replace
> the `propTypes` block with a props `interface`. See
> [`component-conventions.md`](./component-conventions.md) for the authoritative
> TypeScript component conventions.

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

// These components are automatically scoped to the widget slug.
function MyWidget( { Widget, WidgetReportZero, WidgetReportError, widgetSlug } ) {
    const report = useInViewSelect(
        ( select ) => select( MODULES_ANALYTICS_4 ).getReport( reportOptions ),
        [ reportOptions ]
    );

    if ( ! report?.rows?.length ) {
        return <WidgetReportZero />;  // Automatically includes widgetSlug
    }

    return (
        <Widget>  {/* Automatically includes widgetSlug */}
            Widget content
        </Widget>
    );
}
```

The list of scoped props is defined by `getWidgetComponentProps` in
`assets/js/googlesitekit/widgets/util/get-widget-component-props.js`.

### Higher-Order Components for Widgets

#### withWidgetComponentProps
Automatically injects widget props:

```javascript
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';

function BasicWidget( { Widget, WidgetReportError, widgetSlug } ) {
    return <Widget>Content for {widgetSlug}</Widget>;
}

export default withWidgetComponentProps( 'analyticsPopularContent' )( BasicWidget );
```

#### whenActive
Shows widget only when associated module is active:

```javascript
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

function AnalyticsWidget( props ) {
    // Only rendered when Analytics is connected
    return <div>Analytics data</div>;
}

export default whenActive( {
    moduleName: 'analytics-4',
    FallbackComponent: ConnectGA4CTATileWidget,  // Shown when module inactive
} )( AnalyticsWidget );
```

## Widget Rendering System

### Context Renderer

The `WidgetContextRenderer` renders an entire context with its areas and widgets:

```javascript
import WidgetContextRenderer from '@/js/googlesitekit/widgets/components/WidgetContextRenderer';
import { ANCHOR_ID_TRAFFIC } from '@/js/googlesitekit/constants';
import { CONTEXT_MAIN_DASHBOARD_TRAFFIC } from '@/js/googlesitekit/widgets/default-contexts';

function DashboardPage() {
    return (
        <div className="googlesitekit-dashboard">
            <WidgetContextRenderer
                id={ ANCHOR_ID_TRAFFIC }                   // DOM id / scroll anchor
                slug={ CONTEXT_MAIN_DASHBOARD_TRAFFIC }     // Context slug
                className="dashboard-context"
                Header={ DashboardHeader }                 // Optional header component
                Footer={ DashboardFooter }                 // Optional footer component
            />
        </div>
    );
}
```

### Area Renderer

The `WidgetAreaRenderer` renders a specific widget area:

```javascript
import WidgetAreaRenderer from '@/js/googlesitekit/widgets/components/WidgetAreaRenderer';
import { ANCHOR_ID_TRAFFIC } from '@/js/googlesitekit/constants';
import { AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';

function CustomArea() {
    return (
        <WidgetAreaRenderer
            slug={ AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY }
            contextID={ ANCHOR_ID_TRAFFIC }
        />
    );
}
```

### Widget Renderer

Individual widgets are rendered through the `WidgetRenderer`:

```javascript
import WidgetRenderer from '@/js/googlesitekit/widgets/components/WidgetRenderer';

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
// Widget registration with activation logic.
widgets.registerWidget( 'analyticsPopularContent', {
    Component: PopularContentWidget,
    isActive: ( select ) => {
        const isConnected =
            select( CORE_MODULES ).isModuleConnected( 'analytics-4' );
        const isGathering = select( MODULES_ANALYTICS_4 ).isGatheringData();
        return isConnected && isGathering === false;
    },
    isPreloaded: ( select ) => {
        // Keep the widget in the rendered (but hidden) tree so its data is
        // fetched even when it is not active. Requires isActive.
        return select( MODULES_ANALYTICS_4 ).isGatheringData() === true;
    },
} );
```

### Widget State Actions

`setWidgetState` / `unsetWidgetState` are marked `@private` and are used
internally (e.g. via the `useWidgetStateEffect` hook in
`assets/js/googlesitekit/widgets/hooks/`) by components a widget can return,
rather than being called directly from feature code. Widgets can set temporary
state for special rendering:

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
// Get widgets for specific modules only.
const analyticsWidgets = useSelect( ( select ) =>
    select( CORE_WIDGETS ).getWidgets( AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY, {
        modules: [ 'analytics-4', 'search-console' ],
    } )
);

// Check if area is active for specific modules.
const isActiveForModules = useSelect( ( select ) =>
    select( CORE_WIDGETS ).isWidgetAreaActive(
        AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
        {
            modules: [ 'analytics-4' ],
        }
    )
);
```

### Custom Widget Filtering

Areas can implement custom widget filtering:

```javascript
widgets.registerWidgetArea( AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY, {
    title: 'Conditional Widgets',
    // `filterActiveWidgets` receives the registry `select` and the area's
    // already-resolved active widgets, and returns the subset to keep.
    filterActiveWidgets: ( select, areaWidgets ) => {
        return areaWidgets.filter( ( widget ) =>
            select( CORE_WIDGETS ).isWidgetActive( widget.slug )
        );
    },
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
