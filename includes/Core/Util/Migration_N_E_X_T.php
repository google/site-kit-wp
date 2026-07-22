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
 * Class Migration_N_E_X_T
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
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
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
	 * Migrates a plain-text connected proxy URL to the encoded format.
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_connected_proxy_url() {
		if ( ! $this->connected_proxy_url->has() ) {
			return;
		}

		// The getter returns a legacy or an encoded value as plain text, and
		// the setter stores it encoded.
		$this->connected_proxy_url->set( $this->connected_proxy_url->get() );
	}
}
