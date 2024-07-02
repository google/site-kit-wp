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

	/**
	 * Disconnects a user from Site Kit, removing their relevant user options and revoking their token.
	 *
	 * ## OPTIONS
	 *
	 * --id=<id>
	 * : User ID to disconnect.
	 *
	 * ## EXAMPLES
	 *
	 *     wp google-site-kit auth disconnect --id=11
	 *
	 * @alias revoke
	 *
	 * @since 1.11.0
	 *
	 * @param array $args Array of arguments.
	 * @param array $assoc_args Array of associated arguments.
	 */
	public function disconnect( $args, $assoc_args ) {
		$user_id = absint( $assoc_args['id'] );

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
