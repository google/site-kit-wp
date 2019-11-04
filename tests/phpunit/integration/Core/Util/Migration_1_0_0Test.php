<?php
/**
 * \Google\Site_Kit\Core\Util\Migration_1_0_0Test
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_1_0_0;
use Google\Site_Kit\Tests\TestCase;

class Migration_1_0_0Test extends TestCase {

	public function test_register() {
		$migration = new Migration_1_0_0( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_actions( 'admin_init' );

		$migration->register();

		$this->assertTrue( has_action( 'admin_init' ) );
	}

	public function test_migrate() {
		$context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options     = new Options( $context );
		$credentials = new Credentials( $options );
		$migration   = new Migration_1_0_0( $context );

		// Upgrade will update the DB version if run.
		$this->delete_db_version();

		$migration->migrate();

		$this->assertEquals( Migration_1_0_0::DB_VERSION, $this->get_db_version() );

		// The upgrade will NOT delete old GCP credentials if present.
		$this->delete_db_version();
		$this->set_gcp_credentials();
		$this->assertTrue( $credentials->has() );

		$migration->migrate();

		$this->assertTrue( $credentials->has() );
		$this->assertEquals( Migration_1_0_0::DB_VERSION, $this->get_db_version() );

		// The upgrade WILL delete proxy credentials if present.
		$this->delete_db_version();
		$this->set_proxy_credentials();
		$this->assertTrue( $credentials->has() );

		$migration->migrate();

		$this->assertFalse( $credentials->has() );
		$this->assertEquals( Migration_1_0_0::DB_VERSION, $this->get_db_version() );

		// The upgrade will not disconnect any user if GCP credentials are present.
		$this->delete_db_version();
		$this->set_gcp_credentials();

		$users_with_tokens = array(
			$this->create_user_with_access_token(),
			$this->create_user_with_access_token(),
			$this->create_user_with_access_token(),
		);
		$users_without     = array(
			$this->factory()->user->create(),
			$this->factory()->user->create(),
			$this->factory()->user->create(),
		);

		$migration->migrate();

		foreach ( $users_with_tokens as $user_with_token ) {
			$this->assertUserHasAccessToken( $user_with_token );
		}

		// The upgrade will disconnect any user with an auth token if proxy credentials are present.
		$this->delete_db_version();
		$this->set_proxy_credentials();

		$migration->migrate();

		foreach ( $users_with_tokens as $user_who_had_token ) {
			$this->assertUserNotHasAccessToken( $user_who_had_token );
		}
		foreach ( $users_without as $user_without ) {
			$this->assertUserNotHasAccessToken( $user_without );
		}
	}

	private function assertUserHasAccessToken( $user_id ) {
		$this->assertNotEmpty( get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN, $user_id ) );
	}

	private function assertUserNotHasAccessToken( $user_id ) {
		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN, $user_id ) );
	}

	private function create_user_with_access_token() {
		$user_id = $this->factory()->user->create();
		update_user_option( $user_id, OAuth_Client::OPTION_ACCESS_TOKEN, "test-access-token-$user_id" );

		return $user_id;
	}

	private function get_db_version() {
		return ( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )->get( 'googlesitekit_db_version' );
	}

	private function delete_db_version() {
		( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )->delete( 'googlesitekit_db_version' );
	}

	private function delete_credentials() {
		( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )->delete( Credentials::OPTION );
	}

	private function set_gcp_credentials() {
		( new Credentials( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) ) )->set( array(
			'oauth2_client_id'     => 'test-client-id.apps.googleusercontent.com',
			'oauth2_client_secret' => 'test-client-secret',
		) );
	}

	private function set_proxy_credentials() {
		( new Credentials( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) ) )->set( array(
			'oauth2_client_id'     => 'test-site-id.apps.sitekit.withgoogle.com',
			'oauth2_client_secret' => 'test-site-secret',
		) );
	}
}
