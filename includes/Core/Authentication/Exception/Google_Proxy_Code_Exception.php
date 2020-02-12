<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Exception\Google_Proxy_Code_Exception
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Exception;

use Exception;

/**
 * Exception thrown when Google proxy returns an error accompanied with a temporary access code.
 *
 * @since 1.0.0
 * @since 1.2.0 Renamed to Google_Proxy_Code_Exception.
 * @access private
 * @ignore
 */
class Google_Proxy_Code_Exception extends Exception {

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param string  $message     Optional. The exception message. Default empty string.
	 * @param integer $code        Optional. The numeric exception code. Default 0.
	 * @param string  $access_code Optional. Temporary code for an undelegated proxy token. Default empty string.
	 */
	public function __construct( $message = '', $code = 0, $access_code = '' ) {
		parent::__construct( $message, $code );

		$this->access_code = $access_code;
	}

	/**
	 * Gets the temporary access code for an undelegated proxy token.
	 *
	 * @since 1.0.0
	 *
	 * @return string Temporary code.
	 */
	public function getAccessCode() {
		return $this->access_code;
	}
}
