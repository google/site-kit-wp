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
 * @since n.e.x.t
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
	 * @since n.e.x.t
	 * @param Credentials $credentials Credentials instance.
	 */
	public function __construct( Credentials $credentials ) {
		$this->credentials = $credentials;
	}

	/**
	 * Determines whether the guarded entity can be activated or not.
	 *
	 * @since n.e.x.t
	 * @return bool|\WP_Error
	 */
	public function can_activate() {
		return $this->credentials->has();
	}
}
