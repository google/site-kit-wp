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
use Google\Site_Kit\Tests\TestCase;

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

		$this->assertFalse( $profile->get() );

		// get() is a simple wrapper for fetching the option value.
		$user_options->set( Profile::OPTION, 'test-profile' );

		$this->assertEquals( 'test-profile', $profile->get() );
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
