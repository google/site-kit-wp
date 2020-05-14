<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Google_Proxy
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Context;
use Exception;

/**
 * Class for authentication service.
 *
 * @since 1.1.2
 * @access private
 * @ignore
 */
class Google_Proxy {

	const BASE_URL          = 'https://sitekit.withgoogle.com';
	const OAUTH2_SITE_URI   = '/o/oauth2/site/';
	const OAUTH2_REVOKE_URI = '/o/oauth2/revoke/';
	const OAUTH2_TOKEN_URI  = '/o/oauth2/token/';
	const OAUTH2_AUTH_URI   = '/o/oauth2/auth/';
	const SETUP_URI         = '/site-management/setup/';
	const PERMISSIONS_URI   = '/site-management/permissions/';
	const ACTION_SETUP      = 'googlesitekit_proxy_setup';

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
	 * @return array
	 */
	public function get_site_fields() {
		$home_url_no_scheme = str_replace( array( 'http://', 'https://' ), '', home_url() );

		return array(
			'name'                   => wp_specialchars_decode( get_bloginfo( 'name' ) ),
			'url'                    => home_url(),
			'redirect_uri'           => add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ),
			'action_uri'             => admin_url( 'index.php' ),
			'return_uri'             => $this->context->admin_url( 'splash' ),
			// TODO: Remove admin_root once proxy is updated.
			'admin_root'             => str_replace( array( 'http://', 'https://', $home_url_no_scheme ), '', admin_url() ),
			'analytics_redirect_uri' => add_query_arg( 'gatoscallback', 1, admin_url( 'index.php' ) ),
		);
	}

	/**
	 * Synchronizes site fields with the proxy.
	 *
	 * @since 1.5.0
	 *
	 * @param Credentials $credentials Credentials instance.
	 */
	public function sync_site_fields( Credentials $credentials ) {
		if ( ! $credentials->has() ) {
			return;
		}

		$creds = $credentials->get();

		wp_remote_post(
			$this->url( self::OAUTH2_SITE_URI ),
			array(
				'body'     => array_merge(
					$this->get_site_fields(),
					array(
						'nonce'       => wp_create_nonce( self::ACTION_SETUP ),
						'site_id'     => $creds['oauth2_client_id'],
						'site_secret' => $creds['oauth2_client_secret'],
					)
				),
				/** Don't block the process from finishing waiting for a response. @see \spawn_cron(). */
				'timeout'  => 0.01,
				'blocking' => false,
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
