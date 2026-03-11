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
