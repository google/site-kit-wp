<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Validate_Auth_Request;
use Google\Site_Kit_Dependencies\Google_Client;
use WP_Error;
use WP_User;

/**
 * Class representing the Sign in With Google module.
 *
 * @since 1.137.0
 * @access private
 * @ignore
 */
final class Sign_In_With_Google extends Module implements Module_With_Assets, Module_With_Settings, Module_With_Deactivation {

	use Module_With_Assets_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'sign-in-with-google';

	/**
	 * Validate_Auth_Request instance.
	 *
	 * @since n.e.x.t
	 * @var Validate_Auth_Request
	 */
	protected $validate_auth_request;

	/**
	 * Google_Client instance.
	 *
	 * @since n.e.x.t
	 * @var Google_Client
	 */
	protected $client;

	/**
	 * Option name for persistent user ID.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	const SIGN_IN_WITH_GOOGLE_USER_ID_OPTION = 'googlesitekitpersistent_sign_in_with_google_user_id';

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Optional. Option API instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param Assets         $assets         Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Authentication $authentication = null,
		Assets $assets = null
	) {
		parent::__construct( $context, $options, $user_options, $authentication, $assets );

		$this->validate_auth_request = new Validate_Auth_Request( $context );

		$settings = $this->get_settings()->get();
		if ( ! empty( $settings['clientID'] ) ) {
			$this->client = new Google_Client( array( 'client_id' => $settings['clientID'] ) );
		}
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.137.0
	 */
	public function register() {
		add_action(
			'init',
			function () {
				add_rewrite_rule( '^auth/google/?$', 'index.php?google_auth=1', 'top' );
			}
		);

		add_filter(
			'query_vars',
			function ( $vars ) {
				$vars[] = 'google_auth';
				return $vars;
			}
		);

		add_filter( 'wp_login_errors', array( $this, 'handle_google_auth_errors' ) );

		add_action( 'template_redirect', array( $this, 'handle_google_auth' ) );
	}

	/**
	 * Login user.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_User $user WordPress user object.
	 */
	protected function login_user( WP_User $user ) {
		wp_set_current_user( $user->ID, $user->user_login );
		wp_set_auth_cookie( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );
	}

	/**
	 * Intercept the page request to process token ID
	 * and complete Sign in with Google flow.
	 *
	 * @since n.e.x.t
	 */
	public function handle_google_auth() {
		global $wp_query;

		if ( ! isset( $wp_query->query_vars['google_auth'] ) ) {
			return;
		}

		$settings = $this->get_settings()->get();
		if ( empty( $settings['clientID'] ) ) {
			wp_safe_redirect( add_query_arg( 'error', 'no_client_id', wp_login_url() ) );
			exit;
		}

		$this->validate_auth_request->run_validations();
		$error = $this->validate_auth_request->get_error();

		if ( is_wp_error( $error ) ) {
			wp_safe_redirect( add_query_arg( 'error', $error->get_error_code(), wp_login_url() ) );
			exit;
		}

		$id_token = $this->context->input()->filter( INPUT_POST, 'credential' );
		$payload  = $this->client->verifyIdToken( $id_token );

		if ( empty( $payload ) || ! array_key_exists( 'sub', $payload ) || empty( $payload['sub'] ) || ! array_key_exists( 'email', $payload ) || empty( $payload['email'] ) ) {
			wp_safe_redirect( add_query_arg( 'error', 'google_auth_invalid_request', wp_login_url() ) );
			exit;
		}

		$google_user_id    = $payload['sub'];
		$google_user_email = $payload['email'];

		// Check if there are any existing WordPress users connected to this Google account.
		// The user ID is used as the unique identifier because users can change the email on their Google account.
		$existing_users = get_users(
			array(
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_key'   => self::SIGN_IN_WITH_GOOGLE_USER_ID_OPTION,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'meta_value' => $google_user_id,
				'number'     => 1,
			)
		);
		if ( ! empty( $existing_users ) && $existing_users[0] instanceof WP_User ) {
			return $this->login_user( $existing_users[0] );
		}

		// Find an existing user that matches the email and link to their Google account by store their user ID in user meta.
		$existing_user = get_user_by( 'email', $google_user_email );
		if ( $existing_user instanceof WP_User ) {
			add_user_meta( $existing_user->ID, self::SIGN_IN_WITH_GOOGLE_USER_ID_OPTION, $google_user_id, true );
			return $this->login_user( $existing_user );
		}

		// Create a new user if "Anyone can register" setting is enabled.
		$registration_open = get_option( 'users_can_register' );

		if ( $registration_open ) {
			$new_user_id = wp_create_user( $google_user_email, wp_generate_password(), $google_user_email );
			add_user_meta( $new_user_id, self::SIGN_IN_WITH_GOOGLE_USER_ID_OPTION, $google_user_id, true );
			return $this->login_user( get_user_by( 'id', $new_user_id ) );
		}

		wp_safe_redirect( add_query_arg( 'error', 'user_actions_failed', wp_login_url() ) );
		exit;
	}

	/**
	 * Adds custom errors if Google auth flow failed.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Error $error WP_Error instance.
	 * @return WP_Error $error WP_Error instance.
	 */
	public function handle_google_auth_errors( $error ) {
		$error_code = $this->context->input()->filter( INPUT_GET, 'error' );
		if ( ! $error_code ) {
			return $error;
		}

		switch ( $error_code ) {
			case 'no_client_id':
				$error->add( 'access', __( 'No client ID supplied.', 'google-site-kit' ) );
				break;
			case 'google_auth_invalid_request':
				$error->add( 'access', __( 'Invalid request.', 'google-site-kit' ) );
				break;
			case 'google_auth_bad_request_method':
				$error->add( 'access', __( 'Bad request method.', 'google-site-kit' ) );
				break;
			case 'google_auth_invalid_g_csrf_token':
				$error->add( 'access', __( 'Invalid g_csrf token.', 'google-site-kit' ) );
				break;
			case 'missing_parameter':
				$error->add( 'access', __( 'Parameter: "credential" is missing.', 'google-site-kit' ) );
				break;
			case 'user_actions_failed':
				$error->add( 'access', __( 'Failed to perform user actions.', 'google-site-kit' ) );
				break;
		}

		return $error;
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.137.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.137.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Sign in with Google', 'Service name', 'google-site-kit' ),
			'description' => __( 'Improve user engagement, trust, and data privacy, while creating a simple, secure, and personalized experience for your visitors', 'google-site-kit' ),
			'order'       => 10,
			'homepage'    => __( 'https://developers.google.com/identity/gsi/web/guides/overview', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.137.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		return array(
			new Script(
				'googlesitekit-modules-sign-in-with-google',
				array(
					'src'          => $this->context->url( 'dist/assets/js/googlesitekit-modules-sign-in-with-google.js' ),
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.137.0
	 *
	 * @return Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}
}
