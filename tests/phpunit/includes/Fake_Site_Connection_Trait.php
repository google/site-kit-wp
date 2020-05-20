<?php
/**
 * Trait Google\Site_Kit\Tests\Fake_Site_Connection_Trait
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Trait for getting fake site connection credentials.
 *
 * @since 1.8.1
 * @access private
 * @ignore
 */
trait Fake_Site_Connection_Trait {

	/**
	 * Creates fake Google OAuth site connection credentials for testing.
	 *
	 * @since 1.8.1
	 *
	 * @return array Fake site connection credentials including client_id & client_secret.
	 */
	public function fake_site_connection() {
		$fake_credentials = array(
			'client_id'     => '12345678.apps.googleusercontent.com',
			'client_secret' => 'test-client-secret',
		);

		add_filter(
			'googlesitekit_oauth_secret',
			function () use ( $fake_credentials ) {
				return array(
					'web' => $fake_credentials,
				);
			}
		);

		return $fake_credentials;
	}

	/**
	 * Creates fake proxy site connection credentials for testing.
	 *
	 * @since 1.8.1
	 *
	 * @return array Fake proxy site connection credentials including client_id & client_secret.
	 */
	public function fake_proxy_site_connection() {
		$fake_proxy_credentials = array(
			'client_id'     => '12345678.apps.sitekit.withgoogle.com',
			'client_secret' => 'test-site-secret',
		);

		add_filter(
			'googlesitekit_oauth_secret',
			function () use ( $fake_proxy_credentials ) {
				return array(
					'web' => $fake_proxy_credentials,
				);
			}
		);

		return $fake_proxy_credentials;
	}
}
