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
 * @since n.e.x.t
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
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter( 'update_option_' . Connected_Proxy_URL::OPTION, $this->get_method_proxy( 'update_option' ) );
	}

	/**
	 * Updates the previous connected proxy URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $old_value Old value of the option.
	 */
	public function update_option( $old_value ) {
		$this->set( $old_value );
	}

}
