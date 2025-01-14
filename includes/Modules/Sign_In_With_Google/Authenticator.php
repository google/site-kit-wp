<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Input;
use WP_Error;
use WP_User;

/**
 * The authenticator class that processes SiwG callback requests to authenticate users.
 *
 * @since 1.141.0
 * @access private
 * @ignore
 */
class Authenticator implements Authenticator_Interface {

	/**
	 * Cookie name to store the redirect URL before the user signs in with Google.
	 */
	const COOKIE_REDIRECT_TO = 'googlesitekit_auth_redirect_to';

	/**
	 * Error codes.
	 */
	const ERROR_INVALID_REQUEST = 'googlesitekit_auth_invalid_request';
	const ERROR_SIGNIN_FAILED   = 'googlesitekit_auth_failed';

	/**
	 * User options instance.
	 *
	 * @since 1.141.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Profile reader instance.
	 *
	 * @since 1.141.0
	 * @var Profile_Reader_Interface
	 */
	private $profile_reader;

	/**
	 * Constructor.
	 *
	 * @since 1.141.0
	 *
	 * @param User_Options             $user_options User options instance.
	 * @param Profile_Reader_Interface $profile_reader Profile reader instance.
	 */
	public function __construct( User_Options $user_options, Profile_Reader_Interface $profile_reader ) {
		$this->user_options   = $user_options;
		$this->profile_reader = $profile_reader;
	}

	/**
	 * Authenticates the user using the provided input data.
	 *
	 * @since 1.141.0
	 *
	 * @param Input $input Input instance.
	 * @return string Redirect URL.
	 */
	public function authenticate_user( Input $input ) {
		$login_url = wp_login_url();

		$credential = $input->filter( INPUT_POST, 'credential' );

		$user    = null;
		$payload = $this->profile_reader->get_profile_data( $credential );
		if ( ! is_wp_error( $payload ) ) {
			$user = $this->find_or_create_user( $payload );
		}

		// Redirect to the error page if the user is not found.
		if ( is_wp_error( $user ) ) {
			return add_query_arg( 'error', $user->get_error_code(), $login_url );
		} elseif ( ! $user instanceof WP_User ) {
			return add_query_arg( 'error', self::ERROR_INVALID_REQUEST, $login_url );
		}

		// Redirect to the error page if the user is not a member of the current blog in multisite.
		if ( is_multisite() ) {
			$blog_id = get_current_blog_id();
			if ( ! is_user_member_of_blog( $user->ID, $blog_id ) ) {
				if ( get_option( 'users_can_register' ) ) {
					add_user_to_blog( $blog_id, $user->ID, $this->get_default_role() );
				} else {
					return add_query_arg( 'error', self::ERROR_INVALID_REQUEST, $login_url );
				}
			}
		}

		// Set the user to be the current user.
		wp_set_current_user( $user->ID, $user->user_login );

		// Set the authentication cookies and trigger the wp_login action.
		wp_set_auth_cookie( $user->ID );
		/** This filter is documented in wp-login.php */
		do_action( 'wp_login', $user->user_login, $user );

		// Use the admin dashboard URL as the redirect URL by default.
		$redirect_to = admin_url();

		// If we have the redirect URL in the cookie, use it as the main redirect_to URL.
		$cookie_redirect_to = $input->filter( INPUT_COOKIE, self::COOKIE_REDIRECT_TO );
		if ( ! empty( $cookie_redirect_to ) ) {
			$redirect_to = $cookie_redirect_to;

			if ( ! headers_sent() ) {
				// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.cookies_setcookie
				setcookie( self::COOKIE_REDIRECT_TO, '', time() - 3600, self::get_cookie_path(), COOKIE_DOMAIN );
			}
		}

		// Redirect to HTTPS if user wants SSL.
		if ( get_user_option( 'use_ssl', $user->ID ) && str_contains( $redirect_to, 'wp-admin' ) ) {
			$redirect_to = preg_replace( '|^http://|', 'https://', $redirect_to );
		}

		/** This filter is documented in wp-login.php */
		$redirect_to = apply_filters( 'login_redirect', $redirect_to, $redirect_to, $user );

		if ( ( empty( $redirect_to ) || 'wp-admin/' === $redirect_to || admin_url() === $redirect_to ) ) {
			// If the user doesn't belong to a blog, send them to user admin. If the user can't edit posts, send them to their profile.
			if ( is_multisite() && ! get_active_blog_for_user( $user->ID ) && ! is_super_admin( $user->ID ) ) {
				$redirect_to = user_admin_url();
			} elseif ( is_multisite() && ! $user->has_cap( 'read' ) ) {
				$redirect_to = get_dashboard_url( $user->ID );
			} elseif ( ! $user->has_cap( 'edit_posts' ) ) {
				$redirect_to = $user->has_cap( 'read' ) ? admin_url( 'profile.php' ) : home_url();
			}
		}

		return $redirect_to;
	}

	/**
	 * Tries to find a user using user ID or email recieved from Google. If the user is not found,
	 * attempts to create a new one.
	 *
	 * @since 1.141.0
	 *
	 * @param array $payload Google auth payload.
	 * @return WP_User|WP_Error User object if found or created, WP_Error otherwise.
	 */
	private function find_or_create_user( $payload ) {
		// Check if there are any existing WordPress users connected to this Google account.
		// The user ID is used as the unique identifier because users can change the email on their Google account.
		$g_user_hid = md5( $payload['sub'] );
		$users      = get_users(
			array(
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_key'   => $this->user_options->get_meta_key( Hashed_User_ID::OPTION ),
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'meta_value' => $g_user_hid,
				'number'     => 1,
			)
		);

		if ( ! empty( $users ) ) {
			return $users[0];
		}

		// Find an existing user that matches the email and link to their Google account by store their user ID in user meta.
		$user = get_user_by( 'email', $payload['email'] );
		if ( $user ) {
			$user_options = clone $this->user_options;
			$user_options->switch_user( $user->ID );
			$user_options->set( Hashed_User_ID::OPTION, $g_user_hid );

			return $user;
		}

		// We haven't found the user using their google user id and email. Thus we need to create
		// a new user. But if the registration is closed, we need to return an error to identify
		// that the sign in process failed.
		//
		// No need to check the multisite settings because it is already incorporated in the following
		// users_can_register check. See: https://github.com/WordPress/WordPress/blob/505b7c55f5363d51e7e28d512ce7dcb2d5f45894/wp-includes/ms-default-filters.php#L20.
		if ( ! get_option( 'users_can_register' ) ) {
			return new WP_Error( self::ERROR_SIGNIN_FAILED );
		}

		// Get the default role for new users.
		$default_role = $this->get_default_role();

		// Create a new user.
		$user_id = wp_insert_user(
			array(
				'user_pass'    => wp_generate_password( 64 ),
				'user_login'   => $payload['email'],
				'user_email'   => $payload['email'],
				'display_name' => $payload['name'],
				'first_name'   => $payload['given_name'],
				'last_name'    => $payload['family_name'],
				'role'         => $default_role,
				'meta_input'   => array(
					$this->user_options->get_meta_key( Hashed_User_ID::OPTION ) => $g_user_hid,
				),
			)
		);

		if ( is_wp_error( $user_id ) ) {
			return new WP_Error( self::ERROR_SIGNIN_FAILED );
		}

		// Add the user to the current site if it is a multisite.
		if ( is_multisite() ) {
			add_user_to_blog( get_current_blog_id(), $user_id, $default_role );
		}

		// Send the new user notification.
		wp_send_new_user_notifications( $user_id );

		return get_user_by( 'id', $user_id );
	}

	/**
	 * Gets the default role for new users.
	 *
	 * @since 1.141.0
	 *
	 * @return string Default role.
	 */
	private function get_default_role() {
		$default_role = get_option( 'default_role' );
		if ( empty( $default_role ) ) {
			$default_role = 'subscriber';
		}

		return $default_role;
	}

	/**
	 * Gets the path for the redirect cookie.
	 *
	 * @since 1.141.0
	 *
	 * @return string Cookie path.
	 */
	public static function get_cookie_path() {
		return dirname( wp_parse_url( wp_login_url(), PHP_URL_PATH ) );
	}
}
