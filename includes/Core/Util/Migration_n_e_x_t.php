<?php
/**
 * Migration for n.e.x.t
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use WP_User;

// phpcs:disable PEAR.NamingConventions.ValidClassName.Invalid

/**
 * Class Migration_n_e_x_t
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Migration_n_e_x_t {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = 'n.e.x.t';

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
	 * User_Options instance.
	 *
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context      $context      Plugin context instance.
	 * @param Options      $options      Optional. Options instance.
	 * @param User_Options $user_options Optional. User_Options instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null
	) {
		$this->context      = $context;
		$this->options      = $options ?: new Options( $context );
		$this->user_options = $user_options ?: new User_Options( $context );
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
		$db_version = $this->options->get( 'googlesitekit_db_version' );

		if ( ! $db_version || version_compare( $db_version, self::DB_VERSION, '<' ) ) {
			$this->migrate_tracking_opt_in();

			$this->options->set( 'googlesitekit_db_version', self::DB_VERSION );
		}
	}

	/**
	 * Migrates the global tracking opt-in to a user option.
	 *
	 * @since n.e.x.t
	 */
	private function migrate_tracking_opt_in() {
		// Only migrate if tracking was opted-in.
		if ( $this->options->get( Tracking::TRACKING_OPTIN_KEY ) ) {
			$user = $this->get_only_authenticated_user();

			if ( $user ) {
				$backup_user_id = $this->user_options->get_user_id();
				$this->user_options->switch_user( $user->ID );
				$this->user_options->set( Tracking::TRACKING_OPTIN_KEY, 1 );
				$this->user_options->switch_user( $backup_user_id );
			}
		}

		$this->options->delete( Tracking::TRACKING_OPTIN_KEY );
	}

	/**
	 * Gets the authenticated user connected to Site Kit, but only if there is a single one.
	 *
	 * @since n.e.x.t
	 *
	 * @return WP_User|bool User instance if only one authenticated user is found, otherwise false.
	 */
	private function get_only_authenticated_user() {
		global $wpdb;

		$users = get_users(
			array(
				'meta_key'     => $wpdb->get_blog_prefix() . OAuth_Client::OPTION_ACCESS_TOKEN, // phpcs:ignore WordPress.VIP.SlowDBQuery.slow_db_query_meta_key
				'meta_compare' => 'EXISTS',
				'number'       => 2, // Needed to make sure there is only one.
			)
		);

		if ( ! $users || 1 < count( $users ) ) {
			return false;
		}

		return $users[0];
	}

}
