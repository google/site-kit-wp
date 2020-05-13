<?php
/**
 * Trait Google\Site_Kit\Tests\Authentication_Trait
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Trait for getting fake authentication credentials.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Authentication_Trait {

	/**
	 * Creates fake Google authentication credentials for testing.
	 *
	 * @since n.e.x.t
	 * 
	 * @return array Fake authentication details including client_id & client_secret.
	 */
	public function fake_authentication() {
		$fake_auth = array(
			'client_id'     => '12345678.apps.googleusercontent.com',
			'client_secret' => 'test-client-secret',
		);

		add_filter(
			'googlesitekit_oauth_secret',
			function () use ( $fake_auth ) {
				return array(
					'web' => $fake_auth,
				);
			}
		);

		return $fake_auth;
	}

	/**
	 * Creates fake proxy authentication credentials for testing.
	 *
	 * @since n.e.x.t
	 * 
	 * @return array Fake proxy authentication details including client_id & client_secret.
	 */
	public function fake_proxy_authentication() {
		$fake_proxy_auth = array(
			'client_id'     => '12345678.apps.sitekit.withgoogle.com',
			'client_secret' => 'test-client-secret',
		);

		add_filter(
			'googlesitekit_oauth_secret',
			function () use ( $fake_proxy_auth ) {
				return array(
					'web' => $fake_proxy_auth,
				);
			}
		);

		return $fake_proxy_auth;
	}
}
