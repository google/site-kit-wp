<?php

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use WP_CLI;
use WP_CLI\Formatter;

/**
 * Manages site fields.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Site_Fields_CLI_Command extends CLI_Command {

	/**
	 * Credentials instance.
	 *
	 * @since n.e.x.t
	 * @var Credentials
	 */
	protected $credentials;

	/**
	 * Google Proxy instance.
	 *
	 * @since n.e.x.t
	 * @var Google_Proxy
	 */
	protected $google_proxy;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 * @param Context $context Context instance.
	 */
	public function __construct( Context $context ) {
		parent::__construct( $context );

		$options            = new Options( $context );
		$this->credentials  = new Credentials( new Encrypted_Options( $options ) );
		$this->google_proxy = new Google_Proxy( $context );
	}

	/**
	 * Gets the site fields.
	 *
	 * ## OPTIONS
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
	 */
	public function get() {
		$this->validate_using_proxy();

		$fields = $this->google_proxy->get_site_fields();

		$formatter  = new Formatter( $assoc_args, array_keys( $fields ) );
		$formatter->display_item( $fields );
	}

	/**
	 * Syncs the site fields.
	 */
	public function sync() {
		$this->validate_using_proxy();

		$response = $this->google_proxy->sync_site_fields( $this->credentials, 'sync' );

		if ( is_wp_error( $response ) ) {
			WP_CLI::error( $response );
		}

		WP_CLI::success( 'Site fields synchronized!' );
		WP_CLI::print_value( $response );
	}

	protected function validate_using_proxy() {
		if ( ! $this->credentials->using_proxy() ) {
			WP_CLI::error( 'Site fields are only relevant for sites connected using the Site Kit service.' );
		}
	}
}
