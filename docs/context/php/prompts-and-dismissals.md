# Prompts and Dismissals

Site Kit provides two complementary systems for managing user interactions with UI elements: **Prompts** for feature announcements with display tracking, and **Dismissals** for simple hide/show behavior.

## Overview

### Purpose

-   **Prompts System**: Modal notifications and feature announcements that track how many times they've been shown
-   **Dismissals System**: Notices, banners, and UI elements that can be permanently or temporarily hidden

### Key Differences

| Feature             | Prompts                       | Dismissals                                |
| ------------------- | ----------------------------- | ----------------------------------------- |
| **Use Case**        | Feature announcements, modals | Notices, banners, pointers                |
| **Data Tracked**    | Expiration + display count    | Expiration only                           |
| **Return Type**     | Object with metadata          | Array of slug strings                     |
| **Display Count**   | Yes (increments on dismiss)   | No                                        |
| **Helper Methods**  | None                          | `is_dismissed()`, `get_dismissed_items()` |
| **Introduced**      | v1.121.0                      | v1.37.0                                   |
| **Delete Endpoint** | No                            | Yes (v1.133.0+)                           |

## Prompts System

**Location**: `includes/Core/Prompts/`

The Prompts system tracks both expiration time and display count for important messages.

### Architecture

```
Prompts (orchestrator)
    └── Dismissed_Prompts (storage via User_Setting)
        └── REST_Prompts_Controller (API endpoints)
```

### Storage

**User Meta Key**: `googlesitekitpersistent_dismissed_prompts`

**Data Structure**:

```php
[
    'prompt-slug' => [
        'expires' => 0,  // 0 = permanent, Unix timestamp = expiration
        'count'   => 1,  // Number of times dismissed
    ],
    'another-prompt' => [
        'expires' => 1735689600,
        'count'   => 2,
    ],
]
```

### Dismissed_Prompts Class

**Location**: `includes/Core/Prompts/Dismissed_Prompts.php:1-139`

Storage layer extending `User_Setting`.

```php
final class Dismissed_Prompts extends User_Setting {
    const OPTION = 'googlesitekitpersistent_dismissed_prompts';
    const DISMISS_PROMPT_PERMANENTLY = 0;

    /**
     * Add or update a dismissed prompt.
     *
     * @param string $prompt              Prompt slug.
     * @param int    $expires_in_seconds  Expiration in seconds (0 = permanent).
     * @return bool True on success.
     */
    public function add( $prompt, $expires_in_seconds = self::DISMISS_PROMPT_PERMANENTLY ) {
        $prompts = $this->get();

        if ( isset( $prompts[ $prompt ] ) ) {
            // Increment count if already exists
            $prompts[ $prompt ]['count']++;
        } else {
            // Initialize new prompt
            $prompts[ $prompt ] = array(
                'count' => 1,
            );
        }

        // Set expiration
        if ( 0 === $expires_in_seconds ) {
            $prompts[ $prompt ]['expires'] = 0;
        } else {
            $prompts[ $prompt ]['expires'] = time() + $expires_in_seconds;
        }

        return $this->set( $prompts );
    }

    /**
     * Remove a dismissed prompt.
     *
     * @param string $prompt Prompt slug.
     * @return bool True on success.
     */
    public function remove( $prompt ) {
        $prompts = $this->get();

        if ( isset( $prompts[ $prompt ] ) ) {
            unset( $prompts[ $prompt ] );
            return $this->set( $prompts );
        }

        return true;
    }

    /**
     * Get all dismissed prompts.
     *
     * @return array Dismissed prompts with metadata.
     */
    public function get() {
        return parent::get() ?: array();
    }

    /**
     * Get default value.
     *
     * @return array Empty array.
     */
    protected function get_default() {
        return array();
    }

    /**
     * Sanitize prompts data.
     *
     * @param array $prompts Prompts data.
     * @return array Sanitized prompts.
     */
    protected function sanitize_callback( $prompts ) {
        if ( ! is_array( $prompts ) ) {
            return array();
        }

        $sanitized = array();

        foreach ( $prompts as $key => $value ) {
            if ( ! is_string( $key ) || ! is_array( $value ) ) {
                continue;
            }

            // Ensure required keys exist
            if ( ! isset( $value['expires'], $value['count'] ) ) {
                continue;
            }

            $sanitized[ $key ] = array(
                'expires' => (int) $value['expires'],
                'count'   => (int) $value['count'],
            );
        }

        return $sanitized;
    }
}
```

### REST API Endpoints

**GET `/wp-json/google-site-kit/v1/core/user/data/dismissed-prompts`**

Returns full prompts object with counts and expiration.

**Location**: `includes/Core/Prompts/REST_Prompts_Controller.php:51-75`

```php
public function get_dismissed_prompts( WP_REST_Request $request ) {
    $dismissed_prompts = new Dismissed_Prompts( $this->user_options );

    return new WP_REST_Response( $dismissed_prompts->get() );
}
```

**Response Example**:

```json
{
	"ad-blocking-recovery-notification": {
		"expires": 0,
		"count": 1
	},
	"feature-announcement": {
		"expires": 1735689600,
		"count": 2
	}
}
```

**POST `/wp-json/google-site-kit/v1/core/user/data/dismiss-prompt`**

Dismiss a prompt with optional expiration.

**Location**: `includes/Core/Prompts/REST_Prompts_Controller.php:84-120`

```php
public function dismiss_prompt( WP_REST_Request $request ) {
    $data = $request['data'];

    $slug       = $data['slug'];
    $expiration = isset( $data['expiration'] )
        ? (int) $data['expiration']
        : Dismissed_Prompts::DISMISS_PROMPT_PERMANENTLY;

    $dismissed_prompts = new Dismissed_Prompts( $this->user_options );
    $dismissed_prompts->add( $slug, $expiration );

    return new WP_REST_Response( $dismissed_prompts->get() );
}
```

**Request Body**:

```json
{
	"data": {
		"slug": "ad-blocking-recovery-notification",
		"expiration": 2592000
	}
}
```

**Parameters**:

| Parameter    | Type   | Required | Description                              |
| ------------ | ------ | -------- | ---------------------------------------- |
| `slug`       | string | Yes      | Prompt identifier                        |
| `expiration` | int    | No       | Seconds until expiration (0 = permanent) |

### Usage Examples

#### PHP: Reset Prompt with Display Limit

**Location**: `includes/Modules/AdSense.php:1148-1156`

```php
public function reset_ad_blocking_recovery_notification() {
    $dismissed_prompts = new Dismissed_Prompts( $this->user_options );

    $current_dismissals = $dismissed_prompts->get();

    // Only remove if shown less than 3 times
    if ( isset( $current_dismissals['ad-blocking-recovery-notification'] )
         && $current_dismissals['ad-blocking-recovery-notification']['count'] < 3 ) {
        $dismissed_prompts->remove( 'ad-blocking-recovery-notification' );
    }
}
```

#### JavaScript: Check Dismissal Status

**Location**: `assets/js/modules/adsense/components/dashboard/AdBlockingRecoverySetupCTAWidget.js:79-94`

```javascript
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

function AdBlockingRecoveryWidget() {
	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isPromptDismissed(
			'ad-blocking-recovery-notification'
		)
	);

	const dismissCount = useSelect( ( select ) =>
		select( CORE_USER ).getPromptDismissCount(
			'ad-blocking-recovery-notification'
		)
	);

	// Don't show after 3 dismissals
	if ( dismissCount >= 3 ) {
		return null;
	}

	// Don't show if currently dismissed
	if ( isDismissed ) {
		return null;
	}

	const { dismissPrompt } = useDispatch( CORE_USER );

	const handleDismiss = () => {
		// Dismiss for 30 days
		dismissPrompt( 'ad-blocking-recovery-notification', {
			expiresInSeconds: 30 * 24 * 60 * 60,
		} );
	};

	return (
		<Widget onDismiss={ handleDismiss }>
			Ad Blocking Recovery content
		</Widget>
	);
}
```

### JavaScript Datastore

**Location**: `assets/js/googlesitekit/datastore/user/prompts.js`

#### Actions

```javascript
/**
 * Dismiss a prompt.
 *
 * @param {string} slug    Prompt slug.
 * @param {Object} options Options object.
 * @param {number} options.expiresInSeconds Expiration in seconds (0 = permanent).
 */
*dismissPrompt( slug, { expiresInSeconds = 0 } = {} )
```

**Example**:

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_USER } from './datastore/user/constants';

const { dismissPrompt } = useDispatch( CORE_USER );

// Permanent dismissal
dismissPrompt( 'my-prompt' );

// Temporary dismissal (24 hours)
dismissPrompt( 'my-prompt', { expiresInSeconds: 86400 } );
```

#### Selectors

```javascript
/**
 * Get all active dismissed prompts (filters expired).
 *
 * @return {Array} Array of prompt slugs.
 */
getDismissedPrompts();

/**
 * Get dismiss count for a prompt.
 *
 * @param {string} slug Prompt slug.
 * @return {number} Number of times dismissed.
 */
getPromptDismissCount( slug );

/**
 * Check if prompt is dismissed.
 *
 * @param {string} slug Prompt slug.
 * @return {boolean} True if dismissed and not expired.
 */
isPromptDismissed( slug );

/**
 * Check if currently dismissing a prompt.
 *
 * @param {string} slug Prompt slug.
 * @return {boolean} True if dismissing.
 */
isDismissingPrompt( slug );
```

**Example**:

```javascript
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from './datastore/user/constants';

function MyComponent() {
	const dismissedPrompts = useSelect( ( select ) =>
		select( CORE_USER ).getDismissedPrompts()
	);
	// Returns: ['prompt-1', 'prompt-2']

	const dismissCount = useSelect( ( select ) =>
		select( CORE_USER ).getPromptDismissCount( 'my-prompt' )
	);
	// Returns: 3

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isPromptDismissed( 'my-prompt' )
	);
	// Returns: true

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingPrompt( 'my-prompt' )
	);
	// Returns: false
}
```

#### Expiration Filtering

**Location**: `assets/js/googlesitekit/datastore/user/prompts.js:158-176`

Prompts are filtered client-side in selectors:

```javascript
getDismissedPrompts( state ) {
    const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

    return Object.entries( state.dismissedPrompts ).reduce(
        ( acc, [ slug, { expires } ] ) => {
            // Include if permanent (0) or not yet expired
            if ( expires === 0 || expires > currentTimeInSeconds ) {
                acc.push( slug );
            }
            return acc;
        },
        []
    );
}
```

## Dismissals System

**Location**: `includes/Core/Dismissals/`

The Dismissals system provides simple hide/show functionality for UI elements.

### Architecture

```
Dismissals (orchestrator)
    └── Dismissed_Items (storage via User_Setting)
        └── REST_Dismissals_Controller (API endpoints)
```

### Storage

**User Meta Key**: `googlesitekitpersistent_dismissed_items`

**Data Structure**:

```php
[
    'item-slug'     => 0,          // 0 = permanent
    'another-item'  => 1735689600, // Unix timestamp = expiration
    'temp-notice'   => 1704067200,
]
```

### Dismissed_Items Class

**Location**: `includes/Core/Dismissals/Dismissed_Items.php:1-185`

Storage layer extending `User_Setting`.

```php
final class Dismissed_Items extends User_Setting {
    const OPTION = 'googlesitekitpersistent_dismissed_items';
    const DISMISS_ITEM_PERMANENTLY = 0;

    /**
     * Add or update a dismissed item.
     *
     * @param string $item               Item slug.
     * @param int    $expires_in_seconds Expiration in seconds (0 = permanent).
     * @return bool True on success.
     */
    public function add( $item, $expires_in_seconds = self::DISMISS_ITEM_PERMANENTLY ) {
        $items = $this->get();

        if ( 0 === $expires_in_seconds ) {
            $items[ $item ] = 0;
        } else {
            $items[ $item ] = time() + $expires_in_seconds;
        }

        return $this->set( $items );
    }

    /**
     * Remove a dismissed item.
     *
     * @param string $item Item slug.
     * @return bool True on success.
     */
    public function remove( $item ) {
        $items = $this->get();

        if ( isset( $items[ $item ] ) ) {
            unset( $items[ $item ] );
            return $this->set( $items );
        }

        return true;
    }

    /**
     * Get all dismissed items (including expired).
     *
     * @return array Dismissed items with expiration values.
     */
    public function get() {
        return parent::get() ?: array();
    }

    /**
     * Check if item is dismissed and not expired.
     *
     * @param string $item Item slug.
     * @return bool True if dismissed and not expired.
     */
    public function is_dismissed( $item ) {
        $items = $this->get();

        if ( ! isset( $items[ $item ] ) ) {
            return false;
        }

        $ttl = $items[ $item ];

        // Check if permanent or not expired
        return self::DISMISS_ITEM_PERMANENTLY === $ttl || $ttl > time();
    }

    /**
     * Get only active dismissed items (filters expired).
     *
     * @return array Array of item slugs.
     */
    public function get_dismissed_items() {
        $items = $this->get();
        return array_keys( $this->filter_dismissed_items( $items ) );
    }

    /**
     * Filter out expired items.
     *
     * @param array $items Items with expiration values.
     * @return array Filtered items.
     */
    private function filter_dismissed_items( $items ) {
        return array_filter(
            $items,
            function ( $ttl ) {
                return self::DISMISS_ITEM_PERMANENTLY === $ttl || $ttl > time();
            }
        );
    }

    /**
     * Get default value.
     *
     * @return array Empty array.
     */
    protected function get_default() {
        return array();
    }

    /**
     * Sanitize items data.
     *
     * @param array $items Items data.
     * @return array Sanitized items.
     */
    protected function sanitize_callback( $items ) {
        if ( ! is_array( $items ) ) {
            return array();
        }

        $sanitized = array();

        foreach ( $items as $key => $value ) {
            if ( ! is_string( $key ) || ! is_numeric( $value ) ) {
                continue;
            }

            $sanitized[ $key ] = (int) $value;
        }

        return $sanitized;
    }
}
```

### REST API Endpoints

**GET `/wp-json/google-site-kit/v1/core/user/data/dismissed-items`**

Returns array of active (non-expired) item slugs.

**Location**: `includes/Core/Dismissals/REST_Dismissals_Controller.php:51-75`

```php
public function get_dismissed_items( WP_REST_Request $request ) {
    $dismissed_items = new Dismissed_Items( $this->user_options );

    return new WP_REST_Response( $dismissed_items->get_dismissed_items() );
}
```

**Response Example**:

```json
[ "item-1", "item-2", "item-3" ]
```

**POST `/wp-json/google-site-kit/v1/core/user/data/dismiss-item`**

Dismiss an item with optional expiration.

**Location**: `includes/Core/Dismissals/REST_Dismissals_Controller.php:84-120`

```php
public function dismiss_item( WP_REST_Request $request ) {
    $data = $request['data'];

    $slug       = $data['slug'];
    $expiration = isset( $data['expiration'] )
        ? (int) $data['expiration']
        : Dismissed_Items::DISMISS_ITEM_PERMANENTLY;

    $dismissed_items = new Dismissed_Items( $this->user_options );
    $dismissed_items->add( $slug, $expiration );

    return new WP_REST_Response( $dismissed_items->get_dismissed_items() );
}
```

**Request Body**:

```json
{
	"data": {
		"slug": "email-reporting-pointer",
		"expiration": 604800
	}
}
```

**DELETE `/wp-json/google-site-kit/v1/core/user/data/dismissed-items`** (v1.133.0+)

Remove multiple dismissed items.

**Location**: `includes/Core/Dismissals/REST_Dismissals_Controller.php:129-165`

```php
public function remove_dismissed_items( WP_REST_Request $request ) {
    $data  = $request['data'];
    $slugs = $data['slugs'];

    $dismissed_items = new Dismissed_Items( $this->user_options );

    foreach ( $slugs as $slug ) {
        $dismissed_items->remove( $slug );
    }

    return new WP_REST_Response( $dismissed_items->get_dismissed_items() );
}
```

**Request Body**:

```json
{
	"data": {
		"slugs": [ "item-1", "item-2" ]
	}
}
```

### Usage Examples

#### PHP: Check Dismissal Status

**Location**: `includes/Core/Email_Reporting/Email_Reporting_Pointer.php:92-157`

```php
final class Email_Reporting_Pointer {
    private $dismissed_items;

    public function __construct(
        Context $context,
        User_Options $user_options,
        User_Email_Reporting_Settings $user_settings
    ) {
        $this->context         = $context;
        $this->user_settings   = $user_settings;
        $this->dismissed_items = new Dismissed_Items( $user_options );
    }

    public function get_email_reporting_pointer() {
        return new Pointer(
            'email-reporting-pointer',
            array(
                'target'          => '#toplevel_page_googlesitekit-dashboard',
                'edge'            => 'left',
                'align'           => 'middle',
                'active_callback' => function () {
                    // Don't show if already dismissed
                    if ( $this->dismissed_items->is_dismissed( 'email-reporting-pointer' ) ) {
                        return false;
                    }

                    // Don't show if email reporting already enabled
                    return ! $this->user_settings->get()['enabled'];
                },
                'content'         => function () {
                    $this->render_pointer_content();
                },
            )
        );
    }

    private function render_pointer_content() {
        ?>
        <h3><?php esc_html_e( 'Email Reporting', 'google-site-kit' ); ?></h3>
        <p>
            <?php esc_html_e( 'Get weekly email reports of your site performance.', 'google-site-kit' ); ?>
        </p>
        <div class="wp-pointer-buttons">
            <button type="button" class="button button-primary" onclick="dismissPointer()">
                <?php esc_html_e( 'Enable Email Reports', 'google-site-kit' ); ?>
            </button>
        </div>
        <?php
    }
}
```

#### PHP: Bulk Remove with Wildcard Matching

**Location**: `includes/Modules/Analytics_4/Reset_Audiences.php:60-130`

```php
const AUDIENCE_SEGMENTATION_DISMISSED_ITEMS = array(
    'audience-segmentation-add-group-notice',
    'setup-success-notification-audiences',
    'settings_visitor_groups_setup_success_notification',
    'audience-segmentation-no-audiences-banner',
    'audience-tile-*',  // Wildcard pattern
);

public function reset_audience_data() {
    $dismissed_items = new Dismissed_Items( $this->user_options );

    foreach ( self::AUDIENCE_SEGMENTATION_DISMISSED_ITEMS as $item ) {
        // Support wildcard matches
        if ( strpos( $item, '*' ) !== false ) {
            $all_items = $dismissed_items->get();
            $pattern   = rtrim( $item, '*' );

            foreach ( array_keys( $all_items ) as $existing_item ) {
                if ( str_starts_with( $existing_item, $pattern ) ) {
                    $dismissed_items->remove( $existing_item );
                }
            }
        } else {
            $dismissed_items->remove( $item );
        }
    }
}
```

#### JavaScript: Dismiss on Button Click

```javascript
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

function MyNotice() {
	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( 'my-notice' )
	);

	const { dismissItem } = useDispatch( CORE_USER );

	if ( isDismissed ) {
		return null;
	}

	const handleDismiss = () => {
		// Permanent dismissal
		dismissItem( 'my-notice' );

		// Or temporary (7 days)
		// dismissItem( 'my-notice', { expiresInSeconds: 604800 } );
	};

	return (
		<Notice onDismiss={ handleDismiss }>Important notice content</Notice>
	);
}
```

### JavaScript Datastore

**Location**: `assets/js/googlesitekit/datastore/user/dismissed-items.js`

#### Actions

```javascript
/**
 * Dismiss an item.
 *
 * @param {string} slug    Item slug.
 * @param {Object} options Options object.
 * @param {number} options.expiresInSeconds Expiration in seconds (0 = permanent).
 */
*dismissItem( slug, { expiresInSeconds = 0 } = {} )

/**
 * Remove dismissed items.
 *
 * @param {...string} slugs Item slugs to remove.
 */
*removeDismissedItems( ...slugs )
```

**Example**:

```javascript
import { useDispatch } from 'googlesitekit-data';
import { CORE_USER } from './datastore/user/constants';

const { dismissItem, removeDismissedItems } = useDispatch( CORE_USER );

// Dismiss item permanently
dismissItem( 'my-item' );

// Dismiss item for 24 hours
dismissItem( 'my-item', { expiresInSeconds: 86400 } );

// Remove dismissed items
removeDismissedItems( 'item-1', 'item-2' );
```

#### Selectors

```javascript
/**
 * Get all active dismissed items (filters expired).
 *
 * @return {Array} Array of item slugs.
 */
getDismissedItems();

/**
 * Check if item is dismissed.
 *
 * @param {string} slug Item slug.
 * @return {boolean} True if dismissed and not expired.
 */
isItemDismissed( slug );

/**
 * Check if currently dismissing an item.
 *
 * @param {string} slug Item slug.
 * @return {boolean} True if dismissing.
 */
isDismissingItem( slug );
```

**Example**:

```javascript
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from './datastore/user/constants';

function MyComponent() {
	const dismissedItems = useSelect( ( select ) =>
		select( CORE_USER ).getDismissedItems()
	);
	// Returns: ['item-1', 'item-2']

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( 'my-item' )
	);
	// Returns: true

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem( 'my-item' )
	);
	// Returns: false
}
```

## When to Use Each System

### Use Prompts When:

-   ✅ You need to track how many times a message has been shown
-   ✅ You want to limit re-display based on count (e.g., "show max 3 times")
-   ✅ You're creating modal dialogs or important feature announcements
-   ✅ You need metadata about dismissal history

**Example Use Cases**:

-   Ad Blocking Recovery notification (limited to 3 shows)
-   Feature announcement modals
-   One-time setup CTAs with display limits
-   Important system notifications

### Use Dismissals When:

-   ✅ You simply need to hide an element once dismissed
-   ✅ You're building notices, pointers, or banners
-   ✅ You need helper methods like `is_dismissed()`
-   ✅ You need bulk removal capability
-   ✅ You want server-side filtering of expired items

**Example Use Cases**:

-   Admin pointers (WordPress tutorials)
-   Setup completion notices
-   Email reporting opt-in banners
-   Audience segmentation notices
-   Newsletter announcements
-   Temporary feature banners

## Integration Patterns

### Pattern 1: Simple Hide on Dismiss

```javascript
function MyBanner() {
	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( 'my-banner' )
	);

	const { dismissItem } = useDispatch( CORE_USER );

	if ( isDismissed ) {
		return null;
	}

	return (
		<Banner onDismiss={ () => dismissItem( 'my-banner' ) }>
			Banner content
		</Banner>
	);
}
```

### Pattern 2: Show with Display Limit

```javascript
function MyModal() {
	const dismissCount = useSelect( ( select ) =>
		select( CORE_USER ).getPromptDismissCount( 'my-modal' )
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isPromptDismissed( 'my-modal' )
	);

	const { dismissPrompt } = useDispatch( CORE_USER );

	// Don't show after 3 dismissals
	if ( dismissCount >= 3 || isDismissed ) {
		return null;
	}

	return (
		<Modal
			onDismiss={ () => {
				// Dismiss for 7 days
				dismissPrompt( 'my-modal', {
					expiresInSeconds: 7 * 24 * 60 * 60,
				} );
			} }
		>
			Modal content
		</Modal>
	);
}
```

### Pattern 3: Reset Dismissals on Setup

```php
public function reset_setup_dismissals() {
    $dismissed_items = new Dismissed_Items( $this->user_options );

    // Remove specific items
    $items_to_reset = array(
        'setup-notice-1',
        'setup-notice-2',
        'welcome-banner',
    );

    foreach ( $items_to_reset as $item ) {
        $dismissed_items->remove( $item );
    }
}
```

### Pattern 4: Conditional Display Based on Status

```php
add_filter(
    'googlesitekit_admin_pointers',
    function ( $pointers ) {
        $dismissed_items = new Dismissed_Items( $this->user_options );

        // Only show if not dismissed and feature is disabled
        if ( ! $dismissed_items->is_dismissed( 'feature-pointer' )
             && ! $this->is_feature_enabled() ) {
            $pointers[] = new Pointer(
                'feature-pointer',
                array(
                    'target'  => '#feature-menu',
                    'content' => 'Check out this feature!',
                )
            );
        }

        return $pointers;
    }
);
```

### Pattern 5: Wildcard Bulk Removal

```php
public function reset_all_widget_dismissals() {
    $dismissed_items = new Dismissed_Items( $this->user_options );
    $all_items       = $dismissed_items->get();

    // Remove all items starting with 'widget-'
    foreach ( array_keys( $all_items ) as $item ) {
        if ( str_starts_with( $item, 'widget-' ) ) {
            $dismissed_items->remove( $item );
        }
    }
}
```

## Expiration and TTL Handling

### Permanent Dismissal

```php
// PHP
$dismissed_items->add( 'my-item' );  // Default: 0 (permanent)
$dismissed_prompts->add( 'my-prompt' );  // Default: 0 (permanent)

// JavaScript
dismissItem( 'my-item' );  // Permanent
dismissPrompt( 'my-prompt' );  // Permanent
```

### Temporary Dismissal

```php
// PHP: Dismiss for 7 days
$dismissed_items->add( 'my-item', 7 * DAY_IN_SECONDS );
$dismissed_prompts->add( 'my-prompt', 7 * DAY_IN_SECONDS );

// JavaScript: Dismiss for 24 hours
dismissItem( 'my-item', { expiresInSeconds: 86400 } );
dismissPrompt( 'my-prompt', { expiresInSeconds: 86400 } );
```

### Expiration Filtering

**Prompts** (client-side):

```javascript
// Filtered in JavaScript selector
const currentTime = Math.floor( Date.now() / 1000 );
if ( expires === 0 || expires > currentTime ) {
	// Include prompt
}
```

**Dismissals** (server-side):

```php
// Filtered in PHP method
if ( self::DISMISS_ITEM_PERMANENTLY === $ttl || $ttl > time() ) {
    // Include item
}
```

## Best Practices

### DO

1. **Use Dismissals for simple hide/show behavior**

    ```javascript
    // Good - simple dismissal
    if (
    	useSelect( ( select ) =>
    		select( CORE_USER ).isItemDismissed( 'banner' )
    	)
    ) {
    	return null;
    }
    ```

2. **Use Prompts when tracking display count**

    ```javascript
    // Good - track how many times shown
    const count = useSelect( ( select ) =>
    	select( CORE_USER ).getPromptDismissCount( 'modal' )
    );
    if ( count >= 3 ) {
    	return null;
    }
    ```

3. **Set appropriate expiration times**

    ```javascript
    // Good - temporary dismissal
    dismissItem( 'update-notice', { expiresInSeconds: 7 * 24 * 60 * 60 } );

    // Good - permanent dismissal for setup completion
    dismissItem( 'setup-complete-notice' );
    ```

4. **Use helper methods for Dismissals**

    ```php
    // Good
    if ( $dismissed_items->is_dismissed( 'my-item' ) ) {
        return;
    }

    // Also good
    $active_items = $dismissed_items->get_dismissed_items();
    ```

5. **Reset dismissals during setup/reset flows**
    ```php
    // Good - clean slate for new setup
    public function reset() {
        $dismissed_items = new Dismissed_Items( $this->user_options );
        $dismissed_items->remove( 'setup-banner' );
        $dismissed_items->remove( 'welcome-notice' );
    }
    ```

### DON'T

1. **Don't use Prompts for simple notices**

    ```javascript
    // Bad - unnecessary complexity
    const count = useSelect( ( select ) =>
    	select( CORE_USER ).getPromptDismissCount( 'simple-banner' )
    );

    // Good - use Dismissals instead
    const isDismissed = useSelect( ( select ) =>
    	select( CORE_USER ).isItemDismissed( 'simple-banner' )
    );
    ```

2. **Don't bypass helper methods**

    ```php
    // Bad - manual filtering
    $items = $dismissed_items->get();
    $is_dismissed = isset( $items['my-item'] ) && ( $items['my-item'] === 0 || $items['my-item'] > time() );

    // Good - use helper
    $is_dismissed = $dismissed_items->is_dismissed( 'my-item' );
    ```

3. **Don't forget to check dismissal status**

    ```javascript
    // Bad - always shows
    return <Notice>Important message</Notice>;

    // Good - respects dismissal
    if ( isDismissed ) return null;
    return <Notice>Important message</Notice>;
    ```

4. **Don't use magic numbers for expiration**

    ```javascript
    // Bad
    dismissItem( 'item', { expiresInSeconds: 604800 } );

    // Good
    const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
    dismissItem( 'item', { expiresInSeconds: WEEK_IN_SECONDS } );
    ```

5. **Don't mix Prompts and Dismissals for the same element**

    ```javascript
    // Bad - confusing
    dismissPrompt( 'banner' );
    dismissItem( 'banner' );

    // Good - choose one system
    dismissItem( 'banner' );
    ```

## Comparison Summary

### Data Structure

**Prompts**:

```php
[ 'slug' => [ 'expires' => 0, 'count' => 1 ] ]
```

**Dismissals**:

```php
[ 'slug' => 0 ]  // Just the expiration timestamp
```

### API Response

**Prompts GET**:

```json
{
	"prompt-1": { "expires": 0, "count": 1 },
	"prompt-2": { "expires": 1735689600, "count": 2 }
}
```

**Dismissals GET**:

```json
[ "item-1", "item-2", "item-3" ]
```

### Common Time Constants

```php
// PHP
const MINUTE_IN_SECONDS = 60;
const HOUR_IN_SECONDS   = 3600;
const DAY_IN_SECONDS    = 86400;
const WEEK_IN_SECONDS   = 604800;
const MONTH_IN_SECONDS  = 2592000;  // 30 days

// JavaScript
const MINUTE_IN_SECONDS = 60;
const HOUR_IN_SECONDS   = 60 * 60;
const DAY_IN_SECONDS    = 24 * 60 * 60;
const WEEK_IN_SECONDS   = 7 * 24 * 60 * 60;
const MONTH_IN_SECONDS  = 30 * 24 * 60 * 60;
```
