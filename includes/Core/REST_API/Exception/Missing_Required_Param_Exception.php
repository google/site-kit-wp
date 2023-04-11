<?php
/**
 * Class Missing_Required_Param_Exception
 *
 * @package   Google\Site_Kit\Core\REST_API\Exception
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API\Exception;

use Exception;
use Google\Site_Kit\Core\Contracts\WP_Errorable;
use WP_Error;

/**
 * Class for representing a missing required parameter.
 *
 * @since 1.98.0
 * @access private
 * @ignore
 */
class Missing_Required_Param_Exception extends Exception implements WP_Errorable {

	/**
	 * Status code.
	 *
	 * @var int
	 */
	protected $status;

	/**
	 * Constructor.
	 *
	 * @since 1.98.0
	 *
	 * @param string $parameter_name Missing request parameter name.
	 * @param int    $code           Optional. HTTP Status code of resulting error. Defaults to 400.
	 */
	public function __construct( $parameter_name, $code = 400 ) {
		$this->status = (int) $code;

		parent::__construct(
			/* translators: %s: Missing parameter name */
			sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), $parameter_name )
		);
	}

	/**
	 * Gets the WP_Error representation of this exception.
	 *
	 * @since 1.98.0
	 *
	 * @return WP_Error
	 */
	public function to_wp_error() {
		return new WP_Error(
			'missing_required_param',
			$this->getMessage(),
			array( 'status' => $this->status )
		);
	}
}
