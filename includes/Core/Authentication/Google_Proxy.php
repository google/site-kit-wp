<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Google_Proxy
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Exception;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\URL;
use WP_Error;

/**
 * Class for authentication service.
 *
 * @since 1.1.2
 * @access private
 * @ignore
 */
class Google_Proxy {

	const PRODUCTION_BASE_URL       = 'https://sitekit.withgoogle.com';
	const STAGING_BASE_URL          = 'https://site-kit-dev.appspot.com';
	const DEVELOPMENT_BASE_URL      = 'https://site-kit-local.appspot.com';
	const OAUTH2_SITE_URI           = '/o/oauth2/site/';
	const OAUTH2_REVOKE_URI         = '/o/oauth2/revoke/';
	const OAUTH2_TOKEN_URI          = '/o/oauth2/token/';
	const OAUTH2_AUTH_URI           = '/o/oauth2/auth/';
	const OAUTH2_DELETE_SITE_URI    = '/o/oauth2/delete-site/';
	const SETUP_URI                 = '/v2/site-management/setup/';
	const PERMISSIONS_URI           = '/site-management/permissions/';
	const FEATURES_URI              = '/site-management/features/';
	const SURVEY_TRIGGER_URI        = '/survey/trigger/';
	const SURVEY_EVENT_URI          = '/survey/event/';
	const SUPPORT_LINK_URI          = '/support';
	const ACTION_EXCHANGE_SITE_CODE = 'googlesitekit_proxy_exchange_site_code';
	const ACTION_SETUP              = 'googlesitekit_proxy_setup';
	const ACTION_SETUP_START        = 'googlesitekit_proxy_setup_start';
	const ACTION_PERMISSIONS        = 'googlesitekit_proxy_permissions';
	const ACTION_VERIFY             = 'googlesitekit_proxy_verify';
	const NONCE_ACTION              = 'googlesitekit_proxy_nonce';
	const HEADER_REDIRECT_TO        = 'Redirect-To';

	/**
	 * Plugin context.
	 *
	 * @since 1.1.2
	 * @var Context
	 */
	private $context;

	/**
	 * Required scopes list.
	 *
	 * @since 1.68.0
	 * @var array
	 */
	private $required_scopes = array();

	/**
	 * Google_Proxy constructor.
	 *
	 * @since 1.1.2
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Sets required scopes to use when the site is registering at proxy.
	 *
	 * @since 1.68.0
	 *
	 * @param array $scopes List of scopes.
	 */
	public function with_scopes( array $scopes ) {
		$this->required_scopes = $scopes;
	}

	/**
	 * Returns the application name: a combination of the namespace and version.
	 *
	 * @since 1.27.0
	 *
	 * @return string The application name.
	 */
	public static function get_application_name() {
		$platform = self::get_platform();
		return $platform . '/google-site-kit/' . GOOGLESITEKIT_VERSION;
	}

	/**
	 * Gets the list of features to declare support for when setting up with the proxy.
	 *
	 * @since 1.27.0
	 *
	 * @return array Array of supported features.
	 */
	private function get_supports() {
		$supports = array(
			'credentials_retrieval',
			'short_verification_token',
		);

		$home_path = URL::parse( $this->context->get_canonical_home_url(), PHP_URL_PATH );
		if ( ! $home_path || '/' === $home_path ) {
			$supports[] = 'file_verification';
		}

		return $supports;
	}

	/**
	 * Returns the setup URL to the authentication proxy.
	 *
	 * @since 1.49.0
	 * @since 1.71.0 Uses the V2 setup flow by default.
	 *
	 * @param array $query_params Query parameters to include in the URL.
	 * @return string URL to the setup page on the authentication proxy.
	 *
	 * @throws Exception Thrown if called without the required query parameters.
	 */
	public function setup_url( array $query_params = array() ) {
		if ( empty( $query_params['code'] ) ) {
			throw new Exception( __( 'Missing code parameter for setup URL.', 'google-site-kit' ) );
		}
		if ( empty( $query_params['site_id'] ) && empty( $query_params['site_code'] ) ) {
			throw new Exception( __( 'Missing site_id or site_code parameter for setup URL.', 'google-site-kit' ) );
		}

		return add_query_arg( $query_params, $this->url( self::SETUP_URI ) );
	}

	/**
	 * Conditionally adds the `step` parameter to the passed query parameters, depending on the given error code.
	 *
	 * @since 1.49.0
	 *
	 * @param array  $query_params Query parameters.
	 * @param string $error_code Error code.
	 * @return array Query parameters with `step` included, depending on the error code.
	 */
	public function add_setup_step_from_error_code( $query_params, $error_code ) {
		switch ( $error_code ) {
			case 'missing_verification':
				$query_params['step'] = 'verification';
				break;
			case 'missing_delegation_consent':
				$query_params['step'] = 'delegation_consent';
				break;
			case 'missing_search_console_property':
				$query_params['step'] = 'search_console_property';
				break;
		}
		return $query_params;
	}

	/**
	 * Returns the permissions URL to the authentication proxy.
	 *
	 * This only returns a URL if the user already has an access token set.
	 *
	 * @since 1.27.0
	 *
	 * @param Credentials $credentials Credentials instance.
	 * @param array       $query_args  Optional. Additional query parameters.
	 * @return string URL to the permissions page on the authentication proxy on success, or an empty string on failure.
	 */
	public function permissions_url( Credentials $credentials, array $query_args = array() ) {
		if ( $credentials->has() ) {
			$creds                 = $credentials->get();
			$query_args['site_id'] = $creds['oauth2_client_id'];
		}

		$query_args['application_name'] = rawurlencode( self::get_application_name() );
		$query_args['hl']               = $this->context->get_locale( 'user' );

		return add_query_arg( $query_args, $this->url( self::PERMISSIONS_URI ) );
	}

	/**
	 * Gets a URL to the proxy with optional path.
	 *
	 * @since 1.1.2
	 *
	 * @param string $path Optional. Path to append to the base URL.
	 * @return string Complete proxy URL.
	 */
	public function url( $path = '' ) {
		$url          = self::PRODUCTION_BASE_URL;
		$allowed_urls = array(
			self::PRODUCTION_BASE_URL,
			self::STAGING_BASE_URL,
			self::DEVELOPMENT_BASE_URL,
		);

		if ( defined( 'GOOGLESITEKIT_PROXY_URL' ) && in_array( GOOGLESITEKIT_PROXY_URL, $allowed_urls, true ) ) {
			$url = GOOGLESITEKIT_PROXY_URL;
		}

		$url = untrailingslashit( $url );
		if ( $path && is_string( $path ) ) {
			$url .= '/' . ltrim( $path, '/' );
		}

		return $url;
	}

	/**
	 * Sends a POST request to the Google Proxy server.
	 *
	 * @since 1.27.0
	 *
	 * @param string      $uri Endpoint to send the request to.
	 * @param Credentials $credentials Credentials instance.
	 * @param array       $args Array of request arguments.
	 * @return array|WP_Error The response as an associative array or WP_Error on failure.
	 */
	private function request( $uri, $credentials, array $args = array() ) {
		$request_args = array(
			'headers' => ! empty( $args['headers'] ) && is_array( $args['headers'] ) ? $args['headers'] : array(),
			'body'    => ! empty( $args['body'] ) && is_array( $args['body'] ) ? $args['body'] : array(),
			'timeout' => isset( $args['timeout'] ) ? $args['timeout'] : 15,
		);

		if ( $credentials && $credentials instanceof Credentials ) {
			if ( ! $credentials->has() ) {
				return new WP_Error(
					'oauth_credentials_not_exist',
					__( 'OAuth credentials haven\'t been found.', 'google-site-kit' ),
					array( 'status' => 401 )
				);
			}

			$creds                               = $credentials->get();
			$request_args['body']['site_id']     = $creds['oauth2_client_id'];
			$request_args['body']['site_secret'] = $creds['oauth2_client_secret'];
		}

		if ( ! empty( $args['access_token'] ) && is_string( $args['access_token'] ) ) {
			$request_args['headers']['Authorization'] = 'Bearer ' . $args['access_token'];
		}

		if ( isset( $args['mode'] ) && 'async' === $args['mode'] ) {
			$request_args['timeout']  = 0.01;
			$request_args['blocking'] = false;
		}

		if ( ! empty( $args['json_request'] ) ) {
			$request_args['headers']['Content-Type'] = 'application/json';
			$request_args['body']                    = wp_json_encode( $request_args['body'] );
		}

		$url      = $this->url( $uri );
		$response = wp_remote_post( $url, $request_args );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = wp_remote_retrieve_body( $response );
		$body = json_decode( $body, true );
		if ( $code < 200 || 299 < $code ) {
			$message = is_array( $body ) && ! empty( $body['error'] ) ? $body['error'] : '';
			return new WP_Error( 'request_failed', $message, array( 'status' => $code ) );
		}

		if ( ! empty( $args['return'] ) && 'response' === $args['return'] ) {
			return $response;
		}

		if ( is_null( $body ) ) {
			return new WP_Error(
				'failed_to_parse_response',
				__( 'Failed to parse response.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		return $body;
	}

	/**
	 * Gets site fields.
	 *
	 * @since 1.5.0
	 *
	 * @return array Associative array of $query_arg => $value pairs.
	 */
	public function get_site_fields() {
		return array(
			'name'                   => wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
			'url'                    => $this->context->get_canonical_home_url(),
			'redirect_uri'           => add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ),
			'action_uri'             => admin_url( 'index.php' ),
			'return_uri'             => $this->context->admin_url( 'splash' ),
			'analytics_redirect_uri' => add_query_arg( 'gatoscallback', 1, admin_url( 'index.php' ) ),
		);
	}

	/**
	 * Gets metadata fields.
	 *
	 * @since 1.68.0
	 *
	 * @return array Metadata fields array.
	 */
	public function get_metadata_fields() {
		$metadata = array(
			'supports'         => implode( ' ', $this->get_supports() ),
			'nonce'            => wp_create_nonce( self::NONCE_ACTION ),
			'mode'             => '',
			'hl'               => $this->context->get_locale( 'user' ),
			'application_name' => self::get_application_name(),
			'service_version'  => 'v2',
		);

		/**
		 * Filters the setup mode.
		 *
		 * @since 1.68.0
		 *
		 * @param string $mode An initial setup mode.
		 */
		$metadata['mode'] = apply_filters( 'googlesitekit_proxy_setup_mode', $metadata['mode'] );

		return $metadata;
	}

	/**
	 * Fetch site fields
	 *
	 * @since 1.22.0
	 *
	 * @param Credentials $credentials Credentials instance.
	 * @return array|WP_Error The response as an associative array or WP_Error on failure.
	 */
	public function fetch_site_fields( Credentials $credentials ) {
		return $this->request( self::OAUTH2_SITE_URI, $credentials );
	}

	/**
	 * Are site fields synced
	 *
	 * @since 1.22.0
	 *
	 * @param Credentials $credentials Credentials instance.
	 *
	 * @return boolean|WP_Error Boolean do the site fields match or WP_Error on failure.
	 */
	public function are_site_fields_synced( Credentials $credentials ) {
		$site_fields = $this->fetch_site_fields( $credentials );
		if ( is_wp_error( $site_fields ) ) {
			return $site_fields;
		}

		$get_site_fields = $this->get_site_fields();
		foreach ( $get_site_fields as $key => $site_field ) {
			if ( ! array_key_exists( $key, $site_fields ) || $site_fields[ $key ] !== $site_field ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Gets user fields.
	 *
	 * @since 1.10.0
	 *
	 * @return array Associative array of $query_arg => $value pairs.
	 */
	public function get_user_fields() {
		$user_roles = wp_get_current_user()->roles;
		// If multisite, also consider network administrators.
		if ( is_multisite() && current_user_can( 'manage_network' ) ) {
			$user_roles[] = 'network_administrator';
		}
		$user_roles = array_unique( $user_roles );

		return array(
			'user_roles' => implode( ',', $user_roles ),
		);
	}

	/**
	 * Unregisters the site on the proxy.
	 *
	 * @since 1.20.0
	 *
	 * @param Credentials $credentials Credentials instance.
	 * @return array|WP_Error Response data on success, otherwise WP_Error object.
	 */
	public function unregister_site( Credentials $credentials ) {
		return $this->request( self::OAUTH2_DELETE_SITE_URI, $credentials );
	}

	/**
	 * Registers the site on the proxy.
	 *
	 * @since 1.68.0
	 *
	 * @param string $mode Sync mode.
	 * @return string|WP_Error Redirect URL on success, otherwise an error.
	 */
	public function register_site( $mode = 'async' ) {
		return $this->send_site_fields( null, $mode );
	}

	/**
	 * Synchronizes site fields with the proxy.
	 *
	 * @since 1.5.0
	 * @since 1.68.0 Updated the function to return redirect URL.
	 *
	 * @param Credentials $credentials Credentials instance.
	 * @param string      $mode        Sync mode.
	 * @return string|WP_Error Redirect URL on success, otherwise an error.
	 */
	public function sync_site_fields( Credentials $credentials, $mode = 'async' ) {
		return $this->send_site_fields( $credentials, $mode );
	}

	/**
	 * Sends site fields to the proxy.
	 *
	 * @since 1.68.0
	 *
	 * @param Credentials $credentials Credentials instance.
	 * @param string      $mode        Sync mode.
	 * @return string|WP_Error Redirect URL on success, otherwise an error.
	 */
	private function send_site_fields( Credentials $credentials = null, $mode = 'async' ) {
		$response = $this->request(
			self::OAUTH2_SITE_URI,
			$credentials,
			array(
				'return' => 'response',
				'mode'   => $mode,
				'body'   => array_merge(
					$this->get_site_fields(),
					$this->get_user_fields(),
					$this->get_metadata_fields(),
					array(
						'scope' => implode( ' ', $this->required_scopes ),
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$redirect_to = wp_remote_retrieve_header( $response, self::HEADER_REDIRECT_TO );
		if ( empty( $redirect_to ) ) {
			return new WP_Error(
				'failed_to_retrive_redirect',
				__( 'Failed to retrieve redirect URL.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		return $redirect_to;
	}

	/**
	 * Exchanges a site code for client credentials from the proxy.
	 *
	 * @since 1.1.2
	 *
	 * @param string $site_code        Site code identifying the site.
	 * @param string $undelegated_code Undelegated code identifying the undelegated token.
	 * @return array|WP_Error Response data containing site_id and site_secret on success, WP_Error object on failure.
	 */
	public function exchange_site_code( $site_code, $undelegated_code ) {
		$response_data = $this->request(
			self::OAUTH2_SITE_URI,
			null,
			array(
				'body' => array(
					'code'      => $undelegated_code,
					'site_code' => $site_code,
				),
			)
		);

		if ( is_wp_error( $response_data ) ) {
			return $response_data;
		}

		if ( ! isset( $response_data['site_id'], $response_data['site_secret'] ) ) {
			return new WP_Error(
				'oauth_credentials_not_exist',
				__( 'OAuth credentials haven\'t been found.', 'google-site-kit' ),
				array( 'status' => 401 )
			);
		}

		return $response_data;
	}

	/**
	 * Gets remote features.
	 *
	 * @since 1.27.0
	 *
	 * @param Credentials $credentials Credentials instance.
	 * @return array|WP_Error Response of the wp_remote_post request.
	 */
	public function get_features( Credentials $credentials ) {
		global $wp_version;

		$platform               = self::get_platform();
		$user_count             = count_users();
		$connectable_user_count = isset( $user_count['avail_roles']['administrator'] ) ? $user_count['avail_roles']['administrator'] : 0;

		$body = array(
			'platform'               => $platform . '/google-site-kit',
			'version'                => GOOGLESITEKIT_VERSION,
			'platform_version'       => $wp_version,
			'user_count'             => $user_count['total_users'],
			'connectable_user_count' => $connectable_user_count,
			'connected_user_count'   => $this->count_connected_users(),
		);

		/**
		 * Filters additional context data sent with the body of a remote-controlled features request.
		 *
		 * @since 1.71.0
		 *
		 * @param array $body Context data to be sent with the features request.
		 */
		$body = apply_filters( 'googlesitekit_features_request_data', $body );

		return $this->request( self::FEATURES_URI, $credentials, array( 'body' => $body ) );
	}

	/**
	 * Gets the number of users who are connected (i.e. authenticated /
	 * have an access token).
	 *
	 * @since 1.71.0
	 *
	 * @return int Number of WordPress user accounts connected to SiteKit.
	 */
	public function count_connected_users() {
		$user_options    = new User_Options( $this->context );
		$connected_users = get_users(
			array(
				'meta_key'     => $user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_compare' => 'EXISTS',
				'role'         => 'administrator',
				'fields'       => 'ID',
			)
		);

		return count( $connected_users );
	}

	/**
	 * Gets the platform.
	 *
	 * @since 1.37.0
	 *
	 * @return string WordPress multisite or WordPress.
	 */
	public static function get_platform() {
		if ( is_multisite() ) {
			return 'wordpress-multisite';
		}
		return 'wordpress'; // phpcs:ignore WordPress.WP.CapitalPDangit.Misspelled
	}

	/**
	 * Sends survey trigger ID to the proxy.
	 *
	 * @since 1.35.0
	 *
	 * @param Credentials $credentials  Credentials instance.
	 * @param string      $access_token Access token.
	 * @param string      $trigger_id   Token ID.
	 * @return array|WP_Error Response of the wp_remote_post request.
	 */
	public function send_survey_trigger( Credentials $credentials, $access_token, $trigger_id ) {
		return $this->request(
			self::SURVEY_TRIGGER_URI,
			$credentials,
			array(
				'access_token' => $access_token,
				'json_request' => true,
				'body'         => array(
					'trigger_context' => array(
						'trigger_id' => $trigger_id,
						'language'   => get_user_locale(),
					),
				),
			)
		);
	}

	/**
	 * Sends survey event to the proxy.
	 *
	 * @since 1.35.0
	 *
	 * @param Credentials     $credentials  Credentials instance.
	 * @param string          $access_token Access token.
	 * @param array|\stdClass $session      Session object.
	 * @param array|\stdClass $event        Event object.
	 * @return array|WP_Error Response of the wp_remote_post request.
	 */
	public function send_survey_event( Credentials $credentials, $access_token, $session, $event ) {
		return $this->request(
			self::SURVEY_EVENT_URI,
			$credentials,
			array(
				'access_token' => $access_token,
				'json_request' => true,
				'body'         => array(
					'session' => $session,
					'event'   => $event,
				),
			)
		);
	}

}
