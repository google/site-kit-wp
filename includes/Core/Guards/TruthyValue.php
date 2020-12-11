<?php
/**
 * Class Google\Site_Kit\Core\Guards\TruthyValue
 *
 * @package   Google\Site_Kit\Core\Guards
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Guards;

/**
 * Guard that verifies that provided value is truthy.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class TruthyValue implements Guard_Interface {

	/**
	 * Value to verify.
	 *
	 * @since n.e.x.t
	 * @var mixed
	 */
	private $value;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Value to verify.
	 */
	public function __construct( $value ) {
		$this->value = $value;
	}

	/**
	 * Determines whether the guarded entity can be activated or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool|WP_Error TRUE if guarded entity can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		$value = $this->value;
		if ( is_callable( $value ) ) {
			$value = call_user_func( $value );
		}

		return ! is_wp_error( $value ) && ! empty( $value );
	}

}
