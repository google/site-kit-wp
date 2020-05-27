<?php
/**
 * Class Google\Site_Kit\Core\REST_API\Invalid_Datapoint_Exception
 *
 * @package   Google\Site_Kit\Core\REST_API
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API;

use Exception;
use Google\Site_Kit\Core\Contracts\WP_Errorable;
use WP_Error;

/**
 * Exception thrown when an undefined datapoint is requested.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Invalid_Datapoint_Exception extends Exception implements WP_Errorable {

	const WP_ERROR_CODE = 'invalid_datapoint';

	/**
	 * Get the WP_Error representation of this exception.
	 *
	 * @since n.e.x.t
	 *
	 * @return WP_Error
	 */
	public function to_wp_error() {
		return new WP_Error(
			self::WP_ERROR_CODE,
			__( 'Invalid datapoint.', 'google-site-kit' ),
			array( 'status' => 400 )
		);
	}
}
