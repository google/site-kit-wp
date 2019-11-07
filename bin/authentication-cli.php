<?php
/**
 * Site Kit Authentication CLI Commands
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\CLI;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Authentication;
use WP_CLI;
use WP_CLI_Command;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

WP_CLI::add_command( 'google-site-kit auth', __NAMESPACE__ . '\Authentication_CLI_Command' );

/**
 * Site Kit Authentication CLI Command
 */
class Authentication_CLI_Command extends WP_CLI_Command {

	/**
	 * Logout and revoke refresh token
	 *
	 * @synopsis [--id]
	 * @subcommand revoke
	 * @since      1.0.0
	 *
	 * @param array $args Array of arguments.
	 * @param array $assoc_args Array of associated arguments.
	 */
	public function revoke( $args, $assoc_args ) {
		$user_id = absint( $assoc_args['id'] );

		$authentication = new Authentication(
			new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
			null,
			new User_Options( null, $user_id ),
			$user_id
		);
		$authentication->disconnect();

		WP_CLI::success( sprintf( 'User with ID %d successfully disconnected.', $user_id ) );
	}
}
