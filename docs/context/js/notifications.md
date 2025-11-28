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
