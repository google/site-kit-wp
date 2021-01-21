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
use WP_Error;
use Exception;

/**
 * Class for authentication service.
 *
 * @since 1.1.2
 * @access private
 * @ignore
 */
class Google_Proxy {

	const BASE_URL                = 'https://sitekit.withgoogle.com';
	const OAUTH2_SITE_URI         = '/o/oauth2/site/';
	const OAUTH2_REVOKE_URI       = '/o/oauth2/revoke/';
	const OAUTH2_TOKEN_URI        = '/o/oauth2/token/';
	const OAUTH2_AUTH_URI         = '/o/oauth2/auth/';
	const OAUTH2_DELETE_SITE_URI  = '/o/oauth2/delete-site/';
	const SETUP_URI               = '/site-management/setup/';
	const PERMISSIONS_URI         = '/site-management/permissions/';
	const USER_INPUT_SETTINGS_URI = '/site-management/settings/';
	const ACTION_SETUP            = 'googlesitekit_proxy_setup';
	const ACTION_PERMISSIONS      = 'googlesitekit_proxy_permissions';

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
	 * Gets a URL to the proxy with optional path.
	 *
	 * @since 1.1.2
	 *
	 * @param string $path Optional. Path to append to the base URL.
	 * @return string Complete proxy URL.
	 */
	public function url( $path = '' ) {
		if ( defined( 'GOOGLESITEKIT_PROXY_URL' ) && GOOGLESITEKIT_PROXY_URL ) {
			$url = GOOGLESITEKIT_PROXY_URL;
		} else {
			$url = self::BASE_URL;
		}

		$url = untrailingslashit( $url );

		if ( $path && is_string( $path ) ) {
			$url .= '/' . ltrim( $path, '/' );
		}

		return $url;
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
		if ( ! $credentials->has() ) {
			return new WP_Error( 'oauth_credentials_not_exist' );
		}

		$creds = $credentials->get();

		$request_args = array(
			'body' => array(
				'site_id'     => $creds['oauth2_client_id'],
				'site_secret' => $creds['oauth2_client_secret'],
			),
		);

		$response = wp_remote_post( $this->url( self::OAUTH2_SITE_URI ), $request_args );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$raw_body = wp_remote_retrieve_body( $response );

		$response_data = json_decode( $raw_body, true );

		if ( ! $response_data || isset( $response_data['error'] ) ) {
			return new WP_Error( isset( $response_data['error'] ) ? $response_data['error'] : 'failed_to_parse_response' );
		}

		return $response_data;
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
		$fetch_site_fields = $this->fetch_site_fields( $credentials );

		if ( is_wp_error( $fetch_site_fields ) ) {
			return $fetch_site_fields;
		}

		$get_site_fields = $this->get_site_fields();

		foreach ( $get_site_fields as $key => $site_field ) {
			if ( ! array_key_exists( $key, $fetch_site_fields ) || $fetch_site_fields[ $key ] !== $site_field ) {
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
	 * @return array Response data.
	 *
	 * @throws Exception Thrown when the request resulted in an error response,
	 *                   or when credentials are not set.
	 */
	public function unregister_site( Credentials $credentials ) {
		if ( ! $credentials->has() ) {
			throw new Exception( 'oauth_credentials_not_exist' );
		}

		$creds = $credentials->get();

		$response = wp_remote_post(
			$this->url( self::OAUTH2_DELETE_SITE_URI ),
			array(
				'body' => array(
					'site_id'     => $creds['oauth2_client_id'],
					'site_secret' => $creds['oauth2_client_secret'],
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			throw new Exception( $response->get_error_code() );
		}

		$raw_body      = wp_remote_retrieve_body( $response );
		$response_data = json_decode( $raw_body, true );

		if ( ! $response_data || isset( $response_data['error'] ) ) {
			throw new Exception(
				isset( $response_data['error'] ) ? $response_data['error'] : 'failed_to_parse_response'
			);
		}

		return $response_data;
	}

	/**
	 * Synchronizes site fields with the proxy.
	 *
	 * @since 1.5.0
	 *
	 * @param Credentials $credentials Credentials instance.
	 * @param string      $mode        Sync mode.
	 * @return array Response of the wp_remote_post request or NULL if there are no credentials.
	 */
	public function sync_site_fields( Credentials $credentials, $mode = 'async' ) {
		if ( ! $credentials->has() ) {
			return null;
		}

		$creds = $credentials->get();

		$request_args = array(
			'body' => array_merge(
				$this->get_site_fields(),
				array(
					'site_id'     => $creds['oauth2_client_id'],
					'site_secret' => $creds['oauth2_client_secret'],
				)
			),
		);

		if ( 'async' === $mode ) {
			$request_args['timeout']  = 0.01;
			$request_args['blocking'] = false;
		}

		return wp_remote_post( $this->url( self::OAUTH2_SITE_URI ), $request_args );
	}

	/**
	 * Exchanges a site code for client credentials from the proxy.
	 *
	 * @since 1.1.2
	 *
	 * @param string $site_code        Site code identifying the site.
	 * @param string $undelegated_code Undelegated code identifying the undelegated token.
	 * @return array Response data containing site_id and site_secret.
	 *
	 * @throws Exception Thrown when the request resulted in an error response.
	 */
	public function exchange_site_code( $site_code, $undelegated_code ) {
		$response = wp_remote_post(
			$this->url( self::OAUTH2_SITE_URI ),
			array(
				'body' => array(
					'code'      => $undelegated_code,
					'site_code' => $site_code,
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			throw new Exception( $response->get_error_code() );
		}

		$raw_body      = wp_remote_retrieve_body( $response );
		$response_data = json_decode( $raw_body, true );

		if ( ! $response_data || isset( $response_data['error'] ) ) {
			throw new Exception(
				isset( $response_data['error'] ) ? $response_data['error'] : 'failed_to_parse_response'
			);
		}

		if ( ! isset( $response_data['site_id'], $response_data['site_secret'] ) ) {
			throw new Exception( 'oauth_credentials_not_exist' );
		}

		return $response_data;
	}
}
