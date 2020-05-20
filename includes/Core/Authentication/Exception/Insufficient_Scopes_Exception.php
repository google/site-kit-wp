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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Insufficient_Scopes_Exception extends Exception implements WP_Errorable {

	const WP_ERROR_CODE = 'missing_required_scopes';

	/**
	 * OAuth scopes that are required but not yet granted.
	 *
	 * @since n.e.x.t
	 *
	 * @var array
	 */
	protected $scopes = array();

	/**
	 * Sets the missing scopes that raised this exception.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $scopes OAuth scopes that are required but not yet granted.
	 */
	public function set_scopes( array $scopes ) {
		$this->scopes = $scopes;
	}

	/**
	 * Gets the missing scopes that raised this exception.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_scopes() {
		return $this->scopes;
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
				'status' => 401, // Unauthorized.
				'scopes' => $this->scopes,
			)
		);
	}
}
