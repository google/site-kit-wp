<?php
/**
 * Class Google\Site_Kit\Core\Validation\Exception\Invalid_Dimensions_Exception
 *
 * @package   Google\Site_Kit\Core\Validation\Exception
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Validation\Exception;

use Google\Site_Kit\Core\Contracts\WP_Errorable;
use DomainException;
use WP_Error;

/**
 * Exception thrown when dimensions are invalid for a report request.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Invalid_Dimensions_Exception extends DomainException implements WP_Errorable {

	const WP_ERROR_CODE = 'invalid_dimensions';

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string    $message      Optional. Exception message.
	 * @param int       $code         Optional. Exception code.
	 * @param Throwable $previous     Optional. Previous exception used for chaining.
	 * @param array     $dimensions   Optional. Dimensions that are invalid.
	 */
	public function __construct( $message = '', $code = 0, $previous = null, $dimensions = array() ) {
		if ( ! isset( $message ) || empty( $message ) ) {
			$message = sprintf(
				/* translators: %s is replaced with a comma separated list of the invalid dimensions. */
				_n(
					'Unsupported dimension requested: %s',
					'Unsupported dimensions requested: %s',
					count( $dimensions ),
					'google-site-kit'
				),
				join(
					/* translators: used between list items, there is a space after the comma. */
					__( ', ', 'google-site-kit' ),
					$dimensions
				)
			);
		}

		parent::__construct( $message, $code, $previous );
	}

	/**
	 * Gets the WP_Error representation of this exception.
	 *
	 * @since n.e.x.t
	 *
	 * @return WP_Error
	 */
	public function to_wp_error() {
		return new WP_Error(
			static::WP_ERROR_CODE,
			$this->getMessage(),
			array(
				'status' => 400, // Bad request.
			)
		);
	}
}
