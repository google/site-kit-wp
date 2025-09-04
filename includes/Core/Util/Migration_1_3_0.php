<?php
/**
 * Migration for 1.3.0
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tracking\Tracking_Consent;

/**
 * Class Migration_1_3_0
 *
 * @since 1.3.0
 * @access private
 * @ignore
 */
class Migration_1_3_0 {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = '1.3.0';

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
	 * @since 1.3.0
	 *
	 * @param Context      $context      Plugin context instance.
	 * @param Options      $options      Optional. Options instance.
	 * @param User_Options $user_options Optional. User_Options instance.
	 */
	public function __construct(
		Context $context,
		?Options $options = null,
		?User_Options $user_options = null
	) {
		$this->context      = $context;
		$this->options      = $options ?: new Options( $context );
		$this->user_options = $user_options ?: new User_Options( $context );
	}

	/**
	 * Registers hooks.
	 *
	 * @since 1.3.0
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since 1.3.0
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
	 * @since 1.3.0
	 * @since 1.4.0 Migrates preference for up to 20 users.
	 */
	private function migrate_tracking_opt_in() {
		// Only migrate if tracking was opted-in.
		if ( $this->options->get( Tracking_Consent::OPTION ) ) {
			$backup_user_id = $this->user_options->get_user_id();

			foreach ( $this->get_authenticated_users() as $user_id ) {
				$this->user_options->switch_user( $user_id );
				$this->user_options->set( Tracking_Consent::OPTION, 1 );
			}

			$this->user_options->switch_user( $backup_user_id );
		}
	}

	/**
	 * Gets the authenticated users connected to Site Kit.
	 *
	 * @since 1.4.0
	 *
	 * @return string[] User IDs of authenticated users. Maximum of 20.
	 */
	private function get_authenticated_users() {
		return get_users(
			array(
				'meta_key'     => $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_compare' => 'EXISTS',
				'number'       => 20,
				'fields'       => 'ID',
			)
		);
	}
}
