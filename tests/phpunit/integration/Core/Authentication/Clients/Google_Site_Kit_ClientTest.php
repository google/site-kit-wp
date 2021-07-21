<?php
/**
 * Google_Site_Kit_ClientTest.php
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication\Clients
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication\Clients;

use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Tests\TestCase;

class Google_Site_Kit_ClientTest extends TestCase {

	/**
	 * @dataProvider data_getQuotaUser
	 *
	 * @param string $homeurl Home URL.
	 * @param string $user_login User login.
	 * @param string $expected Expected URL.
	 */
	public function test_getQuotaUser( $homeurl, $user_login, $expected ) {
		if ( ! empty( $user_login ) ) {
			$user_id = $this->factory()->user->create(
				array(
					'user_login' => $user_login,
				)
			);

			wp_set_current_user( $user_id );
		} else {
			wp_set_current_user( 0 );
		}

		remove_all_filters( 'home_url' );
		add_filter(
			'home_url',
			function() use ( $homeurl ) {
				return $homeurl;
			}
		);

		$this->assertEquals( $expected, Google_Site_Kit_Client::getQuotaUser() );
	}

	public function data_getQuotaUser() {
		return array(
			'basic home url'                      => array(
				'https://example.com',
				'user111',
				'https://user111@example.com',
			),
			'home url with port and subdirectory' => array(
				'https://example.com:8080/subdirectory',
				'testuser',
				'https://testuser@example.com:8080/subdirectory',
			),
			'without user login'                  => array(
				'http://example.com',
				'',
				'http://example.com',
			),
		);
	}

}
