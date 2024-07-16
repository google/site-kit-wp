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

	private static function force_home_url( $url ) {
		remove_all_filters( 'home_url' );
		add_filter(
			'home_url',
			function () use ( $url ) {
				return $url;
			}
		);
	}

	public function test_getQuotaUser__basic_url() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		self::force_home_url( 'https://example.com' );

		$this->assertEquals( "https://{$user_id}@example.com", Google_Site_Kit_Client::getQuotaUser() );
	}

	public function test_getQuotaUser__port_is_ignored() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		self::force_home_url( 'https://example.org:9000' );

		$this->assertEquals( "https://{$user_id}@example.org", Google_Site_Kit_Client::getQuotaUser() );
	}

	public function test_getQuotaUser__no_user() {
		wp_set_current_user( 0 );
		self::force_home_url( 'https://example.com' );

		$this->assertEquals( 'https://0@example.com', Google_Site_Kit_Client::getQuotaUser() );
	}

	public function test_getQuotaUser__subdirectory_url() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		self::force_home_url( 'http://example.com/subdirectory' );

		$this->assertEquals( "http://{$user_id}@example.com/subdirectory", Google_Site_Kit_Client::getQuotaUser() );
	}
}
