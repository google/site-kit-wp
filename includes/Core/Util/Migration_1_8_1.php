<?php
/**
 * Migration for 1.8.1
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Verification_File;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use WP_User;
use WP_Error;

/**
 * Class Migration_1_8_1
 *
 * @since 1.8.1
 * @access private
 * @ignore
 */
class Migration_1_8_1 {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = '1.8.1';

	/**
	 * Context instance.
	 *
	 * @since 1.8.1
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since 1.8.1
	 * @var Options
	 */
	protected $options;

	/**
	 * User_Options instance.
	 *
	 * @since 1.8.1
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Authentication instance.
	 *
	 * @since 1.8.1
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Constructor.
	 *
	 * @since 1.8.1
	 *
	 * @param Context        $context        Plugin context instance.
	 * @param Options        $options        Optional. Options instance.
	 * @param User_Options   $user_options   Optional. User_Options instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		?Options $options = null,
		?User_Options $user_options = null,
		?Authentication $authentication = null
	) {
		$this->context        = $context;
		$this->options        = $options ?: new Options( $this->context );
		$this->user_options   = $user_options ?: new User_Options( $this->context );
		$this->authentication = $authentication ?: new Authentication( $this->context, $this->options, $this->user_options );
	}

	/**
	 * Registers hooks.
	 *
	 * @since 1.8.1
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since 1.8.1
	 */
	public function migrate() {
		$db_version = $this->options->get( 'googlesitekit_db_version' );

		// Do not run if database version already updated.
		if ( $db_version && version_compare( $db_version, self::DB_VERSION, '>=' ) ) {
			return;
		}

		// Only run routine if using the authentication service, otherwise it
		// is irrelevant.
		if ( ! $this->authentication->credentials()->using_proxy() ) {
			return;
		}

		// Only run routine once site credentials present, otherwise it is not
		// possible to connect to the authentication service.
		if ( ! $this->authentication->credentials()->has() ) {
			return;
		}

		$this->clear_and_flag_unauthorized_verified_users();

		// Update database version.
		$this->options->set( 'googlesitekit_db_version', self::DB_VERSION );
	}

	/**
	 * Checks whether there are any users that are verified without proper
	 * authorization, clear their Site Kit data, and flag them on the
	 * authentication service.
	 *
	 * @since 1.8.1
	 *
	 * @return boolean|WP_Error True on success, WP_Error on failure.
	 */
	private function clear_and_flag_unauthorized_verified_users() {
		// Detect all unauthorized verified users and clean their Site Kit data.
		$unauthorized_identifiers = $this->clear_unauthorized_verified_users();

		// If no unauthorized verified users found, all is well, no need to
		// show a notification.
		if ( empty( $unauthorized_identifiers ) ) {
			return true;
		}

		// Flag site as affected so that the notification to inform and explain
		// steps to resolve will be shown.
		$credentials  = $this->authentication->credentials()->get();
		$google_proxy = new Google_Proxy( $this->context );
		$response     = wp_remote_post(
			$google_proxy->url( '/notifications/mark/' ),
			array(
				'body' => array(
					'site_id'            => $credentials['oauth2_client_id'],
					'site_secret'        => $credentials['oauth2_client_secret'],
					'notification_id'    => 'verification_leak',
					'notification_state' => 'required',
					// This is a special parameter only supported for this
					// particular notification.
					'identifiers'        => implode( ',', $unauthorized_identifiers ),
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			$body    = wp_remote_retrieve_body( $response );
			$decoded = json_decode( $body, true );
			return new WP_Error( $response_code, ! empty( $decoded['error'] ) ? $decoded['error'] : $body );
		}
		return true;
	}

	/**
	 * Checks for any users that are verified without proper authorization and
	 * clears all their Site Kit data.
	 *
	 * @since 1.8.1
	 *
	 * @return array List of email addresses for the unauthorized users.
	 */
	private function clear_unauthorized_verified_users() {
		global $wpdb;

		$unauthorized_identifiers = array();
		$profile                  = new Profile( $this->user_options );

		// Store original user ID to switch back later.
		$backup_user_id = $this->user_options->get_user_id();

		// Iterate through all users verified via Site Kit.
		foreach ( $this->get_verified_user_ids() as $user_id ) {
			$this->user_options->switch_user( $user_id );

			// If the user has setup access, there is no problem.
			if ( user_can( $user_id, Permissions::SETUP ) ) {
				continue;
			}

			// Try to get profile email, otherwise fall back to WP email.
			if ( $this->authentication->profile()->has() ) {
				$unauthorized_identifiers[] = $this->authentication->profile()->get()['email'];
			} else {
				$user                       = get_user_by( 'id', $user_id );
				$unauthorized_identifiers[] = $user->user_email;
			}

			$prefix = $this->user_options->get_meta_key( 'googlesitekit\_%' );
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->query(
				$wpdb->prepare( "DELETE FROM $wpdb->usermeta WHERE user_id = %d AND meta_key LIKE %s", $user_id, $prefix )
			);
			wp_cache_delete( $user_id, 'user_meta' );
		}

		// Restore original user ID.
		$this->user_options->switch_user( $backup_user_id );

		return $unauthorized_identifiers;
	}

	/**
	 * Gets all user IDs that are verified via Site Kit.
	 *
	 * @since @1.31.0
	 *
	 * @return array List of user ids of verified users. Maximum of 20.
	 */
	private function get_verified_user_ids() {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		return $wpdb->get_col(
			$wpdb->prepare(
				"SELECT user_id FROM $wpdb->usermeta WHERE meta_key IN (%s, %s) LIMIT 20",
				$this->user_options->get_meta_key( Verification_File::OPTION ),
				$this->user_options->get_meta_key( Verification_Meta::OPTION )
			)
		);
	}
}
