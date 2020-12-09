<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Authentication
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\User_Input_State;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Admin\Notice;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\User_Input_Settings;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use Exception;

/**
 * Authentication Class.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Authentication {

	use Method_Proxy_Trait;

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Options object.
	 *
	 * @since 1.0.0
	 *
	 * @var Options
	 */
	private $options = null;

	/**
	 * User_Options object.
	 *
	 * @since 1.0.0
	 *
	 * @var User_Options
	 */
	private $user_options = null;

	/**
	 * User_Input_State object.
	 *
	 * @since 1.20.0
	 *
	 * @var User_Input_State
	 */
	private $user_input_state = null;

	/**
	 * User_Input_Settings
	 *
	 * @since 1.20.0
	 *
	 * @var User_Input_Settings
	 */
	private $user_input_settings = null;

	/**
	 * Transients object.
	 *
	 * @since 1.0.0
	 *
	 * @var Transients
	 */
	private $transients = null;

	/**
	 * OAuth client object.
	 *
	 * @since 1.0.0
	 *
	 * @var Clients\OAuth_Client
	 */
	private $auth_client = null;

	/**
	 * OAuth credentials instance.
	 *
	 * @since 1.0.0
	 * @var Credentials
	 */
	protected $credentials;

	/**
	 * Verification instance.
	 *
	 * @since 1.0.0
	 * @var Verification
	 */
	protected $verification;

	/**
	 * Verification meta instance.
	 *
	 * @since 1.1.0
	 * @var Verification_Meta
	 */
	protected $verification_meta;

	/**
	 * Verification file instance.
	 *
	 * @since 1.1.0
	 * @var Verification_File
	 */
	protected $verification_file;

	/**
	 * Profile instance.
	 *
	 * @since 1.0.0
	 * @var Profile
	 */
	protected $profile;

	/**
	 * Owner_ID instance.
	 *
	 * @since 1.16.0
	 * @var Owner_ID
	 */
	protected $owner_id;

	/**
	 * Has_Connected_Admins instance.
	 *
	 * @since 1.14.0
	 * @var Has_Connected_Admins
	 */
	protected $has_connected_admins;

	/**
	 * Connected_Proxy_URL instance.
	 *
	 * @since 1.17.0
	 * @var Connected_Proxy_URL
	 */
	protected $connected_proxy_url;

	/**
	 * Disconnected_Reason instance.
	 *
	 * @since 1.17.0
	 * @var Disconnected_Reason
	 */
	protected $disconnected_reason;

	/**
	 * Google_Proxy instance.
	 *
	 * @since 1.1.2
	 * @var Google_Proxy
	 */
	protected $google_proxy;

	/**
	 * Flag set when site fields are synchronized during the current request.
	 *
	 * @var bool
	 */
	private $did_sync_fields;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context      $context      Plugin context.
	 * @param Options      $options      Optional. Option API instance. Default is a new instance.
	 * @param User_Options $user_options Optional. User Option API instance. Default is a new instance.
	 * @param Transients   $transients   Optional. Transient API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Transients $transients = null
	) {
		$this->context              = $context;
		$this->options              = $options ?: new Options( $this->context );
		$this->user_options         = $user_options ?: new User_Options( $this->context );
		$this->transients           = $transients ?: new Transients( $this->context );
		$this->user_input_state     = new User_Input_State( $this->user_options );
		$this->user_input_settings  = new User_Input_Settings( $context, $this, $transients );
		$this->google_proxy         = new Google_Proxy( $this->context );
		$this->credentials          = new Credentials( new Encrypted_Options( $this->options ) );
		$this->verification         = new Verification( $this->user_options );
		$this->verification_meta    = new Verification_Meta( $this->user_options );
		$this->verification_file    = new Verification_File( $this->user_options );
		$this->profile              = new Profile( $this->user_options );
		$this->owner_id             = new Owner_ID( $this->options );
		$this->has_connected_admins = new Has_Connected_Admins( $this->options, $this->user_options );
		$this->connected_proxy_url  = new Connected_Proxy_URL( $this->options );
		$this->disconnected_reason  = new Disconnected_Reason( $this->user_options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->credentials()->register();
		$this->verification()->register();
		$this->verification_file()->register();
		$this->verification_meta()->register();
		$this->has_connected_admins->register();
		$this->owner_id->register();
		$this->connected_proxy_url->register();
		$this->disconnected_reason->register();
		$this->user_input_state->register();

		add_filter( 'allowed_redirect_hosts', $this->get_method_proxy( 'allowed_redirect_hosts' ) );
		add_filter( 'googlesitekit_admin_data', $this->get_method_proxy( 'inline_js_admin_data' ) );
		add_filter( 'googlesitekit_admin_notices', $this->get_method_proxy( 'authentication_admin_notices' ) );
		add_filter( 'googlesitekit_inline_base_data', $this->get_method_proxy( 'inline_js_base_data' ) );
		add_filter( 'googlesitekit_setup_data', $this->get_method_proxy( 'inline_js_setup_data' ) );

		add_action( 'init', $this->get_method_proxy( 'handle_oauth' ) );
		add_action( 'admin_init', $this->get_method_proxy( 'check_connected_proxy_url' ) );
		add_action( 'admin_init', $this->get_method_proxy( 'verify_user_input_settings' ) );
		add_action(
			'admin_init',
			function() {
				if (
					'googlesitekit-dashboard' === $this->context->input()->filter( INPUT_GET, 'page', FILTER_SANITIZE_STRING )
					&& User_Input_State::VALUE_REQUIRED === $this->user_input_state->get()
				) {
					wp_safe_redirect( $this->context->admin_url( 'user-input' ) );
					exit;
				}
			}
		);
		// Google_Proxy::ACTION_SETUP is called from the proxy as an intermediate step.
		add_action( 'admin_action_' . Google_Proxy::ACTION_SETUP, $this->get_method_proxy( 'verify_proxy_setup_nonce' ), -1 );
		// Google_Proxy::ACTION_SETUP is called from Site Kit to redirect to the proxy initially.
		add_action( 'admin_action_' . Google_Proxy::ACTION_SETUP, $this->get_method_proxy( 'handle_sync_site_fields' ), 5 );
		add_action(
			'admin_action_' . Google_Proxy::ACTION_SETUP,
			function () {
				$code      = $this->context->input()->filter( INPUT_GET, 'googlesitekit_code', FILTER_SANITIZE_STRING );
				$site_code = $this->context->input()->filter( INPUT_GET, 'googlesitekit_site_code', FILTER_SANITIZE_STRING );

				$this->handle_site_code( $code, $site_code );
				$this->require_user_input();
				$this->redirect_to_proxy( $code );
			}
		);

		add_action(
			'admin_action_' . Google_Proxy::ACTION_PERMISSIONS,
			function () {
				$this->handle_proxy_permissions();
			}
		);

		add_action( 'googlesitekit_authorize_user', $this->get_method_proxy( 'set_connected_proxy_url' ) );

		add_filter(
			'googlesitekit_rest_routes',
			function( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function( $routes ) {
				$authentication_routes = array(
					'/' . REST_Routes::REST_ROOT . '/core/site/data/connection',
					'/' . REST_Routes::REST_ROOT . '/core/user/data/authentication',
				);
				return array_merge( $routes, $authentication_routes );
			}
		);

		add_filter(
			'googlesitekit_user_data',
			function( $user ) {
				$user['connectURL'] = esc_url_raw( $this->get_connect_url() );

				if ( $this->profile->has() ) {
					$profile_data            = $this->profile->get();
					$user['user']['email']   = $profile_data['email'];
					$user['user']['picture'] = $profile_data['photo'];
				}

				$user['verified'] = $this->verification->has();

				return $user;
			}
		);

		add_filter(
			'googlesitekit_user_data',
			function( $user ) {
				$user['userInputState'] = $this->user_input_state->get();
				return $user;
			}
		);

		// Synchronize site fields on shutdown when select options change.
		$option_updated = function () {
			$sync_site_fields = function () {
				if ( $this->did_sync_fields ) {
					return;
				}
				// This method should run no more than once per request.
				$this->did_sync_fields = true;

				if ( $this->credentials->using_proxy() ) {
					$this->google_proxy->sync_site_fields( $this->credentials() );
				}
			};
			add_action( 'shutdown', $sync_site_fields );
		};

		add_action( 'update_option_blogname', $option_updated );
		add_action( 'update_option_googlesitekit_db_version', $option_updated );

		add_action(
			OAuth_Client::CRON_REFRESH_PROFILE_DATA,
			function ( $user_id ) {
				$this->cron_refresh_profile_data( $user_id );
			}
		);
	}

	/**
	 * Gets the OAuth credentials object.
	 *
	 * @since 1.0.0
	 *
	 * @return Credentials Credentials instance.
	 */
	public function credentials() {
		return $this->credentials;
	}

	/**
	 * Gets the verification instance.
	 *
	 * @since 1.0.0
	 *
	 * @return Verification Verification instance.
	 */
	public function verification() {
		return $this->verification;
	}

	/**
	 * Gets the verification tag instance.
	 *
	 * @since 1.0.0
	 * @deprecated 1.1.0
	 *
	 * @return Verification_Meta Verification tag instance.
	 */
	public function verification_tag() {
		_deprecated_function( __METHOD__, '1.1.0', __CLASS__ . '::verification_meta()' );
		return $this->verification_meta;
	}

	/**
	 * Gets the verification meta instance.
	 *
	 * @since 1.1.0
	 *
	 * @return Verification_Meta Verification tag instance.
	 */
	public function verification_meta() {
		return $this->verification_meta;
	}

	/**
	 * Gets the verification file instance.
	 *
	 * @since 1.1.0
	 *
	 * @return Verification_File Verification file instance.
	 */
	public function verification_file() {
		return $this->verification_file;
	}

	/**
	 * Gets the Profile instance.
	 *
	 * @since 1.0.0
	 *
	 * @return Profile Profile instance.
	 */
	public function profile() {
		return $this->profile;
	}

	/**
	 * Gets the OAuth client instance.
	 *
	 * @since 1.0.0
	 *
	 * @return Clients\OAuth_Client OAuth client instance.
	 */
	public function get_oauth_client() {
		if ( ! $this->auth_client instanceof OAuth_Client ) {
			$this->auth_client = new OAuth_Client( $this->context, $this->options, $this->user_options, $this->credentials, $this->google_proxy );
		}
		return $this->auth_client;
	}

	/**
	 * Gets the Google Proxy instance.
	 *
	 * @since 1.19.0
	 *
	 * @return Google_Proxy An instance of Google Proxy.
	 */
	public function get_google_proxy() {
		return $this->google_proxy;
	}

	/**
	 * Gets the User Input State instance.
	 *
	 * @since 1.21.0
	 *
	 * @return User_Input_State An instance of the User_Input_State class.
	 */
	public function get_user_input_state() {
		return $this->user_input_state;
	}

	/**
	 * Revokes authentication along with user options settings.
	 *
	 * @since 1.0.0
	 */
	public function disconnect() {
		global $wpdb;

		// Revoke token via API call.
		$this->get_oauth_client()->revoke_token();

		// Delete all user data.
		$user_id = $this->user_options->get_user_id();
		$prefix  = $this->user_options->get_meta_key( 'googlesitekit\_%' );

		// Reset Has_Connected_Admins setting.
		$this->has_connected_admins->delete();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->query(
			$wpdb->prepare( "DELETE FROM $wpdb->usermeta WHERE user_id = %d AND meta_key LIKE %s", $user_id, $prefix )
		);
		wp_cache_delete( $user_id, 'user_meta' );
	}

	/**
	 * Gets the URL for connecting to Site Kit.
	 *
	 * @since 1.0.0
	 *
	 * @return string Connect URL.
	 */
	public function get_connect_url() {
		return $this->context->admin_url(
			'splash',
			array(
				'googlesitekit_connect' => 1,
				'nonce'                 => wp_create_nonce( 'connect' ),
			)
		);
	}

	/**
	 * Gets the URL for disconnecting from Site Kit.
	 *
	 * @since 1.0.0
	 *
	 * @return string Disconnect URL.
	 */
	public function get_disconnect_url() {
		return $this->context->admin_url(
			'splash',
			array(
				'googlesitekit_disconnect' => 1,
				'nonce'                    => wp_create_nonce( 'disconnect' ),
			)
		);
	}

	/**
	 * Check if the current user is authenticated.
	 *
	 * @since 1.0.0
	 *
	 * @return boolean True if the user is authenticated, false otherwise.
	 */
	public function is_authenticated() {
		$auth_client = $this->get_oauth_client();

		$access_token = $auth_client->get_access_token();

		return ! empty( $access_token );
	}
	/**
	 * Checks whether the Site Kit setup is considered complete.
	 *
	 * If this is not the case, most permissions will be force-prevented to ensure that only permissions required for
	 * initial setup are granted.
	 *
	 * @since 1.0.0
	 * @since 1.7.0 Moved from `Permissions` class.
	 *
	 * @return bool True if setup is completed, false otherwise.
	 */
	public function is_setup_completed() {
		if ( ! $this->credentials->has() ) {
			return false;
		}

		/**
		 * Filters whether the Site Kit plugin should consider its setup to be completed.
		 *
		 * This can be used by essential auto-activated modules to amend the result of this check.
		 *
		 * @since 1.0.0
		 *
		 * @param bool $complete Whether the setup is completed.
		 */
		return (bool) apply_filters( 'googlesitekit_setup_complete', true );
	}

	/**
	 * Refreshes user profile data in the background.
	 *
	 * @since 1.13.0
	 *
	 * @param int $user_id User ID to refresh profile data for.
	 */
	private function cron_refresh_profile_data( $user_id ) {
		$original_user_id = $this->user_options->get_user_id();
		$this->user_options->switch_user( $user_id );

		if ( $this->is_authenticated() ) {
			$this->get_oauth_client()->refresh_profile_data( 30 * MINUTE_IN_SECONDS );
		}

		$this->user_options->switch_user( $original_user_id );
	}

	/**
	 * Handles receiving a temporary OAuth code.
	 *
	 * @since 1.0.0
	 */
	private function handle_oauth() {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return;
		}

		$auth_client = $this->get_oauth_client();
		$input       = $this->context->input();

		// Handles Direct OAuth client request.
		if ( $input->filter( INPUT_GET, 'oauth2callback' ) ) {
			if ( ! current_user_can( Permissions::AUTHENTICATE ) ) {
				wp_die( esc_html__( 'You don\'t have permissions to authenticate with Site Kit.', 'google-site-kit' ), 403 );
			}

			$auth_client->authorize_user();
		}

		if ( ! is_admin() ) {
			return;
		}

		if ( $input->filter( INPUT_GET, 'googlesitekit_disconnect' ) ) {
			$nonce = $input->filter( INPUT_GET, 'nonce' );
			if ( empty( $nonce ) || ! wp_verify_nonce( $nonce, 'disconnect' ) ) {
				wp_die( esc_html__( 'Invalid nonce.', 'google-site-kit' ), 400 );
			}

			if ( ! current_user_can( Permissions::AUTHENTICATE ) ) {
				wp_die( esc_html__( 'You don\'t have permissions to authenticate with Site Kit.', 'google-site-kit' ), 403 );
			}

			$this->disconnect();

			$redirect_url = $this->context->admin_url(
				'splash',
				array(
					'googlesitekit_reset_session' => 1,
				)
			);

			wp_safe_redirect( $redirect_url );
			exit();
		}

		if ( $input->filter( INPUT_GET, 'googlesitekit_connect' ) ) {
			$nonce = $input->filter( INPUT_GET, 'nonce' );
			if ( empty( $nonce ) || ! wp_verify_nonce( $nonce, 'connect' ) ) {
				wp_die( esc_html__( 'Invalid nonce.', 'google-site-kit' ), 400 );
			}

			if ( ! current_user_can( Permissions::AUTHENTICATE ) ) {
				wp_die( esc_html__( 'You don\'t have permissions to authenticate with Site Kit.', 'google-site-kit' ), 403 );
			}

			$redirect_url = $input->filter( INPUT_GET, 'redirect', FILTER_VALIDATE_URL );
			if ( $redirect_url ) {
				$redirect_url = esc_url_raw( wp_unslash( $redirect_url ) );
			}

			// User is trying to authenticate, but access token hasn't been set.
			$additional_scopes = $input->filter( INPUT_GET, 'additional_scopes', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );
			wp_safe_redirect(
				esc_url_raw(
					$auth_client->get_authentication_url( $redirect_url, $additional_scopes )
				)
			);
			exit();
		}
	}

	/**
	 * Modifies the base data to pass to JS.
	 *
	 * @since 1.2.0
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_base_data( $data ) {
		$data['isOwner']             = $this->owner_id->get() === get_current_user_id();
		$data['isFirstAdmin']        = $data['isOwner'] || ( ! $this->owner_id->get() && current_user_can( Permissions::MANAGE_OPTIONS ) );
		$data['splashURL']           = esc_url_raw( $this->context->admin_url( 'splash' ) );
		$data['proxySetupURL']       = '';
		$data['proxyPermissionsURL'] = '';
		$data['usingProxy']          = false;
		if ( $this->credentials->using_proxy() ) {
			$auth_client                 = $this->get_oauth_client();
			$data['proxySetupURL']       = esc_url_raw( $this->get_proxy_setup_url() );
			$data['proxyPermissionsURL'] = esc_url_raw( $this->get_proxy_permissions_url() );
			$data['usingProxy']          = true;
		}

		$version               = get_bloginfo( 'version' );
		list( $major, $minor ) = explode( '.', $version );
		$data['wpVersion']     = array(
			'version' => $version,
			'major'   => (int) $major,
			'minor'   => (int) $minor,
		);

		return $data;
	}

	/**
	 * Modifies the admin data to pass to JS.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_admin_data( $data ) {
		$data['connectURL']    = esc_url_raw( $this->get_connect_url() );
		$data['disconnectURL'] = esc_url_raw( $this->get_disconnect_url() );

		return $data;
	}

	/**
	 * Modifies the setup data to pass to JS.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_setup_data( $data ) {
		$auth_client = $this->get_oauth_client();

		$access_token = $auth_client->get_access_token();

		$data['isSiteKitConnected'] = $this->credentials->has();
		$data['isResettable']       = $this->options->has( Credentials::OPTION );
		$data['isAuthenticated']    = ! empty( $access_token );
		$data['requiredScopes']     = $auth_client->get_required_scopes();
		$data['grantedScopes']      = ! empty( $access_token ) ? $auth_client->get_granted_scopes() : array();
		$data['unsatisfiedScopes']  = ! empty( $access_token ) ? $auth_client->get_unsatisfied_scopes() : array();
		$data['needReauthenticate'] = $auth_client->needs_reauthentication();

		if ( $this->credentials->using_proxy() ) {
			$error_code = $this->user_options->get( OAuth_Client::OPTION_ERROR_CODE );
			if ( ! empty( $error_code ) ) {
				$data['errorMessage'] = $auth_client->get_error_message( $error_code );
			}
		}

		// All admins need to go through site verification process.
		if ( current_user_can( Permissions::MANAGE_OPTIONS ) ) {
			$data['isVerified'] = $this->verification->has();
		} else {
			$data['isVerified'] = false;
		}

		// The actual data for this is passed in from the Search Console module.
		if ( ! isset( $data['hasSearchConsoleProperty'] ) ) {
			$data['hasSearchConsoleProperty'] = false;
		}

		$data['showModuleSetupWizard'] = $this->context->input()->filter( INPUT_GET, 'reAuth', FILTER_VALIDATE_BOOLEAN );

		$data['moduleToSetup'] = sanitize_key( (string) $this->context->input()->filter( INPUT_GET, 'slug' ) );

		return $data;
	}

	/**
	 * Add allowed redirect host to safe wp_safe_redirect
	 *
	 * @since 1.0.0
	 *
	 * @param array $hosts Array of safe hosts to redirect to.
	 *
	 * @return array
	 */
	private function allowed_redirect_hosts( $hosts ) {
		$hosts[] = 'accounts.google.com';
		$hosts[] = wp_parse_url( $this->google_proxy->url(), PHP_URL_HOST );

		return $hosts;
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since 1.3.0
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_setup = function() {
			return current_user_can( Permissions::SETUP );
		};

		$can_authenticate = function() {
			return current_user_can( Permissions::AUTHENTICATE );
		};

		return array(
			new REST_Route(
				'core/site/data/connection',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$data = array(
								'connected'          => $this->credentials->has(),
								'resettable'         => $this->options->has( Credentials::OPTION ),
								'setupCompleted'     => $this->is_setup_completed(),
								'hasConnectedAdmins' => $this->has_connected_admins->get(),
								'ownerID'            => $this->owner_id->get(),
							);

							return new WP_REST_Response( $data );
						},
						'permission_callback' => $can_setup,
					),
				)
			),
			new REST_Route(
				'core/user/data/authentication',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$oauth_client = $this->get_oauth_client();
							$access_token = $oauth_client->get_access_token();

							$data = array(
								'authenticated'         => ! empty( $access_token ),
								'requiredScopes'        => $oauth_client->get_required_scopes(),
								'grantedScopes'         => ! empty( $access_token ) ? $oauth_client->get_granted_scopes() : array(),
								'unsatisfiedScopes'     => ! empty( $access_token ) ? $oauth_client->get_unsatisfied_scopes() : array(),
								'needsReauthentication' => $oauth_client->needs_reauthentication(),
								'disconnectedReason'    => $this->disconnected_reason->get(),
							);

							return new WP_REST_Response( $data );
						},
						'permission_callback' => $can_authenticate,
					),
				)
			),
			new REST_Route(
				'core/user/data/disconnect',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$this->disconnect();
							return new WP_REST_Response( true );
						},
						'permission_callback' => $can_authenticate,
					),
				)
			),
		);
	}

	/**
	 * Shows admin notification for authentication related issues.
	 *
	 * @since 1.0.0
	 *
	 * @param array $notices Array of admin notices.
	 *
	 * @return array Array of admin notices.
	 */
	private function authentication_admin_notices( $notices ) {

		// Only include notices if in the correct admin panel.
		if ( $this->context->is_network_mode() !== is_network_admin() ) {
			return $notices;
		}

		$notices[] = $this->get_reauthentication_needed_notice();
		$notices[] = $this->get_authentication_oauth_error_notice();
		$notices[] = $this->get_reconnect_after_url_mismatch_notice();

		return $notices;
	}

	/**
	 * Gets reconnect notice.
	 *
	 * @since 1.17.0
	 *
	 * @return Notice Notice object.
	 */
	private function get_reconnect_after_url_mismatch_notice() {
		return new Notice(
			'reconnect_after_url_mismatch',
			array(
				'content'         => function() {
					return sprintf(
						'<p>%s <a href="%s">%s</a></p>',
						esc_html__( 'Looks like the URL of your site has changed. In order to continue using Site Kit, you’ll need to reconnect, so that your plugin settings are updated with the new URL.', 'google-site-kit' ),
						esc_url( $this->get_proxy_setup_url() ),
						esc_html__( 'Reconnect', 'google-site-kit' )
					);
				},
				'type'            => Notice::TYPE_INFO,
				'active_callback' => function() {
					return $this->disconnected_reason->get() === Disconnected_Reason::REASON_CONNECTED_URL_MISMATCH
						&& $this->credentials->has();
				},
			)
		);
	}

	/**
	 * Gets re-authentication notice.
	 *
	 * @since 1.0.0
	 *
	 * @return Notice Notice object.
	 */
	private function get_reauthentication_needed_notice() {
		return new Notice(
			'needs_reauthentication',
			array(
				'content'         => function() {
					ob_start();
					?>
					<p>
						<?php esc_html_e( 'You need to reauthenticate your Google account.', 'google-site-kit' ); ?>
						<a
							href="#"
							onclick="clearSiteKitAppStorage()"
						><?php esc_html_e( 'Click here', 'google-site-kit' ); ?></a>
					</p>
					<script>
						function clearSiteKitAppStorage() {
							if ( localStorage ) {
								localStorage.clear();
							}
							if ( sessionStorage ) {
								sessionStorage.clear();
							}
							document.location = '<?php echo esc_url_raw( $this->get_connect_url() ); ?>';
						}
					</script>
					<?php
					return ob_get_clean();
				},
				'type'            => Notice::TYPE_SUCCESS,
				'active_callback' => function() {
					return $this->get_oauth_client()->needs_reauthentication();
				},
			)
		);
	}

	/**
	 * Gets OAuth error notice.
	 *
	 * @since 1.0.0
	 *
	 * @return Notice Notice object.
	 */
	private function get_authentication_oauth_error_notice() {
		return new Notice(
			'oauth_error',
			array(
				'type'            => Notice::TYPE_ERROR,
				'content'         => function() {
					$auth_client = $this->get_oauth_client();
					$error_code  = $this->context->input()->filter( INPUT_GET, 'error', FILTER_SANITIZE_STRING );

					if ( ! $error_code ) {
						$error_code = $this->user_options->get( OAuth_Client::OPTION_ERROR_CODE );
					}

					if ( $error_code ) {
						// Delete error code from database to prevent future notice.
						$this->user_options->delete( OAuth_Client::OPTION_ERROR_CODE );
					} else {
						return '';
					}

					$message     = $auth_client->get_error_message( $error_code );
					$access_code = $this->user_options->get( OAuth_Client::OPTION_PROXY_ACCESS_CODE );
					if ( $this->credentials->using_proxy() && $access_code ) {
						$message .= ' ' . sprintf(
							/* translators: %s: URL to re-authenticate */
							__( 'To fix this, <a href="%s">redo the plugin setup</a>.', 'google-site-kit' ),
							esc_url( $auth_client->get_proxy_setup_url( $access_code, $error_code ) )
						);
						$this->user_options->delete( OAuth_Client::OPTION_PROXY_ACCESS_CODE );
					} else {
						$message .= ' ' . sprintf(
							/* translators: %s: setup screen URL */
							__( 'To fix this, <a href="%s">redo the plugin setup</a>.', 'google-site-kit' ),
							esc_url( $this->context->admin_url( 'splash' ) )
						);
					}

					$message = wp_kses(
						$message,
						array(
							'a'      => array(
								'href' => array(),
							),
							'strong' => array(),
							'em'     => array(),
						)
					);

					return '<p>' . $message . '</p>';
				},
				'active_callback' => function() {
					$notification = $this->context->input()->filter( INPUT_GET, 'notification', FILTER_SANITIZE_STRING );
					$error_code   = $this->context->input()->filter( INPUT_GET, 'error', FILTER_SANITIZE_STRING );

					if ( 'authentication_success' === $notification && $error_code ) {
						return true;
					}

					return (bool) $this->user_options->get( OAuth_Client::OPTION_ERROR_CODE );
				},
			)
		);
	}

	/**
	 * Verifies the nonce for processing proxy setup.
	 *
	 * @since 1.1.2
	 */
	private function verify_proxy_setup_nonce() {
		$nonce = $this->context->input()->filter( INPUT_GET, 'nonce', FILTER_SANITIZE_STRING );

		if ( ! wp_verify_nonce( $nonce, Google_Proxy::ACTION_SETUP ) ) {
			wp_die( esc_html__( 'Invalid nonce.', 'google-site-kit' ), 400 );
		}
	}

	/**
	 * Handles the exchange of a code and site code for client credentials from the proxy.
	 *
	 * @since 1.1.2
	 *
	 * @param string $code      Code ('googlesitekit_code') provided by proxy.
	 * @param string $site_code Site code ('googlesitekit_site_code') provided by proxy.
	 *
	 * phpcs:disable Squiz.Commenting.FunctionCommentThrowTag.Missing
	 */
	private function handle_site_code( $code, $site_code ) {
		if ( ! $code || ! $site_code ) {
			return;
		}

		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'You don\'t have permissions to set up Site Kit.', 'google-site-kit' ), 403 );
		}

		try {
			$data = $this->google_proxy->exchange_site_code( $site_code, $code );

			$this->credentials->set(
				array(
					'oauth2_client_id'     => $data['site_id'],
					'oauth2_client_secret' => $data['site_secret'],
				)
			);
		} catch ( Exception $exception ) {
			$error_message = $exception->getMessage();

			// If missing verification, rely on the redirect back to the proxy,
			// passing the site code instead of site ID.
			if ( 'missing_verification' === $error_message ) {
				add_filter(
					'googlesitekit_proxy_setup_url_params',
					function ( $params ) use ( $site_code ) {
						$params['site_code'] = $site_code;
						return $params;
					}
				);
				return;
			}

			if ( ! $error_message ) {
				$error_message = 'unknown_error';
			}

			$this->user_options->set( OAuth_Client::OPTION_ERROR_CODE, $error_message );
			wp_safe_redirect(
				$this->context->admin_url( 'splash' )
			);
			exit;
		}
	}

	/**
	 * Requires user input if it is not already completed.
	 *
	 * @since 1.22.0
	 */
	private function require_user_input() {
		if ( ! Feature_Flags::enabled( 'userInput' ) ) {
			return;
		}

		if ( User_Input_State::VALUE_COMPLETED !== $this->user_input_state->get() ) {
			$this->user_input_state->set( User_Input_State::VALUE_REQUIRED );
			// Set the `mode` query parameter in the proxy setup URL.
			add_filter(
				'googlesitekit_proxy_setup_url_params',
				function ( $params ) {
					return array_merge( $params, array( 'mode' => 'user_input' ) );
				}
			);
		}
	}

	/**
	 * Redirects back to the authentication service with any added parameters.
	 *
	 * @since 1.1.2
	 *
	 * @param string $code Code ('googlesitekit_code') provided by proxy.
	 */
	private function redirect_to_proxy( $code ) {
		wp_safe_redirect(
			$this->get_oauth_client()->get_proxy_setup_url( $code )
		);
		exit;
	}

	/**
	 * Sets the current connected proxy URL.
	 *
	 * @since 1.17.0
	 */
	private function set_connected_proxy_url() {
		$this->connected_proxy_url->set( $this->context->get_canonical_home_url() );
	}

	/**
	 * Checks whether the current site URL has changed or not. If the URL has been changed,
	 * it disconnects the Site Kit and sets the disconnected reason to "connected_url_mismatch".
	 *
	 * @since 1.17.0
	 */
	private function check_connected_proxy_url() {
		if ( $this->connected_proxy_url->matches_url( $this->context->get_canonical_home_url() ) ) {
			return;
		}

		if ( ! current_user_can( Permissions::SETUP ) ) {
			return;
		}

		if ( ! $this->credentials->has() ) {
			return;
		}

		if ( ! $this->credentials->using_proxy() ) {
			return;
		}

		if ( ! $this->is_authenticated() ) {
			return;
		}

		if ( ! $this->connected_proxy_url->has() ) {
			$this->set_connected_proxy_url();
			return;
		}

		$this->disconnect();
		$this->disconnected_reason->set( Disconnected_Reason::REASON_CONNECTED_URL_MISMATCH );
	}

	/**
	 * Handles user connection action and redirects to the proxy connection page.
	 *
	 * @since 1.17.0
	 */
	private function handle_sync_site_fields() {
		// If this query parameter is sent, the request comes from the authentication proxy as part of an ongoing setup flow, so there is no need to sync site fields.
		$googlesitekit_code = $this->context->input()->filter( INPUT_GET, 'googlesitekit_code' );
		if ( $googlesitekit_code ) {
			return;
		}

		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'You have insufficient permissions to connect Site Kit.', 'google-site-kit' ) );
		}

		if ( ! $this->credentials->using_proxy() ) {
			wp_die( esc_html__( 'Site Kit is not configured to use the authentication proxy.', 'google-site-kit' ) );
		}

		if ( $this->google_proxy->are_site_fields_synced( $this->credentials ) === false ) {
			$this->google_proxy->sync_site_fields( $this->credentials, 'sync' );
		}
	}

	/**
	 * Gets the publicly visible URL to set up the plugin with the authentication proxy.
	 *
	 * @since 1.17.0
	 *
	 * @return string An URL for googlesitekit_proxy_connect_user action protected with a nonce.
	 */
	private function get_proxy_setup_url() {
		return add_query_arg(
			array(
				'action' => Google_Proxy::ACTION_SETUP,
				'nonce'  => wp_create_nonce( Google_Proxy::ACTION_SETUP ),
			),
			admin_url( 'index.php' )
		);
	}

	/**
	 * Handles proxy permissions.
	 *
	 * @since 1.18.0
	 */
	private function handle_proxy_permissions() {
		$nonce = $this->context->input()->filter( INPUT_GET, 'nonce' );
		if ( ! wp_verify_nonce( $nonce, Google_Proxy::ACTION_PERMISSIONS ) ) {
			wp_die( esc_html__( 'Invalid nonce.', 'google-site-kit' ) );
		}

		if ( ! current_user_can( Permissions::AUTHENTICATE ) ) {
			wp_die( esc_html__( 'You have insufficient permissions to manage Site Kit permissions.', 'google-site-kit' ) );
		}

		if ( ! $this->credentials->using_proxy() ) {
			wp_die( esc_html__( 'Site Kit is not configured to use the authentication proxy.', 'google-site-kit' ) );
		}

		wp_safe_redirect( $this->get_oauth_client()->get_proxy_permissions_url() );
		exit;

	}

	/**
	 * Gets the proxy permission URL.
	 *
	 * @since 1.18.0
	 *
	 * @return string Proxy permission URL.
	 */
	private function get_proxy_permissions_url() {
		return add_query_arg(
			array(
				'action' => Google_Proxy::ACTION_PERMISSIONS,
				'nonce'  => wp_create_nonce( Google_Proxy::ACTION_PERMISSIONS ),
			),
			admin_url( 'index.php' )
		);
	}

	/**
	 * Verifies the user input settings
	 *
	 * @since 1.20.0
	 */
	private function verify_user_input_settings() {
		if (
			empty( $this->user_input_state->get() )
			&& $this->is_authenticated()
			&& $this->credentials()->has()
			&& $this->credentials->using_proxy()
		) {
			$is_empty = $this->user_input_settings->are_settings_empty();
			if ( ! is_null( $is_empty ) ) {
				$this->user_input_state->set( $is_empty ? User_Input_State::VALUE_MISSING : User_Input_State::VALUE_COMPLETED );
			}
		}
	}

}
