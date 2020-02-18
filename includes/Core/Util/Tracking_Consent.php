<?php
/**
 * Class Google\Site_Kit\Core\Util\Tracking_Consent
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class managing a user's anonymous usage tracking consent.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Tracking_Consent extends User_Setting {

	/**
	 * The user option name for this setting.
	 *
	 * @var string
	 */
	const OPTION = 'googlesitekit_tracking_optin';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		register_meta(
			'user',
			$this->user_options->get_meta_key( static::OPTION ),
			array(
				'type'         => 'boolean',
				'show_in_rest' => current_user_can( Permissions::SETUP ),
				'single'       => true,
			)
		);
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Whether or not the current user has consented to anonymous tracking.
	 */
	public function get() {
		return (bool) $this->user_options->get( static::OPTION );
	}
}
