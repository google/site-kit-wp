<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Authentication
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
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
use Google\Site_Kit\Plugin;
use WP_Error;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Modules\Idea_Hub;
use Google\Site_Kit\Modules\Subscribe_With_Google;

/**
 * Authentication Class.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Authentication {

	use Method_Proxy_Trait;

	const ACTION_CONNECT    = 'googlesitekit_connect';
	const ACTION_DISCONNECT = 'googlesitekit_disconnect';

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
	 * Modules object.
	 *
	 * @since 1.70.0
	 *
	 * @var Modules
	 */
	private $modules = null;

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
	 * Token instance.
	 *
	 * @since 1.39.0
	 * @var Token
	 */
	protected $token;

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
	 * Has_Multiple_Admins instance.
	 *
	 * @since 1.29.0
	 * @var Has_Multiple_Admins
	 */
	protected $has_multiple_admins;

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
	 * Initial_Version instance.
	 *
	 * @since 1.25.0
	 * @var Initial_Version
	 */
	protected $initial_version;

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
		$this->modules              = new Modules( $this->context, $this->options, $this->user_options, $this );
		$this->user_input_state     = new User_Input_State( $this->user_options );
		$this->user_input_settings  = new User_Input_Settings( $context, $this, $transients );
		$this->google_proxy         = new Google_Proxy( $this->context );
		$this->credentials          = new Credentials( new Encrypted_Options( $this->options ) );
		$this->verification         = new Verification( $this->user_options );
		$this->verification_meta    = new Verification_Meta( $this->user_options );
		$this->verification_file    = new Verification_File( $this->user_options );
		$this->profile              = new Profile( $this->user_options );
		$this->token                = new Token( $this->user_options );
		$this->owner_id             = new Owner_ID( $this->options );
		$this->has_connected_admins = new Has_Connected_Admins( $this->options, $this->user_options );
		$this->has_multiple_admins  = new Has_Multiple_Admins( $this->transients );
		$this->connected_proxy_url  = new Connected_Proxy_URL( $this->options );
		$this->disconnected_reason  = new Disconnected_Reason( $this->user_options );
		$this->initial_version      = new Initial_Version( $this->user_options );
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
		$this->initial_version->register();

		add_filter( 'allowed_redirect_hosts', $this->get_method_proxy( 'allowed_redirect_hosts' ) );
		add_filter( 'googlesitekit_admin_data', $this->get_method_proxy( 'inline_js_admin_data' ) );
		add_filter( 'googlesitekit_admin_notices', $this->get_method_proxy( 'authentication_admin_notices' ) );
		add_filter( 'googlesitekit_inline_base_data', $this->get_method_proxy( 'inline_js_base_data' ) );
		add_filter( 'googlesitekit_setup_data', $this->get_method_proxy( 'inline_js_setup_data' ) );
		add_filter( 'googlesitekit_is_feature_enabled', $this->get_method_proxy( 'filter_features_via_proxy' ), 10, 2 );

		add_action( 'googlesitekit_cron_update_remote_features', $this->get_method_proxy( 'cron_update_remote_features' ) );
		if ( ! wp_next_scheduled( 'googlesitekit_cron_update_remote_features' ) && ! wp_installing() ) {
			wp_schedule_event( time(), 'twicedaily', 'googlesitekit_cron_update_remote_features' );
		}

		add_action( 'admin_init', $this->get_method_proxy( 'handle_oauth' ) );
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
		add_action( 'admin_action_' . self::ACTION_CONNECT, $this->get_method_proxy( 'handle_connect' ) );
		add_action( 'admin_action_' . self::ACTION_DISCONNECT, $this->get_method_proxy( 'handle_disconnect' ) );

		add_action(
			'admin_action_' . Google_Proxy::ACTION_PERMISSIONS,
			function () {
				$this->handle_proxy_permissions();
			}
		);

		add_action(
			'googlesitekit_authorize_user',
			function ( $token_response, $scopes, $previous_scopes ) {
				if ( ! $this->credentials->using_proxy() ) {
					return;
				}

				$this->set_connected_proxy_url();

				if ( empty( $previous_scopes ) ) {
					$this->require_user_input();
				}
			},
			10,
			3
		);

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
				if ( $this->profile->has() ) {
					$profile_data            = $this->profile->get();
					$user['user']['email']   = $profile_data['email'];
					$user['user']['picture'] = $profile_data['photo'];
				}

				$user['connectURL']     = esc_url_raw( $this->get_connect_url() );
				$user['initialVersion'] = $this->initial_version->get();
				$user['userInputState'] = $this->user_input_state->get();
				$user['verified']       = $this->verification->has();

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

		// If no initial version set for the current user, set it when getting a new access token.
		if ( ! $this->initial_version->get() ) {
			$set_initial_version = function() {
				$this->initial_version->set( GOOGLESITEKIT_VERSION );
			};
			add_action( 'googlesitekit_authorize_user', $set_initial_version );
			add_action( 'googlesitekit_reauthorize_user', $set_initial_version );
		}

		add_action(
			'current_screen',
			function( $current_screen ) {
				$this->maybe_refresh_token_for_screen( $current_screen->id );
			}
		);

		add_action(
			'heartbeat_tick',
			function() {
				$this->maybe_refresh_token_for_screen( $this->context->input()->filter( INPUT_POST, 'screen_id' ) );
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
	 * Gets the Token instance.
	 *
	 * @since 1.39.0
	 *
	 * @return Token Token instance.
	 */
	public function token() {
		return $this->token;
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
			$this->auth_client = new OAuth_Client(
				$this->context,
				$this->options,
				$this->user_options,
				$this->credentials,
				$this->google_proxy,
				$this->profile,
				$this->token
			);
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
	 * @since 1.32.0 Updated to use dedicated action URL.
	 *
	 * @return string Connect URL.
	 */
	public function get_connect_url() {
		return add_query_arg(
			array(
				'action' => self::ACTION_CONNECT,
				'nonce'  => wp_create_nonce( self::ACTION_CONNECT ),
			),
			admin_url( 'index.php' )
		);
	}

	/**
	 * Gets the URL for disconnecting from Site Kit.
	 *
	 * @since 1.0.0
	 * @since 1.32.0 Updated to use dedicated action URL.
	 *
	 * @return string Disconnect URL.
	 */
	public function get_disconnect_url() {
		return add_query_arg(
			array(
				'action' => self::ACTION_DISCONNECT,
				'nonce'  => wp_create_nonce( self::ACTION_DISCONNECT ),
			),
			admin_url( 'index.php' )
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
		return $this->token->has();
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
	 * Proactively refreshes the current user's OAuth token when on the
	 * Site Kit Plugin Dashboard screen.
	 *
	 * Also refreshes the module owner's OAuth token for all shareable modules
	 * the current user can read shared data for.
	 *
	 * @since 1.42.0
	 * @since 1.70.0 Moved the closure within regiser() to this method.
	 *
	 * @param string $screen_id The unique ID of the current WP_Screen.
	 *
	 * @return void
	 */
	private function maybe_refresh_token_for_screen( $screen_id ) {
		if ( 'dashboard' !== $screen_id && 'toplevel_page_googlesitekit-dashboard' !== $screen_id ) {
			return;
		}

		if ( Feature_Flags::enabled( 'dashboardSharing' ) ) {
			$this->refresh_shared_module_owner_tokens();
		}

		if ( ! current_user_can( Permissions::AUTHENTICATE ) || ! $this->credentials()->has() ) {
			return;
		}

		$this->refresh_user_token();
	}

	/**
	 * Proactively refreshes the module owner's OAuth token for all shareable
	 * modules the current user can read shared data for.
	 *
	 * @since 1.70.0
	 *
	 * @return void
	 */
	private function refresh_shared_module_owner_tokens() {
		$shareable_modules = $this->modules->get_shareable_modules();
		foreach ( $shareable_modules as $module_slug => $module ) {
			if ( ! current_user_can( Permissions::READ_SHARED_MODULE_DATA, $module_slug ) ) {
				continue;
			}
			$owner_id = $module->get_owner_id();
			if ( ! $owner_id ) {
				continue;
			}
			$restore_user = $this->user_options->switch_user( $owner_id );
			$this->refresh_user_token();
			$restore_user();
		}
	}

	/**
	 * Proactively refreshes the current user's OAuth token.
	 *
	 * @since 1.70.0
	 *
	 * @return void
	 */
	private function refresh_user_token() {
		$token = $this->token->get();

		// Do nothing if the token is not set.
		if ( empty( $token['created'] ) || empty( $token['expires_in'] ) ) {
			return;
		}

		// Do nothing if the token expires in more than 5 minutes.
		if ( $token['created'] + $token['expires_in'] > time() + 5 * MINUTE_IN_SECONDS ) {
			return;
		}

		$this->get_oauth_client()->refresh_token();
	}

	/**
	 * Handles receiving a temporary OAuth code.
	 *
	 * @since 1.0.0
	 * @since 1.32.0 Moved connect and disconnect actions to dedicated handlers.
	 */
	private function handle_oauth() {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return;
		}

		// Handles Direct OAuth client request.
		if ( $this->context->input()->filter( INPUT_GET, 'oauth2callback' ) ) {
			if ( ! current_user_can( Permissions::AUTHENTICATE ) ) {
				wp_die( esc_html__( 'You don\'t have permissions to authenticate with Site Kit.', 'google-site-kit' ), 403 );
			}

			$this->get_oauth_client()->authorize_user();
		}
	}

	/**
	 * Handles request to connect via oAuth.
	 *
	 * @since 1.32.0
	 */
	private function handle_connect() {
		$input = $this->context->input();
		$nonce = $input->filter( INPUT_GET, 'nonce' );
		if ( ! wp_verify_nonce( $nonce, self::ACTION_CONNECT ) ) {
			self::invalid_nonce_error( self::ACTION_CONNECT );
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
			$this->get_oauth_client()->get_authentication_url( $redirect_url, $additional_scopes )
		);
		exit();
	}

	/**
	 * Handles request to disconnect via oAuth.
	 *
	 * @since 1.32.0
	 */
	private function handle_disconnect() {
		$nonce = $this->context->input()->filter( INPUT_GET, 'nonce' );
		if ( ! wp_verify_nonce( $nonce, self::ACTION_DISCONNECT ) ) {
			self::invalid_nonce_error( self::ACTION_DISCONNECT );
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
		$data['splashURL']           = esc_url_raw( $this->context->admin_url( 'splash' ) );
		$data['proxySetupURL']       = '';
		$data['proxyPermissionsURL'] = '';
		$data['usingProxy']          = false;
		$data['isAuthenticated']     = $this->is_authenticated();
		if ( $this->credentials->using_proxy() ) {
			$auth_client                 = $this->get_oauth_client();
			$data['proxySetupURL']       = esc_url_raw( $this->get_proxy_setup_url() );
			$data['proxyPermissionsURL'] = esc_url_raw( $this->get_proxy_permissions_url() );
			$data['usingProxy']          = true;
		}

		$version = get_bloginfo( 'version' );

		// The trailing '.0' is added to the $version to ensure there are always at least 2 segments in the version.
		// This is necessary in case the minor version is stripped from the version string by a plugin.
		// See https://github.com/google/site-kit-wp/issues/4963 for more details.
		list( $major, $minor ) = explode( '.', $version . '.0' );

		$data['wpVersion'] = array(
			'version' => $version,
			'major'   => (int) $major,
			'minor'   => (int) $minor,
		);

		$current_user      = wp_get_current_user();
		$data['userRoles'] = $current_user->roles;

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
		$auth_client      = $this->get_oauth_client();
		$is_authenticated = $this->is_authenticated();

		$data['isSiteKitConnected'] = $this->credentials->has();
		$data['isResettable']       = $this->options->has( Credentials::OPTION );
		$data['isAuthenticated']    = $is_authenticated;
		$data['requiredScopes']     = $auth_client->get_required_scopes();
		$data['grantedScopes']      = $is_authenticated ? $auth_client->get_granted_scopes() : array();
		$data['unsatisfiedScopes']  = $is_authenticated ? $auth_client->get_unsatisfied_scopes() : array();
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

		$can_access_authentication = function() {
			return current_user_can( Permissions::AUTHENTICATE ) || current_user_can( Permissions::VIEW_SHARED_DASHBOARD );
		};

		$can_disconnect = function() {
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
								'hasMultipleAdmins'  => $this->has_multiple_admins->get(),
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
							$oauth_client     = $this->get_oauth_client();
							$is_authenticated = $this->is_authenticated();

							$data = array(
								'authenticated'         => $is_authenticated,
								'requiredScopes'        => $oauth_client->get_required_scopes(),
								'grantedScopes'         => $is_authenticated ? $oauth_client->get_granted_scopes() : array(),
								'unsatisfiedScopes'     => $is_authenticated ? $oauth_client->get_unsatisfied_scopes() : array(),
								'needsReauthentication' => $oauth_client->needs_reauthentication(),
								'disconnectedReason'    => $this->disconnected_reason->get(),
								'connectedProxyURL'     => $this->connected_proxy_url->get(),
							);

							return new WP_REST_Response( $data );
						},
						'permission_callback' => $can_access_authentication,
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
						'permission_callback' => $can_disconnect,
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
					$connected_url = $this->connected_proxy_url->get();
					$current_url   = $this->context->get_canonical_home_url();
					$content       = sprintf(
						'<p>%s <a href="%s">%s</a></p>',
						esc_html__( 'Looks like the URL of your site has changed. In order to continue using Site Kit, you’ll need to reconnect, so that your plugin settings are updated with the new URL.', 'google-site-kit' ),
						esc_url( $this->get_proxy_setup_url() ),
						esc_html__( 'Reconnect', 'google-site-kit' )
					);

					// Only show the comparison if URLs don't match as it is possible
					// they could already match again at this point, although they most likely won't.
					if ( ! $this->connected_proxy_url->matches_url( $current_url ) ) {
						$content .= sprintf(
							'<ul><li>%s</li><li>%s</li></ul>',
							sprintf(
								/* translators: %s: Previous URL */
								esc_html__( 'Old URL: %s', 'google-site-kit' ),
								$connected_url
							),
							sprintf(
								/* translators: %s: Current URL */
								esc_html__( 'New URL: %s', 'google-site-kit' ),
								$current_url
							)
						);
					}

					return $content;
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
					<?php
					BC_Functions::wp_print_inline_script_tag(
						sprintf(
							"
							function clearSiteKitAppStorage() {
								if ( localStorage ) {
									localStorage.clear();
								}
								if ( sessionStorage ) {
									sessionStorage.clear();
								}
								document.location = '%s';
							}
							",
							esc_url_raw( $this->get_connect_url() )
						)
					);
					return ob_get_clean();
				},
				'type'            => Notice::TYPE_SUCCESS,
				'active_callback' => function() {
					if ( ! empty( $this->user_options->get( OAuth_Client::OPTION_ERROR_CODE ) ) ) {
						return false;
					}
					return $this->get_oauth_client()->needs_reauthentication();
				},
			)
		);
	}

	/**
	 * Gets OAuth error notice.
	 *
	 * @since 1.0.0
	 * @since 1.49.0 Uses the new `Google_Proxy::setup_url_v2` method when the `serviceSetupV2` feature flag is enabled.
	 * @since 1.71.0 Remove the `serviceSetupV2` feature flag; now always uses the new service setup approach.
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

					$message = $auth_client->get_error_message( $error_code );

					$access_code = $this->user_options->get( OAuth_Client::OPTION_PROXY_ACCESS_CODE );

					$is_using_proxy = $this->credentials->using_proxy();
					$is_using_proxy = $is_using_proxy && ! empty( $access_code );

					if ( $is_using_proxy ) {
						$credentials = $this->credentials->get();
						$params = array(
							'code'    => $access_code,
							'site_id' => ! empty( $credentials['oauth2_client_id'] ) ? $credentials['oauth2_client_id'] : '',
						);
						$setup_url = $this->google_proxy->setup_url( $params );
						$this->user_options->delete( OAuth_Client::OPTION_PROXY_ACCESS_CODE );
					} elseif ( $this->is_authenticated() ) {
						$setup_url = $this->get_connect_url();
					} else {
						$setup_url = $this->context->admin_url( 'splash' );
					}

					if ( 'access_denied' === $error_code ) {
						$message .= ' ' . sprintf(
							/* translators: %s: setup screen URL */
							__( 'To use Site Kit, you’ll need to <a href="%s">redo the plugin setup</a> – make sure to approve all permissions at the authentication stage.', 'google-site-kit' ),
							esc_url( $setup_url )
						);
					} else {
						$message .= ' ' . sprintf(
							/* translators: %s: setup screen URL */
							__( 'To fix this, <a href="%s">redo the plugin setup</a>.', 'google-site-kit' ),
							esc_url( $setup_url )
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
	 * Requires user input if it is not already completed.
	 *
	 * @since 1.22.0
	 */
	private function require_user_input() {
		if ( ! Feature_Flags::enabled( 'userInput' ) ) {
			return;
		}

		// Refresh user input settings from the proxy.
		// This will ensure the user input state is updated as well.
		$this->user_input_settings->set_settings( null );

		if ( User_Input_State::VALUE_COMPLETED !== $this->user_input_state->get() ) {
			$this->user_input_state->set( User_Input_State::VALUE_REQUIRED );
		}
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
	 * Gets the publicly visible URL to set up the plugin with the authentication proxy.
	 *
	 * @since 1.17.0
	 *
	 * @return string An URL for googlesitekit_proxy_connect_user action protected with a nonce.
	 */
	private function get_proxy_setup_url() {
		return add_query_arg(
			array(
				'action' => Google_Proxy::ACTION_SETUP_START,
				'nonce'  => wp_create_nonce( Google_Proxy::ACTION_SETUP_START ),
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
			self::invalid_nonce_error( Google_Proxy::ACTION_PERMISSIONS );
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

	/**
	 * Filters feature flags using features received from the proxy server.
	 *
	 * @since 1.27.0
	 *
	 * @param boolean $feature_enabled Original value of the feature.
	 * @param string  $feature_name    Feature name.
	 * @return boolean State flag from the proxy server if it is available, otherwise the original value.
	 */
	private function filter_features_via_proxy( $feature_enabled, $feature_name ) {
		$remote_features_option = 'googlesitekitpersistent_remote_features';
		$features               = $this->options->get( $remote_features_option );

		if ( false === $features ) {
			// The experimental features (ideaHubModule and swgModule) are checked within Modules::construct() which
			// runs before Modules::register() where the `googlesitekit_features_request_data` filter is registered.
			// Without this filter, some necessary context data is not sent when a request to Google_Proxy::get_features() is
			// made. So we avoid making this request and solely check the active modules in the database to see if these
			// features are enabled.
			if ( in_array( $feature_name, array( 'ideaHubModule', 'swgModule' ), true ) ) {
				$active_modules = $this->options->get( Modules::OPTION_ACTIVE_MODULES );

				if ( ! is_array( $active_modules ) ) {
					return false;
				}

				if ( 'ideaHubModule' === $feature_name ) {
					return in_array( Idea_Hub::MODULE_SLUG, $active_modules, true );
				}

				if ( 'swgModule' === $feature_name ) {
					return in_array( Subscribe_With_Google::MODULE_SLUG, $active_modules, true );
				}
			}

			// Don't attempt to fetch features if the site is not connected yet.
			if ( ! $this->credentials->has() ) {
				return $feature_enabled;
			}

			$features = $this->fetch_remote_features();
		}

		if ( ! is_wp_error( $features ) && isset( $features[ $feature_name ]['enabled'] ) ) {
			return filter_var( $features[ $feature_name ]['enabled'], FILTER_VALIDATE_BOOLEAN );
		}

		return $feature_enabled;
	}

	/**
	 * Fetches remotely-controlled features from the Google Proxy server and
	 * saves them in a persistent option.
	 *
	 * If the fetch errors or fails, the persistent option is not updated.
	 *
	 * @since 1.71.0
	 *
	 * @return array|WP_Error Array of features or a WP_Error object if the fetch errored.
	 */
	private function fetch_remote_features() {
		$remote_features_option = 'googlesitekitpersistent_remote_features';
		$features               = $this->google_proxy->get_features( $this->credentials );
		if ( ! is_wp_error( $features ) && is_array( $features ) ) {
			$this->options->set( $remote_features_option, $features );
		}

		return $features;
	}

	/**
	 * Action that is run by a cron twice daily to fetch and cache remotely-enabled features
	 * from the Google Proxy server, if Site Kit has been setup.
	 *
	 * @since 1.71.0
	 *
	 * @return void
	 */
	private function cron_update_remote_features() {
		if ( ! $this->credentials->has() ) {
			return;
		}
		$this->fetch_remote_features();
	}

	/**
	 * Invalid nonce error handler.
	 *
	 * @since 1.42.0
	 *
	 * @param string $action Action name.
	 */
	public static function invalid_nonce_error( $action ) {
		if ( strpos( $action, 'googlesitekit_proxy_' ) !== 0 ) {
			wp_nonce_ays( $action );
			return;
		}
		// Copied from wp_nonce_ays() with tweak to the url.
		$html  = __( 'The link you followed has expired.', 'google-site-kit' );
		$html .= '</p><p>';
		$html .= sprintf(
			'<a href="%s">%s</a>',
			esc_url( Plugin::instance()->context()->admin_url( 'splash' ) ),
			__( 'Please try again.', 'google-site-kit' )
		);
		wp_die( $html, __( 'Something went wrong.', 'google-site-kit' ), 403 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
