<?php
/**
 * Migration for v1.0
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class Migration_1_0_0
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
class Migration_1_0_0 {

	/**
	 * Target DB version.
	 */
	const DB_VERSION = '1.0.0';

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	protected $options;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context instance.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
		$this->options = new Options( $context );
	}

	/**
	 * Registers hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since 1.0.0
	 */
	public function migrate() {
		$db_version = $this->options->get( 'googlesitekit_db_version' );

		if ( ! $db_version || version_compare( $db_version, self::DB_VERSION, '<' ) ) {
			$this->migrate_install();

			$this->options->set( 'googlesitekit_db_version', self::DB_VERSION );
		}
	}

	/**
	 * Migrates old credentials and disconnects users.
	 *
	 * @since 1.0.0
	 */
	private function migrate_install() {
		$credentials = ( new Encrypted_Options( $this->options ) )->get( Credentials::OPTION );

		// Credentials can be filtered in so we must also check if there is a saved option present.
		if ( isset( $credentials['oauth2_client_id'] ) && strpos( $credentials['oauth2_client_id'], '.apps.sitekit.withgoogle.com' ) ) {
			$this->options->delete( Credentials::OPTION );
			$this->options->set( Beta_Migration::OPTION_IS_PRE_PROXY_INSTALL, 1 );

			$this->disconnect_users();

			wp_cache_flush();
		}
	}

	/**
	 * Disconnects authenticated users.
	 *
	 * @since 1.0.0
	 */
	private function disconnect_users() {
		global $wpdb;

		// Delete all user data. Tokens will not actually be revoked because
		// of external API requests causing overhead.
		$prefix = 'googlesitekit\_%';
		if ( ! $this->context->is_network_mode() ) {
			$prefix = $wpdb->get_blog_prefix() . $prefix;
		}

		$wpdb->query( // phpcs:ignore WordPress.VIP.DirectDatabaseQuery
			$wpdb->prepare( "DELETE FROM $wpdb->usermeta WHERE meta_key LIKE %s", $prefix )
		);
		wp_cache_flush();
	}
}
