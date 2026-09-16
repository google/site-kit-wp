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
import { NOTIFICATION_AREAS } from '@/js/googlesitekit/notifications/constants';

const NOTIFICATION_AREAS = {
    HEADER: 'notification-area-header',                  // Top of page notifications
    DASHBOARD_TOP: 'notification-area-dashboard-top',    // Dashboard banner area
    OVERLAYS: 'notification-area-overlays',              // Full-screen overlay notifications
    SPLASH_CONTENT: 'notification-area-splash-content',  // Splash/setup screen content
};
```

### Notification Groups

Notifications are organized into groups for queue management:

```javascript
import { NOTIFICATION_GROUPS } from '@/js/googlesitekit/notifications/constants';

const NOTIFICATION_GROUPS = {
    DEFAULT: 'default',        // Standard notifications
    SETUP_CTAS: 'setup-ctas',  // Setup call-to-action notifications
};
```

### Priority System

Notifications use a priority system where lower numbers have higher priority:

```javascript
import { PRIORITY } from '@/js/googlesitekit/notifications/constants';

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

Notifications are typically registered up front via the `registerNotification`
action on the `core/notifications` store. The shared defaults live in
`assets/js/googlesitekit/notifications/register-defaults.js` (registered through
`registerDefaults( notificationsAPI )`), and modules register their own via
`createRegisterNotifications` in
`assets/js/googlesitekit/notifications/util/create-register-notifications.js`.

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { NOTIFICATION_AREAS, NOTIFICATION_GROUPS, PRIORITY } from '@/js/googlesitekit/notifications/constants';

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
    checkRequirements: async ({ select, resolveSelect }, viewContext) => {
        // Async callback to determine if the notification should be queued.
        // Receives the full data registry (destructured here as `{ select,
        // resolveSelect, dispatch }`) and the current `viewContext` as the
        // second argument. Return true to show the notification.
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
import BannerNotification, { TYPES } from '@/js/googlesitekit/notifications/components/layout/BannerNotification';

function MyBannerNotification({ id, Notification }) {
    return (
        <Notification>
            <BannerNotification
                notificationID={id}
                type={TYPES.WARNING}  // INFO, WARNING, ERROR
                title="Important Update Required"
                description="Your Analytics connection needs to be updated to continue receiving data."

                learnMoreLink={{
                    href: 'https://example.com/docs',
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

`NoticeNotification` is a TypeScript component (`NoticeNotification.tsx`) that
wraps the shared `Notice` component, so its `type` values come from the
`NOTICE_TYPES` enum (not the `TYPES` export used by `BannerNotification`).

```javascript
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';

function MyNoticeNotification({ id, Notification }) {
    return (
        <Notification>
            <NoticeNotification
                notificationID={id}
                type={NOTICE_TYPES.SUCCESS}  // NEW, SUCCESS, WARNING, INFO, INFO_ALT, INFO_ALT_2, ERROR
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
import OverlayNotification from '@/js/googlesitekit/notifications/components/layout/OverlayNotification';

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
import BannerNotification from '@/js/googlesitekit/notifications/components/layout/BannerNotification';

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

> **TypeScript:** New notification components are written as `.tsx` files (e.g.
> `ActivateAnalyticsNotification.tsx`, `ConnectMoreServicesNotification.tsx`).
> In TS files, replace the `propTypes` block with a props `interface` and type
> the component accordingly. See `docs/context/js/component-conventions.md`
> (the "TypeScript Components" section) for the canonical pattern — both `id`
> and `Notification` are injected automatically by the rendering layer.

### Advanced Notification with Data Integration

```javascript
import { useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

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
import Notifications from '@/js/components/notifications/Notifications';
import { NOTIFICATION_AREAS, NOTIFICATION_GROUPS } from '@/js/googlesitekit/notifications/constants';

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
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { getNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';

function SpecificNotificationRenderer() {
    const notification = useSelect((select) =>
        select(CORE_NOTIFICATIONS).getNotification('my-notification-id')
    );

    if (!notification) {
        return null;
    }

    const { Component } = notification;
    // `getNotificationComponentProps` returns the `{ id, Notification }` props
    // that every notification component expects.
    const props = getNotificationComponentProps('my-notification-id');

    return <Component {...props} />;
}
```

## Notification State Management

### Dismissing Notifications

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';

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
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';

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

The `Notification` wrapper and the layout components (`BannerNotification`,
`NoticeNotification`, `OverlayNotification`) wire these up through
`useNotificationEvents`. The underlying `trackEvent` signature is
`trackEvent( category, action, label, value )`, and the default action names are:

```javascript
// These events are automatically tracked when users interact with notifications.
// `category` defaults to `${viewContext}_${id}` unless overridden via
// `gaTrackingEventArgs.category`.

// View events - when the notification becomes visible.
trackEvent(category, 'view_notification', label, value);

// CTA events - when the user clicks the main action button.
trackEvent(category, 'confirm_notification', label, value);

// Dismiss events - when the user dismisses the notification.
trackEvent(category, 'dismiss_notification', label, value);

// Learn More events - when the user clicks the learn more link.
trackEvent(category, 'click_learn_more_link', label, value);
```

### Custom Tracking

`useNotificationEvents( id, category, actions )` returns an object with
`view`, `confirm`, `dismiss`, and `clickLearnMore` callbacks. Each accepts the
GA event label and value as arguments. The optional third argument overrides the
default action names (`view_notification`, `confirm_notification`,
`dismiss_notification`, `click_learn_more_link`). When `category` is omitted it
defaults to `${viewContext}_${id}`.

```javascript
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';

function TrackedNotification({ id, Notification }) {
    const trackEvents = useNotificationEvents(
        id,
        'Custom Category',  // Event category
        {
            viewAction: 'custom_view',              // Custom view action
            confirmAction: 'custom_confirm',        // Custom confirm action
            dismissAction: 'custom_dismiss',        // Custom dismiss action
            clickLearnMoreAction: 'custom_learn_more', // Custom learn more action
        }
    );

    const handleCustomAction = async () => {
        // Track custom event (args are GA label and value).
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
import { createNotificationsStore } from '@/js/googlesitekit/data/create-notifications-store';

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
import useViewContext from '@/js/hooks/useViewContext';
import useViewOnly from '@/js/hooks/useViewOnly';

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

Server notifications are created with the
`Google\Site_Kit\Core\Notifications\Notification` class (see
`includes/Core/Notifications/Notification.php`). The constructor takes a slug and
a snake_case args array; `prepare_for_js()` converts those into the camelCase
keys consumed by the JS `NotificationFromServer` component:

```php
// PHP server-side notification example.
use Google\Site_Kit\Core\Notifications\Notification;

$notification = new Notification(
    'server-notification-id', // Slug, exposed to JS as `id`.
    array(
        'title'            => 'Server Warning',
        'content'          => 'Important server-side message',
        'cta_url'          => 'https://example.com/action',
        'cta_label'        => 'Take Action',
        'cta_target'       => '_blank',
        'learn_more_url'   => 'https://example.com/docs',
        'learn_more_label' => 'Learn more',
        'dismissible'      => true,
        'dismiss_label'    => 'Dismiss',
    )
);
```

### Rendering Server Notifications

`NotificationFromServer` (see `assets/js/components/NotificationFromServer.js`)
maps the camelCase server fields to the `BannerNotification` layout component. It
expects the server fields spread as individual props (not a single
`notification` object), and supports `onCTAClick` / `onDismissClick` callbacks:

```javascript
import NotificationFromServer from '@/js/components/NotificationFromServer';

function ServerNotificationRenderer({ notification }) {
    return (
        <NotificationFromServer
            id={notification.id}
            title={notification.title}
            content={notification.content}
            ctaLabel={notification.ctaLabel}
            ctaURL={notification.ctaURL}
            ctaTarget={notification.ctaTarget}
            learnMoreLabel={notification.learnMoreLabel}
            learnMoreURL={notification.learnMoreURL}
            dismissible={notification.dismissible}
            dismissLabel={notification.dismissLabel}
            onCTAClick={async () => {
                // Custom CTA handling.
            }}
            onDismissClick={async () => {
                // Custom dismiss handling.
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
