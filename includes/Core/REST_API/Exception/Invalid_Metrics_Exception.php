<?php
/**
 * Class Google\Site_Kit\Core\REST_API\Exception\Invalid_Metrics_Exception
 *
 * @package   Google\Site_Kit\Core\REST_API\Exception
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API\Exception;

use Google\Site_Kit\Core\Contracts\WP_Errorable;
use Exception;
use WP_Error;

/**
 * Exception thrown when metrics are invalid for a report request.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Invalid_Metrics_Exception extends Exception implements WP_Errorable {

	const WP_ERROR_CODE = 'invalid_metrics';

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string    $message   Optional. Exception message.
	 * @param int       $code      Optional. Exception code.
	 * @param Throwable $previous  Optional. Previous exception used for chaining.
	 * @param array     $metrics   Optional. Metrics that are invalid.
	 */
	public function __construct( $message = '', $code = 0, $previous = null, $metrics = array() ) {
		if ( ! isset( $message ) || empty( $message ) ) {
			$message = sprintf(
				/* translators: %s is replaced with a comma separated list of the invalid metrics. */
				_n(
					'Unsupported metric requested: %s',
					'Unsupported metrics requested: %s',
					count( $metrics ),
					'google-site-kit'
				),
				join(
					/* translators: used between list items, there is a space after the comma. */
					__( ', ', 'google-site-kit' ),
					$metrics
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
