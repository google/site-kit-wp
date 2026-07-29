<?php
/**
 * Migration for the connected proxy URL setting.
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Connected_Proxy_URL;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Class Migration_N_E_X_T.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Migration_N_E_X_T {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = 'n.e.x.t';

	/**
	 * DB version option name.
	 */
	const DB_VERSION_OPTION = 'googlesitekit_db_version';

	/**
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	protected Options $options;

	/**
	 * Connected_Proxy_URL instance.
	 *
	 * @since n.e.x.t
	 * @var Connected_Proxy_URL
	 */
	protected Connected_Proxy_URL $connected_proxy_url;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context instance.
	 * @param Options $options Optional. Options instance.
	 */
	public function __construct(
		Context $context,
		?Options $options = null
	) {
		$this->options             = $options ?: new Options( $context );
		$this->connected_proxy_url = new Connected_Proxy_URL( $this->options );
	}

	/**
	 * Registers hooks.
	 *
	 * The migration runs at priority 0, so it runs before
	 * `Authentication::check_connected_proxy_url()` at priority 10. That check
	 * reads a plain text value as a URL change, so it needs the stored value
	 * already encoded.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ), 0 );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since n.e.x.t
	 */
	public function migrate() {
		$db_version = $this->options->get( self::DB_VERSION_OPTION );

		if ( ! $db_version || version_compare( $db_version, self::DB_VERSION, '<' ) ) {
			$this->migrate_connected_proxy_url();

			$this->options->set( self::DB_VERSION_OPTION, self::DB_VERSION );
		}
	}

	/**
	 * Migrates a plain text connected proxy URL to the encoded format.
	 *
	 * Earlier plugin versions stored the URL in plain text, which could cause
	 * issues when users/other plugins would search + replace the site URL.
	 * If the user's site URL hasn't been encoded, we encode it as part of
	 * this migration.
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_connected_proxy_url() {
		$stored_url = $this->options->get( Connected_Proxy_URL::OPTION );

		// A plain text URL holds a scheme, so the migration encodes it. An
		// encoded value holds none, because the base64 alphabet holds no colon.
		// Anything else never came from this plugin, and encoding it would
		// present it to every reader as the URL the site connected with.
		if ( ! is_string( $stored_url ) || ! URL::parse( $stored_url, PHP_URL_SCHEME ) ) {
			return;
		}

		$this->connected_proxy_url->set( $stored_url );
	}
}
