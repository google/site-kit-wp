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
	const OAUTH2_SITE_URI           = '/o/oauth2/site/';
	const OAUTH2_REVOKE_URI         = '/o/oauth2/revoke/';
	const OAUTH2_TOKEN_URI          = '/o/oauth2/token/';
	const OAUTH2_AUTH_URI           = '/o/oauth2/auth/';
	const OAUTH2_DELETE_SITE_URI    = '/o/oauth2/delete-site/';
	const SETUP_URI                 = '/site-management/setup/';
	const PERMISSIONS_URI           = '/site-management/permissions/';
	const USER_INPUT_SETTINGS_URI   = '/site-management/settings/';
	const FEATURES_URI              = '/site-management/features/';
	const SURVEY_TRIGGER_URI        = '/survey/trigger/';
	const SURVEY_EVENT_URI          = '/survey/event/';
	const ACTION_EXCHANGE_SITE_CODE = 'googlesitekit_proxy_exchange_site_code';
	const ACTION_SETUP              = 'googlesitekit_proxy_setup';
	const ACTION_SETUP_START        = 'googlesitekit_proxy_setup_start';
	const ACTION_PERMISSIONS        = 'googlesitekit_proxy_permissions';
	const ACTION_VERIFY             = 'googlesitekit_proxy_verify';
	const NONCE_ACTION              = 'googlesitekit_proxy_nonce';

	/**
	 * Plugin context.
	 *
	 * @since 1.1.2
	 * @var Context
	 */
	private $context;

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
			// Informs the proxy the user input feature is generally supported.
			'user_input_flow',
		);

		$home_path = wp_parse_url( $this->context->get_canonical_home_url(), PHP_URL_PATH );
		if ( ! $home_path || '/' === $home_path ) {
			$supports[] = 'file_verification';
		}

		// Informs the proxy the user input feature is already enabled locally.
		// TODO: Remove once the feature is fully rolled out.
		if ( Feature_Flags::enabled( 'userInput' ) ) {
			$supports[] = 'user_input_flow_feature';
		}

		return $supports;
	}

	/**
	 * Returns the setup URL to the authentication proxy.
	 *
	 * @since 1.27.0
	 *
	 * @param Credentials $credentials  Credentials instance.
	 * @param array       $query_params Optional. Additional query parameters.
	 * @return string URL to the setup page on the authentication proxy.
	 */
	public function setup_url( Credentials $credentials, array $query_params = array() ) {
		$params = array_merge(
			$query_params,
			array(
				'supports' => rawurlencode( implode( ' ', $this->get_supports() ) ),
				'nonce'    => rawurlencode( wp_create_nonce( self::NONCE_ACTION ) ),
			)
		);

		if ( $credentials->has() ) {
			$creds             = $credentials->get();
			$params['site_id'] = $creds['oauth2_client_id'];
		}

		/**
		 * Filters parameters included in proxy setup URL.
		 *
		 * @since 1.27.0
		 */
		$params = apply_filters( 'googlesitekit_proxy_setup_url_params', $params );

		// If no site identification information is present, we need to provide details for a new site.
		if ( empty( $params['site_id'] ) && empty( $params['site_code'] ) ) {
			$site_fields = array_map( 'rawurlencode', $this->get_site_fields() );
			$params      = array_merge( $params, $site_fields );
		}

		$user_fields = array_map( 'rawurlencode', $this->get_user_fields() );
		$params      = array_merge( $params, $user_fields );

		$params['application_name'] = rawurlencode( self::get_application_name() );
		$params['hl']               = $this->context->get_locale( 'user' );

		return add_query_arg( $params, $this->url( self::SETUP_URI ) );
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
		$url = defined( 'GOOGLESITEKIT_PROXY_URL' ) && self::STAGING_BASE_URL === GOOGLESITEKIT_PROXY_URL
			? self::STAGING_BASE_URL
			: self::PRODUCTION_BASE_URL;

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
			'name'                   => wp_specialchars_decode( get_bloginfo( 'name' ) ),
			'url'                    => $this->context->get_canonical_home_url(),
			'redirect_uri'           => add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ),
			'action_uri'             => admin_url( 'index.php' ),
			'return_uri'             => $this->context->admin_url( 'splash' ),
			'analytics_redirect_uri' => add_query_arg( 'gatoscallback', 1, admin_url( 'index.php' ) ),
		);
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
	 * Synchronizes site fields with the proxy.
	 *
	 * @since 1.5.0
	 *
	 * @param Credentials $credentials Credentials instance.
	 * @param string      $mode        Sync mode.
	 * @return array|WP_Error Response of the wp_remote_post request.
	 */
	public function sync_site_fields( Credentials $credentials, $mode = 'async' ) {
		return $this->request(
			self::OAUTH2_SITE_URI,
			$credentials,
			array(
				'mode' => $mode,
				'body' => $this->get_site_fields(),
			)
		);
	}

	/**
	 * Synchronizes user input settings with the proxy.
	 *
	 * @since 1.27.0
	 *
	 * @param Credentials $credentials  Credentials instance.
	 * @param string      $access_token Access token.
	 * @param array|null  $settings     Settings array.
	 * @return array|WP_Error Response of the wp_remote_post request.
	 */
	public function sync_user_input_settings( Credentials $credentials, $access_token, $settings = null ) {
		$body = array();
		if ( ! empty( $settings ) ) {
			$body = array(
				'settings'       => $settings,
				'client_user_id' => (string) get_current_user_id(),
			);
		}

		return $this->request(
			self::USER_INPUT_SETTINGS_URI,
			$credentials,
			array(
				'json_request' => true,
				'access_token' => $access_token,
				'body'         => $body,
			)
		);
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
	 * @param Credentials $credentials  Credentials instance.
	 * @return array|WP_Error Response of the wp_remote_post request.
	 */
	public function get_features( Credentials $credentials ) {
		$platform = self::get_platform();
		return $this->request(
			self::FEATURES_URI,
			$credentials,
			array(
				'body' => array(
					'platform' => $platform . '/google-site-kit',
					'version'  => GOOGLESITEKIT_VERSION,
				),
			)
		);
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
