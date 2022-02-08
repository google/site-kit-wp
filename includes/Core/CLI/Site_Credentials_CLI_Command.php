<?php

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use WP_CLI\Formatter;
use function WP_CLI\Utils\get_flag_value;

/**
 * Manages site credentials.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Site_Credentials_CLI_Command extends CLI_Command {

	/**
	 * Credentials instance.
	 *
	 * @since n.e.x.t
	 * @var Credentials
	 */
	protected $credentials;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 * @param Context $context Context instance.
	 */
	public function __construct( Context $context ) {
		parent::__construct( $context );

		$options           = new Options( $context );
		$this->credentials = new Credentials( new Encrypted_Options( $options ) );
	}

	/**
	 * Gets the current site credentials.
	 *
	 * ## OPTIONS
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
		$credentials = $this->credentials->get();

		if ( 'var_export' === get_flag_value( $assoc_args, 'format' ) ) {
			echo var_export( $credentials, true ) . PHP_EOL;
			return;
		}

		$formatter  = new Formatter( $assoc_args, array( 'oauth2_client_id', 'oauth2_client_secret' ) );
		$formatter->display_item( $credentials );
	}
}
