<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Tracking_Exclusions
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

/**
 * Class that checks whether the `trackingDisabled` setting turns Analytics tracking off for the current request.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Tracking_Exclusions {

	/**
	 * Analytics 4 settings instance.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Settings $settings Analytics 4 settings instance.
	 */
	public function __construct( Settings $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Checks whether Analytics tracking is off for the current request.
	 *
	 * @since 1.1.0
	 * @since 1.121.0 Migrated here from the Analytics (UA) class.
	 * @since n.e.x.t Moved from Analytics_4::is_tracking_disabled().
	 *
	 * @return bool True if tracking is off for the current request, otherwise false.
	 */
	public function is_disabled() {
		$settings = $this->settings->get();

		/**
		 * Filters whether the `trackingDisabled` setting can turn tracking off for the current request.
		 *
		 * @since 1.36.0
		 *
		 * @param bool $allowed Whether the setting can turn tracking off. Default is the `useSnippet` setting.
		 */
		if ( ! apply_filters( 'googlesitekit_allow_tracking_disabled', $settings['useSnippet'] ) ) {
			return false;
		}

		$disable_logged_in_users  = in_array( 'loggedinUsers', $settings['trackingDisabled'], true ) && is_user_logged_in();
		$disable_content_creators = in_array( 'contentCreators', $settings['trackingDisabled'], true ) && current_user_can( 'edit_posts' );

		$disabled = $disable_logged_in_users || $disable_content_creators;

		/**
		 * Filters whether Analytics tracking is off for the current request.
		 *
		 * When it is true in the page head (`wp_head`, or `web_stories_story_head` on a Web Story), Site Kit prints the
		 * Analytics opt-out snippet. For server-side events, Site Kit uses its value from the end of `init`, or from the
		 * first event if that comes earlier, and sends no server-side event in that request when that value is true.
		 *
		 * @since 1.1.0
		 * @since n.e.x.t Also refuses server-side events.
		 *
		 * @param bool $disabled Whether tracking is off.
		 */
		return (bool) apply_filters( 'googlesitekit_analytics_tracking_disabled', $disabled );
	}
}
