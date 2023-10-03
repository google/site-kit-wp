<?php
/**
 * Plugin Name: E2E Tests User Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for mocking current logged in user during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;

const OPTION_CURRENT_USER_ID   = 'googlesitekit_e2e_current_user_id';
const OPTION_CURRENT_USER_ROLE = 'googlesitekit_e2e_current_user_role';

$cleanup = function() {
	delete_option( OPTION_CURRENT_USER_ID );
	delete_option( OPTION_CURRENT_USER_ROLE );
};

register_activation_hook( __FILE__, $cleanup );

register_deactivation_hook( __FILE__, $cleanup );

/**
 * Mock_User_Data Class
 *
 * This class provides mock user data for testing purposes.
 */
class Mock_User_Data {
	/**
	 * @var WP_User Holds the mock user data.
	 */
	protected $user_data;

	/**
	 * @var string Mock user's login name.
	 */
	protected $user_login = 'mock_user';

	/**
	 * @var string Mock user's nicename.
	 */
	protected $user_nicename = 'Mock User';

	/**
	 * @var string Mock user's email address.
	 */
	protected $user_email = 'mock_user@example.com';

	/**
	 * Constructor for the Mock_User_Data class.
	 *
	 * @param int    $user_id The ID for the mock user.
	 * @param string $role    The role to assign to the mock user.
	 */
	public function __construct( $user_id, $role ) {
		$this->user_data = new WP_User();

		$this->set_user_data( $user_id, $role );
	}

	/**
	 * Retrieves the mock user data.
	 *
	 * @return WP_User Returns the mock user data.
	 */
	public function get_user_data() {
		return $this->user_data;
	}

	/**
	 * Sets the mock user data.
	 *
	 * @param int    $user_id The ID for the mock user.
	 * @param string $role    The role to assign to the mock user.
	 */
	protected function set_user_data( $user_id, $role ) {
		$this->user_data->ID            = $user_id;
		$this->user_data->user_login    = $this->user_login;
		$this->user_data->user_nicename = $this->user_nicename;
		$this->user_data->user_email    = $this->user_email;
		$this->user_data->roles         = array( $role );
	}
}

// Force the $current_user object to believe it is instantiated for existing user,
// otherwise wp_get_current_user and other functions and hooks getting the user object will not work
// and simply setting wp_set_current user with mocked ID will not instantiate the current user properly.
function force_current_user( $mock_user_id, $role_name, $user_cap ) {
	global $current_user;
	global $wpdb;

	$user_data    = new Mock_User_Data( $mock_user_id, $role_name );
	$current_user = wp_set_current_user( $mock_user_id );
	$current_user->for_site( get_current_blog_id() );

	$current_user->ID   = $mock_user_id;
	$current_user->data = $user_data->get_user_data();

	// Assign the capabilities from the role to the user object.
	$current_user->caps    = array( $role_name => true );
	$current_user->roles   = array( $role_name );
	$current_user->allcaps = $user_cap;
	$current_user->cap_key = $wpdb->prefix . 'capabilities';
}

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/user-mock/set-mock-user',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function ( WP_REST_Request $request ) {
					$user_id   = $request['user_id'];
					$user_role = $request['role'];

					if ( ! empty( $user_id ) ) {
						update_option( OPTION_CURRENT_USER_ID, $user_id );
						update_option( OPTION_CURRENT_USER_ROLE, $user_role );

						return array(
							'success' => true,
						);
					}

					return array(
						'success' => false,
					);
				},
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/user-mock/reset-current-user',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function () {

					delete_option( OPTION_CURRENT_USER_ID );

					return array(
						'success' => true,
					);
				},
				'permission_callback' => '__return_true',
			)
		);
	},
	0
);

add_action(
	'admin_init',
	function () {
		$user_id = (int) get_option( OPTION_CURRENT_USER_ID );

		if ( ! empty( $user_id ) ) {

			// Make WordPress believe that cookies for mocked user are actually set.
			$_COOKIE[ AUTH_COOKIE ]        = 'mocked';
			$_COOKIE[ SECURE_AUTH_COOKIE ] = 'mocked';
			$_COOKIE[ LOGGED_IN_COOKIE ]   = 'mocked';

			add_filter(
				'wp_validate_auth_cookie',
				function ( $user_id, $scheme ) {
					return $user_id;
				},
				99,
				2
			);

			// To ensure the user appears logged in.
			add_filter( 'user_is_logged_in', '__return_true' );

			// Prevent the auth cookie from being validated.
			remove_all_filters( 'authenticate' );
			add_filter(
				'authenticate',
				function ( $user ) use ( $user_id ) {
					return new WP_User( $user_id );
				},
				99
			);
		}

		delete_option( OPTION_CURRENT_USER_ID );
	},
	999
);

add_action(
	'plugins_loaded',
	function() {
		$mock_user_id = (int) get_option( OPTION_CURRENT_USER_ID );
		$role_name    = get_option( OPTION_CURRENT_USER_ROLE, 'administrator' );
		$role         = get_role( $role_name );
		$user_cap     = $role->capabilities;

		if ( ! empty( $mock_user_id ) ) {
			// Force $current_user global to think mocked user is currently authenticated user.
			force_current_user( $mock_user_id, $role_name, $user_cap );

			// Override new WP_User instances by providing mock user data, since mocked user id does not exist in db.
			add_filter(
				'get_userdata',
				function ( $user_data, $user_id ) use ( $mock_user_id, $role_name ) {
					$user_data = new Mock_User_Data( $mock_user_id, $role_name );

					return $user_data->get_user_data();
				},
				999,
				2
			);

			add_filter(
				'map_meta_cap',
				function( $caps, $cap, $user_id, $args ) {
					// Allways grant needed capability, otherwise sitekit capabilities checks will fail.
					return array();
				},
				999,
				4
			);

			// For current_user_can checks, make sure mocked user capabilities are returned.
			add_filter(
				'user_has_cap',
				function( $allcaps, $caps, $args, $user ) use ( $user_cap ) {
					return $user_cap;
				},
				999,
				4
			);
		}

		// Safeguard against trying to access the re-login or plugins cleanup with mocked user,
		// in case previous test failed and didn;t get a chance to remove mocked user override.
		if ( strpos( $_SERVER['REQUEST_URI'], 'plugins.php' ) !== false ) {
			// Make sure whenever e2e is navigated to the plugins page, mocked user override is bypassed.
			delete_option( OPTION_CURRENT_USER_ID );
		}
	},
	9999
);
