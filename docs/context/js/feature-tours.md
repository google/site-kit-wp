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
