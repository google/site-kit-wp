<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Guards\Site_Connected_Guard
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Guards;

use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Guards\Guard_Interface;

/**
 * Class providing guard logic for site connection.
 *
 * @since 1.133.0
 * @access private
 * @ignore
 */
class Site_Connected_Guard implements Guard_Interface {

	/**
	 * Credentials instance.
	 *
	 * @var Credentials
	 */
	private Credentials $credentials;

	/**
	 * Constructor.
	 *
	 * @since 1.133.0
	 * @param Credentials $credentials Credentials instance.
	 */
	public function __construct( Credentials $credentials ) {
		$this->credentials = $credentials;
	}

	/**
	 * Determines whether the guarded entity can be activated or not.
	 *
	 * @since 1.133.0
	 * @return bool|\WP_Error
	 */
	public function can_activate() {
		return $this->credentials->has();
	}
}
