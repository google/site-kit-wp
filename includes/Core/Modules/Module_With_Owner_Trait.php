<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Owner_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Token;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Trait for a module that includes an owner ID.
 *
 * @since 1.16.0
 * @access private
 * @ignore
 */
trait Module_With_Owner_Trait {
	/**
	 * OAuth_Client instance.
	 *
	 * @since 1.77.0.
	 * @var OAuth_Client
	 */
	protected $owner_oauth_client;

	/**
	 * Gets an owner ID for the module.
	 *
	 * @since 1.16.0
	 *
	 * @return int Owner ID.
	 */
	public function get_owner_id() {
		if ( ! $this instanceof Module_With_Settings ) {
			return 0;
		}

		$settings = $this->get_settings()->get();
		if ( empty( $settings['ownerID'] ) ) {
			return 0;
		}

		return $settings['ownerID'];
	}

	/**
	 * Gets the OAuth_Client instance for the module owner.
	 *
	 * @since 1.77.0
	 *
	 * @return OAuth_Client OAuth_Client instance.
	 */
	public function get_owner_oauth_client() {
		if ( $this->owner_oauth_client instanceof OAuth_Client ) {
			return $this->owner_oauth_client;
		}

		$user_options = new User_Options( $this->context, $this->get_owner_id() );

		$this->owner_oauth_client = new OAuth_Client(
			$this->context,
			$this->options,
			$user_options,
			$this->authentication->credentials(),
			$this->authentication->get_google_proxy(),
			new Profile( $user_options ),
			new Token( $user_options )
		);

		return $this->owner_oauth_client;
	}
}
