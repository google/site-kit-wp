<?php
/**
 * Trait Google\Site_Kit\Tests\Fake_Site_Connection_Trait
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
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
	 * Fakes a Google OAuth site (GCP) connection for testing.
	 *
	 * @since 1.8.1
	 * @since 1.48.0 Returns [ id, secret ] rather than associative array partial.
	 *
	 * @return array Fake site connection credentials including client_id & client_secret.
	 */
	public function fake_site_connection() {
		list( $id, $secret ) = $this->get_fake_site_credentials();

		$this->use_fake_credentials( $id, $secret );

		return array( $id, $secret );
	}

	/**
	 * Fakes a proxy site connection for testing.
	 *
	 * @since 1.8.1
	 * @since 1.48.0 Returns [ id, secret ] rather than associative array partial.
	 *
	 * @return array Fake proxy site connection credentials including site id & site secret.
	 */
	public function fake_proxy_site_connection() {
		list( $id, $secret ) = $this->get_fake_proxy_credentials();

		$this->use_fake_credentials( $id, $secret );

		return array( $id, $secret );
	}

	/**
	 * Fakes an OAuth connection using the given credentials.
	 *
	 * @since 1.48.0
	 *
	 * @param string $id     OAuth client ID.
	 * @param string $secret OAuth client secret.
	 */
	protected function use_fake_credentials( $id, $secret ) {
		add_filter(
			'googlesitekit_oauth_secret',
			function () use ( $id, $secret ) {
				return array(
					'web' => array(
						'client_id'     => $id,
						'client_secret' => $secret,
					),
				);
			}
		);
	}

	/**
	 * Gets a fake site ID and secret for use as proxy credentials.
	 *
	 * @since 1.48.0
	 *
	 * @return string[]
	 */
	public function get_fake_proxy_credentials() {
		return array(
			'12345678.apps.sitekit.withgoogle.com',
			'test-site-secret',
		);
	}

	/**
	 * Gets a fake client ID and secret for use as site credentials.
	 *
	 * @since 1.48.0
	 *
	 * @return string[]
	 */
	public function get_fake_site_credentials() {
		return array(
			'12345678.apps.googleusercontent.com',
			'test-client-secret',
		);
	}
}
