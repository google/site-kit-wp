<?php
/**
 * OAuth_Client_BaseTest.php
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication\Clients
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication\Clients;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client_Base;
use Google\Site_Kit\Core\Authentication\Token;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class OAuth_Client_BaseTest extends TestCase {

	public function test_get_client() {
		$oauth_client = $this->getMockBuilder( OAuth_Client_Base::class )
			->setConstructorArgs( array( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )
			->getMockForAbstractClass();
		$client       = $oauth_client->get_client();

		$this->assertInstanceOf( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client', $client, 'OAuth client should create a Google Site Kit client.' );

		$retry = $client->getConfig( 'retry' );
		$this->assertEquals( 3, $retry['retries'], 'OAuth client should use the default retry count.' );
	}

	public function test_get_required_scopes() {
		$oauth_client = $this->getMockBuilder( OAuth_Client_Base::class )
			->setConstructorArgs( array( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )
			->getMockForAbstractClass();
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/userinfo.profile',
				'https://www.googleapis.com/auth/userinfo.email',
				'openid',
			),
			$oauth_client->get_required_scopes(),
			'OAuth client should return the default required scopes.'
		);
	}

	public function test_get_granted_scopes() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$oauth_client = $this->getMockBuilder( OAuth_Client_Base::class )
			->setConstructorArgs( array( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )
			->getMockForAbstractClass();

		$granted_scopes = array( 'test-scope' );
		update_user_option( $user_id, OAuth_Client_Base::OPTION_AUTH_SCOPES, $granted_scopes );

		$this->assertEquals( $granted_scopes, $oauth_client->get_granted_scopes(), 'OAuth client should return stored granted scopes.' );
	}

	public function test_set_granted_scopes() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$oauth_client = $this->getMockBuilder( OAuth_Client_Base::class )
			->setConstructorArgs( array( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )
			->getMockForAbstractClass();

		// Register a custom list of required scopes for this test.
		add_filter(
			'googlesitekit_auth_scopes',
			function () {
				return array( 'test-scope' );
			}
		);

		$this->assertNotContains( 'test-scope', (array) get_user_option( OAuth_Client_Base::OPTION_AUTH_SCOPES, $user_id ), 'User auth scopes should not contain test scope.' );

		$oauth_client->set_granted_scopes( array( 'test-scope' ) );
		$this->assertContains( 'test-scope', (array) get_user_option( OAuth_Client_Base::OPTION_AUTH_SCOPES, $user_id ), 'User auth scopes should contain the granted scope.' );

		// It ignores any scope that is not required.
		$oauth_client->set_granted_scopes( array( 'test-scope', 'unsupported-scope' ) );
		$this->assertContains( 'test-scope', (array) get_user_option( OAuth_Client_Base::OPTION_AUTH_SCOPES, $user_id ), 'User auth scopes should keep required scopes.' );
		$this->assertNotContains( 'unsupported-scope', (array) get_user_option( OAuth_Client_Base::OPTION_AUTH_SCOPES, $user_id ), 'User auth scopes should ignore unsupported scopes.' );
	}

	public function test_get_token() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$token        = new Token( new User_Options( $context, $user_id ) );
		$oauth_client = $this->getMockBuilder( OAuth_Client_Base::class )
			->setConstructorArgs(
				array(
					$context,
					null,
					null,
					null,
					null,
					null,
					$token,
				)
			)
			->getMockForAbstractClass();

		$token_data = array(
			'access_token' => 'test-access-token',
			'expires_in'   => 3600,
			'created'      => 649724400,
		);
		$token->set( $token_data );
		$this->assertEquals( $token_data, $oauth_client->get_token(), 'OAuth client should return stored token data.' );
	}

	public function test_set_token() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$token        = new Token( new User_Options( $context, $user_id ) );
		$oauth_client = $this->getMockBuilder( OAuth_Client_Base::class )
			->setConstructorArgs(
				array(
					$context,
					null,
					null,
					null,
					null,
					null,
					$token,
				)
			)
			->getMockForAbstractClass();

		$token_data = array(
			'access_token' => 'test-access-token',
			'expires_in'   => 3600,
			'created'      => 649724400,
		);
		$oauth_client->set_token( $token_data );
		$this->assertEquals( $token_data, $token->get(), 'Token storage should contain the OAuth client token data.' );
	}

	public function test_get_error_message_unknown() {
		$oauth_client = $this->getMockBuilder( OAuth_Client_Base::class )
			->setConstructorArgs( array( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )
			->getMockForAbstractClass();

		$this->assertStringContainsString( 'Unknown Error (code: unknown_code)', $oauth_client->get_error_message( 'unknown_code' ), 'Unknown error message should include the error code.' );
		$this->assertStringContainsString( 'Unknown Error (code: )', $oauth_client->get_error_message( '' ), 'Unknown error message should allow empty codes.' );
		$this->assertStringContainsString( 'Unknown Error (code: 123)', $oauth_client->get_error_message( 123 ), 'Unknown error message should include numeric codes.' );
	}

	/**
	 * @dataProvider error_message_provider
	 */
	public function test_get_error_message( $error_code ) {
		$oauth_client = $this->getMockBuilder( OAuth_Client_Base::class )
			->setConstructorArgs( array( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )
			->getMockForAbstractClass();

		$message = $oauth_client->get_error_message( $error_code );

		$this->assertMatchesRegularExpression( '/unable|invalid|failed/i', $message, 'Known error message should describe the failure.' );
		$this->assertStringNotContainsString( 'Unknown Error', $message, 'Known error message should not use the unknown fallback.' );
	}

	public function error_message_provider() {
		return array(
			array( 'oauth_credentials_not_exist' ),
			array( 'refresh_token_not_exist' ),
			array( 'cannot_log_in' ),
			array( 'invalid_grant' ),
			array( 'invalid_code' ),
			array( 'access_token_not_received' ),
		);
	}
}
