<?php
/**
 * Class Google\Site_Kit\Core\Tracking\Tracking_Consent
 *
 * @package   Google\Site_Kit\Core\Tracking
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tracking;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class managing a user's anonymous usage tracking consent.
 *
 * @since 1.49.0
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
	 * Gets the value of the setting.
	 *
	 * @since 1.49.0
	 *
	 * @return bool Whether the current user has consented to anonymous tracking.
	 */
	public function get() {
		return (bool) $this->user_options->get( static::OPTION );
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.49.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'boolean';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.49.0
	 *
	 * @return bool The default value.
	 */
	protected function get_default() {
		return false;
	}
}
