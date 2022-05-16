<?php
/**
 * Trait Google\Site_Kit\Core\CLI\Traits\CLI_Auth
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI\Traits;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Token;
use Google\Site_Kit\Core\Storage\User_Options;
use WP_CLI;

trait CLI_Auth {
	/**
	 * Requires the current user to be set or raise an error.
	 *
	 * @since n.e.x.t
	 *
	 * @throws WP_CLI\ExitException
	 */
	protected function require_auth_or_fail( $scopes = null ) {
		if ( ! is_user_logged_in() ) {
			WP_CLI::error( 'This command requires authentication. Use --user=<user> to specify the user context.' );
		}

		$token = new Token( new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		if ( ! $token->has() ) {
			WP_CLI::error( 'This command requires authentication but the current user lacks an access token. Please sign in with Google with this user or use a different user.' );
		}

		// if ( ! $this->authentication->get_oauth_client()->has_sufficient_scopes( $scopes ) ) {
		// $key = wp_generate_uuid4();
		// set_transient( 'googlesitekit_cli_oauth_key', $key, MINUTE_IN_SECONDS );
		// $connect_url = add_query_arg(
		// [
		// 'action'            => 'googlesitekit_cli_connect',
		// 'cli_key'           => $key,
		// 'additional_scopes' => rawurlencode_deep( $scopes ),
		// ],
		// admin_url( 'index.php' )
		// );
		// WP_CLI::error( "Additional scopes required! $connect_url" );
		// }
	}
}
