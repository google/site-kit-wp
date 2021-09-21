<?php
/**
 * Class Google\Site_Kit\Core\Storage\Transients
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\DI\DI_Aware_Interface;
use Google\Site_Kit\Core\DI\DI_Aware_Trait;
use Google\Site_Kit\Core\DI\DI_Entry_Aware_Trait;

/**
 * Class providing access to transients.
 *
 * It uses regular transients or network transients, depending on in which mode the plugin is running.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 *
 * @property-read Context $context Plugin context.
 */
final class Transients implements DI_Aware_Interface {

	use DI_Aware_Trait, DI_Entry_Aware_Trait;

	/**
	 * Gets the value of the given transient.
	 *
	 * @since 1.0.0
	 *
	 * @param string $transient Transient name.
	 * @return mixed Value set for the transient, or false if not set.
	 */
	public function get( $transient ) {
		if ( $this->context->is_network_mode() ) {
			return get_site_transient( $transient );
		}

		return get_transient( $transient );
	}

	/**
	 * Sets the value for a transient.
	 *
	 * @since 1.0.0
	 *
	 * @param string $transient  Transient name.
	 * @param mixed  $value      Transient value. Must be serializable if non-scalar.
	 * @param int    $expiration Optional. Time until expiration in seconds. Default 0 (no expiration).
	 * @return bool True on success, false on failure.
	 */
	public function set( $transient, $value, $expiration = 0 ) {
		if ( $this->context->is_network_mode() ) {
			return set_site_transient( $transient, $value, $expiration );
		}

		return set_transient( $transient, $value, $expiration );
	}

	/**
	 * Deletes the given transient.
	 *
	 * @since 1.0.0
	 *
	 * @param string $transient Transient name.
	 * @return bool True on success, false on failure.
	 */
	public function delete( $transient ) {
		if ( $this->context->is_network_mode() ) {
			return delete_site_transient( $transient );
		}

		return delete_transient( $transient );
	}

}
