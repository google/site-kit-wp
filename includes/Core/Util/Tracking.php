<?php
/**
 * Class Google\Site_Kit\Core\Util\Tracking
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class managing admin tracking.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Tracking extends User_Setting {

	/**
	 * The user option name for this setting.
	 *
	 * @var string
	 */
	const OPTION = 'googlesitekit_tracking_optin';

	const TRACKING_ID = 'UA-130569087-3';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		parent::register();

		add_filter(
			'googlesitekit_inline_base_data',
			function ( $data ) {
				return $this->inline_js_base_data( $data );
			}
		);
	}

	/**
	 * Is tracking active for the current user?
	 *
	 * @since 1.0.0
	 * @since 1.3.0 Tracking is now user-specific.
	 *
	 * @return bool True if tracking enabled, and False if not.
	 */
	public function is_active() {
		return (bool) $this->user_options->get( self::OPTION );
	}

	/**
	 * Modifies the base data to pass to JS.
	 *
	 * @since 1.3.0
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_base_data( $data ) {
		$data['trackingEnabled'] = $this->is_active();
		$data['trackingID']      = self::TRACKING_ID;

		return $data;
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'boolean';
	}

	/**
	 * Gets the visibility of this setting for REST responses.
	 *
	 * Whether data associated with this meta key can be considered public and
	 * should be accessible via the REST API.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool
	 */
	protected function get_show_in_rest() {
		return current_user_can( Permissions::SETUP );
	}
}
