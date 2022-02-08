<?php

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Core\Authentication\Token;
use Google\Site_Kit\Core\CLI\Traits\User_Lookup;
use Google\Site_Kit\Core\Storage\User_Options;
use WP_CLI\Formatter;
use function WP_CLI\Utils\get_flag_value;

/**
 * Manages authentication token.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Auth_Token_CLI_Command extends CLI_Command {
	use User_Lookup;

	/**
	 * Gets the authentication token.
	 *
	 * ## OPTIONS
	 *
	 * <user>
	 * : User to get the token for.
	 *
	 * [--format=<format>]
	 * : Get value in a particular format.
	 * ---
	 * default: var_export
	 * options:
	 *   - table
	 *   - csv
	 *   - json
	 *   - yaml
	 *   - var_export
	 * ---
	 *
	 * @param $args
	 * @param $assoc_args
	 */
	public function get( $args, $assoc_args ) {
		$identifier   = reset( $args );
		$user         = $this->get_user_or_fail( $identifier );
		$user_options = new User_Options( $this->context, $user->ID );
		$token        = new Token( $user_options );
		$token_data   = $token->get();

		// Display Token output like an option by default.
		if ( 'var_export' === get_flag_value( $assoc_args, 'format' ) ) {
			echo var_export( $token_data, true ) . PHP_EOL;
			return;
		}

		$formatter  = new Formatter( $assoc_args, array_keys( $token_data ) );
		$formatter->display_item( $token_data );
	}
}
