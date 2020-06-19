<?php
/**
 * Site Kit Authentication CLI Commands
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Authentication;

/**
 * Site Kit authentication commands
 * 
 * @since n.e.x.t
 */
class Authentication_CLI_Command extends CLI_Command {

	/**
	 * Logout and revoke refresh token
	 *
	 * ## OPTIONS
	 *
	 * --id=<id>
	 * : User id to disconnect.
	 *
	 * ## EXAMPLES
	 *
	 *     wp google-site-kit auth revoke 11
	 *
	 * @since n.e.x.t
	 *
	 * @access public
	 * @param array $args Array of arguments.
	 * @param array $assoc_args Array of associated arguments.
	 */
	public function revoke( $args, $assoc_args ) {
		$user_id = absint( $assoc_args['id'] );

		$authentication = new Authentication(
			$this->context,
			null,
			new User_Options( null, $user_id ),
			$user_id
		);
		$authentication->disconnect();

		\WP_CLI::success( sprintf( 'User with ID %d successfully disconnected.', $user_id ) );
	}

}
