<?php
/**
 * Site Kit Authentication CLI Commands
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Core\CLI\Traits\User_Lookup;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Authentication\Authentication;
use WP_CLI;

/**
 * Manages Site Kit user authentication for Google APIs.
 *
 * @since 1.11.0
 * @access private
 * @ignore
 */
class Authentication_CLI_Command extends CLI_Command {
	use User_Lookup;

	/**
	 * Disconnects a user from Site Kit, removing their relevant user options and revoking their token.
	 *
	 * ## OPTIONS
	 *
	 * [<user>]
	 * : User to disconnect.
	 *
	 * [--id=<id>]
	 * : User ID to disconnect. Deprecated: use <user> instead.
	 *
	 * ## EXAMPLES
	 *
	 *     wp google-site-kit auth disconnect wapuu
	 *
	 *     wp google-site-kit auth disconnect wapuu.wordpress@gmail.com
	 *
	 *     wp google-site-kit auth disconnect 123
	 *
	 * @alias revoke
	 *
	 * @since 1.11.0
	 * @since n.e.x.t Deprecated `id` option.
	 *
	 * @param array $args Array of arguments.
	 * @param array $assoc_args Array of associated arguments.
	 */
	public function disconnect( $args, $assoc_args ) {
		$identifier = reset( $args );

		if ( isset( $assoc_args['id'] ) ) {
			WP_CLI::warning( 'Using the --id= option is deprecated; use <user> instead.' );
			$user_id = $this->get_user_or_fail( $assoc_args['id'] )->ID;
		} else if ( $identifier ) {
			$user_id = $this->get_user_or_fail( $identifier )->ID;
		} else {
			WP_CLI::error( 'Please specify the user to be disconnected.' );
		}

		$authentication = new Authentication(
			$this->context,
			new Options( $this->context ),
			new User_Options( $this->context, $user_id ),
			new Transients( $this->context )
		);
		$authentication->disconnect();

		WP_CLI::success( sprintf( 'User with ID %d successfully disconnected.', $user_id ) );
	}

}
