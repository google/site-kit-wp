<?php
/**
 * ProfileTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// No longer need to disable assertion message checks as messages have been added

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
		$profile      = new Profile( $user_options );

		$this->assertFalse( $profile->get(), 'Profile should not exist before being set' );

		// get() is a simple wrapper for fetching the option value.
		$user_options->set( Profile::OPTION, 'test-profile' );

		$this->assertEquals( 'test-profile', $profile->get(), 'Profile should return the set value' );
	}

	public function test_has() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$client       = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$profile      = new Profile( $user_options, $client );

		// has() requires an array with 'email' and 'photo'
		$this->assertFalse( $profile->has(), 'Profile should not exist when not set' );
		$user_options->set( Profile::OPTION, array() );
		$this->assertFalse( $profile->has(), 'Profile should not exist with empty array' );
		$user_options->set( Profile::OPTION, array( 'email' => '' ) );
		$this->assertFalse( $profile->has(), 'Profile should not exist with empty email and no photo' );
		$user_options->set( Profile::OPTION, array( 'email' => 'user@example.com' ) );
		$this->assertFalse( $profile->has(), 'Profile should not exist with email but no photo' );
		$user_options->set(
			Profile::OPTION,
			array(
				'email' => 'user@example.com',
				'photo' => '',
			)
		);
		$this->assertFalse( $profile->has(), 'Profile should not exist with email but empty photo' );
		$user_options->set(
			Profile::OPTION,
			array(
				'email' => '',
				'photo' => '',
			)
		);
		$this->assertFalse( $profile->has(), 'Profile should not exist with empty email and empty photo' );
		$user_options->set(
			Profile::OPTION,
			array(
				'email' => '',
				'photo' => 'test-photo.jpg',
			)
		);
		$this->assertFalse( $profile->has(), 'Profile should not exist with empty email but valid photo' );

		$user_options->set(
			Profile::OPTION,
			array(
				'email' => 'user@example.com',
				'photo' => 'test-photo.jpg',
			)
		);
		$this->assertTrue( $profile->has(), 'Profile should exist with valid email and photo' );
	}

	public function test_set() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$profile      = new Profile( $user_options );

		$this->assertFalse( $user_options->get( Profile::OPTION ), 'Profile option should not exist initially' );

		$profile->set(
			array(
				'email' => 'user@example.com',
				'photo' => 'test-photo.jpg',
			)
		);

		$this->assertEquals(
			array(
				'email' => 'user@example.com',
				'photo' => 'test-photo.jpg',
			),
			$user_options->get( Profile::OPTION ),
			'Profile should store email and photo correctly'
		);
	}
}
