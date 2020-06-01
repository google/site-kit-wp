<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Exception\Insufficient_Scopes_Exception
 *
 * @package   Google\Site_Kit\Core\Authentication\Exception
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Exception;

use Exception;
use Google\Site_Kit\Core\Contracts\WP_Errorable;
use WP_Error;

/**
 * Exception thrown when authentication scopes are insufficient for a request.
 *
 * @since 1.9.0
 * @access private
 * @ignore
 */
class Insufficient_Scopes_Exception extends Exception implements WP_Errorable {

	const WP_ERROR_CODE = 'missing_required_scopes';

	/**
	 * OAuth scopes that are required but not yet granted.
	 *
	 * @since 1.9.0
	 *
	 * @var array
	 */
	protected $scopes = array();

	/**
	 * Constructor.
	 *
	 * @since 1.9.0
	 *
	 * @param string    $message  Optional. Exception message.
	 * @param int       $code     Optional. Exception code.
	 * @param Throwable $previous Optional. Previous exception used for chaining.
	 * @param array     $scopes   Optional. Scopes that are missing.
	 */
	public function __construct( $message = '', $code = 0, $previous = null, $scopes = array() ) {
		parent::__construct( $message, $code, $previous );
		$this->set_scopes( $scopes );
	}

	/**
	 * Sets the missing scopes that raised this exception.
	 *
	 * @since 1.9.0
	 *
	 * @param array $scopes OAuth scopes that are required but not yet granted.
	 */
	public function set_scopes( array $scopes ) {
		$this->scopes = $scopes;
	}

	/**
	 * Gets the missing scopes that raised this exception.
	 *
	 * @since 1.9.0
	 *
	 * @return array
	 */
	public function get_scopes() {
		return $this->scopes;
	}

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
			$this->getMessage(),
			array(
				'status' => 403, // Forbidden.
				'scopes' => $this->scopes,
			)
		);
	}
}
