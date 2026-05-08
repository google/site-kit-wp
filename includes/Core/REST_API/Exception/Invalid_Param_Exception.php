<?php
/**
 * Class Invalid_Param_Exception
 *
 * @package   Google\Site_Kit\Core\REST_API\Exception
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API\Exception;

use Exception;
use Google\Site_Kit\Core\Contracts\WP_Errorable;
use WP_Error;

/**
 * Class for representing an invalid parameter.
 *
 * @since 1.124.0
 * @access private
 * @ignore
 */
class Invalid_Param_Exception extends Exception implements WP_Errorable {

	/**
	 * Status code.
	 *
	 * @var int
	 */
	protected $status;

	/**
	 * Constructor.
	 *
	 * @since 1.124.0
	 *
	 * @param string $parameter_name Invalid request parameter name.
	 * @param int    $code           Optional. HTTP Status code of resulting error. Defaults to 400.
	 */
	public function __construct( $parameter_name, $code = 400 ) {
		$this->status = (int) $code;

		parent::__construct(
			/* translators: %s: Invalid parameter */
			sprintf( __( 'Invalid parameter: %s.', 'google-site-kit' ), $parameter_name )
		);
	}

	/**
	 * Gets the WP_Error representation of this exception.
	 *
	 * @since 1.124.0
	 *
	 * @return WP_Error
	 */
	public function to_wp_error() {
		return new WP_Error(
			'rest_invalid_param',
			$this->getMessage(),
			array( 'status' => $this->status )
		);
	}
}
