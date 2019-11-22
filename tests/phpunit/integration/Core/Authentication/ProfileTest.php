<?php
/**
 * ProfileTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\FakeHttpClient;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Response;
use Google\Site_Kit_Dependencies\GuzzleHttp\Stream\Stream;

/**
 * @group Authentication
 */
class ProfileTest extends TestCase {

	public function test_get() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$client       = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$profile      = new Profile( $user_options, $client );

		// Profile data is always an array with email, photo, and a timestamp otherwise false.
		$this->assertFalse( $profile->get() );

		$valid_profile_data = array(
			'email'     => 'user@foo.com',
			'photo'     => 'https://example.com/me.jpg',
			'timestamp' => current_time( 'timestamp' ) - DAY_IN_SECONDS,
		);
		$user_options->set( Profile::OPTION, $valid_profile_data );

		$this->assertEquals( $valid_profile_data, $profile->get() );

		// If there is no data, or the timestamp is older than 1 week it attempts to fetch new data.
		$stale_profile_data = $valid_profile_data;
		$stale_profile_data['timestamp'] = current_time( 'timestamp' ) - WEEK_IN_SECONDS - MINUTE_IN_SECONDS;
		update_user_option( $user_id, Profile::OPTION, $stale_profile_data );

		// Stub the response to return fresh profile data from the API.
		$fake_http = new FakeHttpClient();
		$fake_http->set_request_handler( function () {
			return new Response(
				200,
				array(),
				Stream::factory(json_encode(array(
					// ['emailAddresses'][0]['value']
					'emailAddresses' => array(
						array( 'value' => 'fresh@foo.com' ),
					),
					// ['photos'][0]['url']
					'photos' => array(
						array( 'url' => 'https://example.com/fresh.jpg' ),
					),
				)))
			);
		});
		$client->get_client()->setHttpClient( $fake_http );

		$fresh_profile_data = $profile->get();

		$this->assertEquals( 'fresh@foo.com', $fresh_profile_data['email'] );
		$this->assertEquals( 'https://example.com/fresh.jpg', $fresh_profile_data['photo'] );
		$this->assertGreaterThan(
			$valid_profile_data['timestamp'],
			$fresh_profile_data['timestamp']
		);
	}

	public function test_has() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$client       = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$profile      = new Profile( $user_options, $client );

		// has() requires an array with 'email' and 'photo'
		$this->assertFalse( $profile->has() );
		$user_options->set( Profile::OPTION, array() );
		$this->assertFalse( $profile->has() );
		$user_options->set( Profile::OPTION, array( 'email' => '' ) );
		$this->assertFalse( $profile->has() );
		$user_options->set( Profile::OPTION, array( 'email' => 'user@example.com' ) );
		$this->assertFalse( $profile->has() );
		$user_options->set( Profile::OPTION, array( 'email' => 'user@example.com', 'photo' => '' ) );
		$this->assertFalse( $profile->has() );
		$user_options->set( Profile::OPTION, array( 'email' => '', 'photo' => '' ) );
		$this->assertFalse( $profile->has() );
		$user_options->set( Profile::OPTION, array( 'email' => '', 'photo' => 'test-photo.jpg' ) );
		$this->assertFalse( $profile->has() );
		$user_options->set( Profile::OPTION, array( 'email' => 'user@example.com', 'photo' => 'test-photo.jpg' ) );
		$this->assertFalse( $profile->has() );
		$user_options->set( Profile::OPTION, array( 'email' => 'user@example.com', 'photo' => 'test-photo.jpg', 'timestamp' => current_time( 'timestamp' ) ) );
		$this->assertTrue( $profile->has() );
	}

	public function test_set() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$client       = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$profile      = new Profile( $user_options, $client );

		$this->assertFalse( $user_options->get( Profile::OPTION ) );

		$profile->set( array( 'email' => 'user@example.com', 'photo' => 'test-photo.jpg' ) );

		$this->assertEquals(
			array( 'email' => 'user@example.com', 'photo' => 'test-photo.jpg' ),
			$user_options->get( Profile::OPTION )
		);
	}
}
