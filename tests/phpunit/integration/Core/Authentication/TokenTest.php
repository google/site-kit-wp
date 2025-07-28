<?php
/**
 * TokenTest
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
use Google\Site_Kit\Core\Authentication\Token;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Encrypted_User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class TokenTest extends TestCase {

	private $user_options;
	private $encrypted_user_options;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->user_options           = new User_Options( $context, $user_id );
		$this->encrypted_user_options = new Encrypted_User_Options( $this->user_options );
	}

	public function test_has() {
		$token = new Token( $this->user_options );

		$this->assertFalse( $token->has(), 'Token should not exist before being set' );
		$this->encrypted_user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'a1b2c3d4e5' );
		$this->assertTrue( $token->has(), 'Token should exist after access token is set' );
	}

	public function test_get() {
		$token = new Token( $this->user_options );

		// Test default.
		$this->assertEquals( array(), $token->get(), 'Token should return empty array when no token exists' );

		// Test only access token set.
		$this->encrypted_user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'a1b2c3d4e5' );
		$this->assertEquals(
			array(
				'access_token' => 'a1b2c3d4e5',
				'expires_in'   => 0,
				'created'      => 0,
			),
			$token->get(),
			'Token should return access token with default values for expires_in and created when only access token is set'
		);

		// Test full access token data (except refresh token) set.
		$this->encrypted_user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'a1b2c3d4e5f6' );
		$this->user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, 3600 );
		$this->user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, 649724400 );
		$this->assertEquals(
			array(
				'access_token' => 'a1b2c3d4e5f6',
				'expires_in'   => 3600,
				'created'      => 649724400,
			),
			$token->get(),
			'Token should return full token data without refresh token when all access token fields are set'
		);

		// Test full access token data (including refresh token) set.
		$this->encrypted_user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'a1b2c3d4e5f6g7' );
		$this->user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, 3600 );
		$this->user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, 649724400 );
		$this->encrypted_user_options->set( OAuth_Client::OPTION_REFRESH_TOKEN, 'h8i9j0' );
		$this->assertEquals(
			array(
				'access_token'  => 'a1b2c3d4e5f6g7',
				'expires_in'    => 3600,
				'created'       => 649724400,
				'refresh_token' => 'h8i9j0',
			),
			$token->get(),
			'Token should return complete token data including refresh token when all token fields are set'
		);
	}

	public function test_set() {
		$token = new Token( $this->user_options );

		// Cannot set empty token data.
		$this->assertFalse( $token->set( array() ), 'Should not be able to set empty token data' );

		// Cannot set token data without access token.
		$this->assertFalse( $token->set( array( 'refresh_token' => 'h8i9j0' ) ), 'Should not be able to set token with only refresh_token' );
		$this->assertFalse( $token->set( array( 'expires_in' => 3600 ) ), 'Should not be able to set token with only expires_in' );

		// Setting only access token also sets reasonable defaults for created and expires_in.
		$created_before = time();
		$this->assertTrue( $token->set( array( 'access_token' => 'a1b2c3d4e5' ) ), 'Should be able to set token with only access_token' );
		$created_at = $this->user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED );
		$this->assertGreaterThanOrEqual( $created_before, $created_at, 'Created timestamp should be after test started' );
		$this->assertLessThanOrEqual( time(), $created_at, 'Created timestamp should be before or equal to current time' );
		$this->assertEquals( 3600, $this->user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN ), 'Default expires_in should be 3600 seconds' );
		$this->assertEquals( 'a1b2c3d4e5', $this->encrypted_user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN ), 'Access token should be stored correctly' );

		// Set full token data.
		$this->assertTrue(
			$token->set(
				array(
					'access_token'  => 'a1b2c3d4e5f6',
					'expires_in'    => 3600,
					'created'       => 649724400,
					'refresh_token' => 'h8i9j0',
				)
			),
			'Should be able to set full token data'
		);
		$this->assertEquals( 'a1b2c3d4e5f6', $this->encrypted_user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN ), 'Access token should be stored correctly' );
		$this->assertEquals( 3600, $this->user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN ), 'Expires in should be stored correctly' );
		$this->assertEquals( 649724400, $this->user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED ), 'Created timestamp should be stored correctly' );
		$this->assertEquals( 'h8i9j0', $this->encrypted_user_options->get( OAuth_Client::OPTION_REFRESH_TOKEN ), 'Refresh token should be stored correctly' );
	}

	public function test_delete() {
		$token = new Token( $this->user_options );

		// Deleting nothing silently succeeds.
		$this->assertTrue( $token->delete(), 'Should be able to delete token even when none exists' );

		$token->set(
			array(
				'access_token'  => 'a1b2c3d4e5f6',
				'expires_in'    => 3600,
				'created'       => 649724400,
				'refresh_token' => 'h8i9j0',
			)
		);
		$this->assertTrue( $token->delete(), 'Should be able to delete existing token' );
		$this->assertEquals( false, $this->encrypted_user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN ), 'Access token should be removed after deletion' );
		$this->assertEquals( false, $this->user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN ), 'Expires in should be removed after deletion' );
		$this->assertEquals( false, $this->user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED ), 'Created timestamp should be removed after deletion' );
		$this->assertEquals( false, $this->encrypted_user_options->get( OAuth_Client::OPTION_REFRESH_TOKEN ), 'Refresh token should be removed after deletion' );
	}
}
