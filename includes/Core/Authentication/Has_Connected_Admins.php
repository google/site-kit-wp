<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Has_Connected_Admins
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\Options_Interface;
use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Storage\User_Options_Interface;
use WP_User;

/**
 * Has_Connected_Admins class.
 *
 * @since 1.14.0
 * @access private
 * @ignore
 */
class Has_Connected_Admins extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_has_connected_admins';

	/**
	 * User options instance implementing User_Options_Interface.
	 *
	 * @since 1.14.0
	 * @var User_Options_Interface
	 */
	protected $user_options;

	/**
	 * Constructor.
	 *
	 * @since 1.14.0
	 *
	 * @param Options_Interface      $options      Options instance.
	 * @param User_Options_Interface $user_options User options instance.
	 */
	public function __construct( Options_Interface $options, User_Options_Interface $user_options ) {
		parent::__construct( $options );
		$this->user_options = $user_options;
	}

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.14.0
	 */
	public function register() {
		parent::register();

		$access_token_meta_key = $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN );

		add_action(
			'added_user_meta',
			function ( $mid, $uid, $meta_key ) use ( $access_token_meta_key ) {
				if ( $meta_key === $access_token_meta_key && user_can( $uid, 'administrator' ) ) {
					$this->set( true );
				}
			},
			10,
			3
		);

		add_action(
			'deleted_user_meta',
			function ( $mid, $uid, $meta_key ) use ( $access_token_meta_key ) {
				if ( $meta_key === $access_token_meta_key ) {
					$this->delete();
				}
			},
			10,
			3
		);
	}

	/**
	 * Gets the value of the setting. If the option is not set yet, it pulls connected
	 * admins from the database and sets the option.
	 *
	 * @since 1.14.0
	 *
	 * @return boolean TRUE if the site kit already has connected admins, otherwise FALSE.
	 */
	public function get() {
		// If the option doesn't exist, query the fresh value, set it and return it.
		if ( ! $this->has() ) {
			$users                = $this->query_connected_admins();
			$has_connected_admins = count( $users ) > 0;

			$this->set( (int) $has_connected_admins );

			return $has_connected_admins;
		}

		return (bool) parent::get();
	}

	/**
	 * Queries connected admins and returns an array of connected admin IDs.
	 *
	 * @since 1.14.0
	 *
	 * @return array The array of connected admin IDs.
	 */
	protected function query_connected_admins() {
		return get_users(
			array(
				'meta_key'     => $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_compare' => 'EXISTS',
				'role'         => 'administrator',
				'number'       => 1,
				'fields'       => 'ID',
			)
		);
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.14.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'boolean';
	}

}
