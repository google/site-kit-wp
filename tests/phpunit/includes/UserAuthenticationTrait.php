<?php
/**
 * UserAuthenticationTrait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Token;
use Google\Site_Kit\Core\Storage\User_Options;

trait UserAuthenticationTrait {

	/**
	 * Sets the access token for the specified user.
	 *
	 * @param int    $user_id The user ID to set the access token for.
	 * @param string $access_token The access token to use.
	 */
	protected function set_user_access_token( $user_id, $access_token ) {
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user_id );
		$token        = new Token( $user_options );
		$token->set(
			array(
				'access_token' => $access_token,
			)
		);
	}
}
