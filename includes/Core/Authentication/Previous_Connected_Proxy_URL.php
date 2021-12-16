<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Previous_Connected_Proxy_URL
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

/**
 * Previous_Connected_Proxy_URL class.
 *
 * @since 1.48.0
 * @access private
 * @ignore
 */
class Previous_Connected_Proxy_URL extends Connected_Proxy_URL {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = Connected_Proxy_URL::OPTION . '_previous';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.48.0
	 */
	public function register() {
		add_action(
			'update_option_' . Connected_Proxy_URL::OPTION,
			function ( $old_value ) {
				$this->set( $old_value );
			}
		);
	}
}
