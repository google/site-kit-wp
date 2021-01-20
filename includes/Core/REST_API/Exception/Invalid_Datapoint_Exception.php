<?php
/**
 * Class Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception
 *
 * @package   Google\Site_Kit\Core\REST_API\Exception
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API\Exception;

use Google\Site_Kit\Core\Contracts\WP_Errorable;
use Exception;
use WP_Error;

/**
 * Exception thrown when a request to an invalid datapoint is made.
 *
 * @since 1.9.0
 * @access private
 * @ignore
 */
class Invalid_Datapoint_Exception extends Exception implements WP_Errorable {

	const WP_ERROR_CODE = 'invalid_datapoint';

	/**
	 * Gets the WP_Error representation of this exception.
	 *
	 * @since 1.9.0
	 *
	 * @return WP_Error
	 */
	public function to_wp_error() {
		return new WP_Error(
			static::WP_ERROR_CODE,
			__( 'Invalid datapoint.', 'google-site-kit' ),
			array(
				'status' => 400, // Bad request.
			)
		);
	}
}
