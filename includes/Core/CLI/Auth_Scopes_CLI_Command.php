<?php

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\CLI\Traits\User_Lookup;
use Google\Site_Kit\Core\Storage\User_Options;
use WP_CLI\Formatter;

/**
 * Manages authentication token.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Auth_Scopes_CLI_Command extends CLI_Command {
	use User_Lookup;

	/**
	 * Gets the authentication scopes.
	 *
	 * ## OPTIONS
	 *
	 * <user>
	 * : User to get the scopes for.
	 *
	 * [--format=<format>]
	 * : Get value in a particular format.
	 * ---
	 * default: table
	 * options:
	 *   - table
	 *   - csv
	 *   - json
	 *   - yaml
	 * ---
	 *
	 * @param $args
	 * @param $assoc_args
	 */
	public function get( $args, $assoc_args ) {
		$identifier = reset( $args );
		$user       = $this->get_user_or_fail( $identifier );

		$user_options = new User_Options( $this->context, $user->ID );
		$oauth_client = new OAuth_Client( $this->context, null, $user_options );

		$required_scopes = $oauth_client->get_required_scopes();
		$granted_scopes  = $oauth_client->get_granted_scopes();
		$all_scopes      = array_unique( array_merge( $required_scopes, $granted_scopes ) );

		$items = array_map(
			function ( $scope ) use ( $required_scopes, $granted_scopes ) {
				$required = in_array( $scope, $required_scopes );
				$granted  = in_array( $scope, $granted_scopes );

				return compact( 'scope', 'required', 'granted' );
			},
			$all_scopes
		);

		$formatter = new Formatter( $assoc_args, array( 'scope', 'required', 'granted' ) );
		$formatter->display_items( $items );
	}
}
