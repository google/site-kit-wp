<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Google_Proxy.php
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Context;

/**
 * Class for authentication service.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Google_Proxy {

	const BASE_URL       = 'https://sitekit.withgoogle.com';
	const OAUTH_SITE_URI = '/o/oauth/site/';
	const ACTION_SETUP   = 'googlesitekit_proxy_setup';

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Google_Proxy constructor.
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action(
			'admin_action_' . self::ACTION_SETUP,
			function () {
				$this->verify_proxy_setup_nonce();
			},
			-1
		);
	}

	/**
	 * Gets a URL to the proxy with optional path.
	 *
	 * @since n.e.x.t
	 * @static
	 *
	 * @param string $path Optional path to append to the base URL.
	 *
	 * @return string Complete proxy URL.
	 */
	public static function url( $path = '' ) {
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
	 * Verifies the nonce for processing proxy setup.
	 *
	 * @since n.e.x.t
	 */
	private function verify_proxy_setup_nonce() {
		$nonce = $this->context->input()->filter( INPUT_GET, 'nonce', FILTER_SANITIZE_STRING );

		if ( ! wp_verify_nonce( $nonce, self::ACTION_SETUP ) ) {
			wp_die( esc_html__( 'Invalid nonce.', 'google-site-kit' ), 400 );
		}
	}
}
