<?php
/**
 * Beta_MigrationTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Beta_Migration;
use Google\Site_Kit\Tests\TestCase;

class Beta_MigrationTest extends TestCase {

	public function test_register() {
		$migration = new Beta_Migration( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_actions( 'admin_init' );
		remove_all_filters( 'googlesitekit_admin_notices' );
		remove_all_actions( 'wp_ajax_' . Beta_Migration::ACTION_DISMISS );

		$migration->register();

		$this->assertTrue( has_action( 'admin_init' ) );
		$this->assertTrue( has_filter( 'googlesitekit_admin_notices' ) );
		$this->assertTrue( has_action( 'wp_ajax_' . Beta_Migration::ACTION_DISMISS ) );
	}

	public function test_maybe_run_upgrade() {
		$context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options     = new Options( $context );
		$credentials = new Credentials( $options );
		$migration   = new Beta_Migration( $context );

		// Upgrade will update the DB version if run.
		$this->delete_db_version();
		$this->delete_credentials();

		$migration->maybe_run_upgrade();

		$this->assertEquals( Beta_Migration::DB_VERSION, $options->get( 'googlesitekit_db_version' ) );
		$this->assertFalse( $credentials->has() );

		// The upgrade will delete old GCP credentials if present.
		$this->delete_db_version();
		$this->set_gcp_credentials();
		$this->assertTrue( $credentials->has() );

		$migration->maybe_run_upgrade();

		$this->assertFalse( $credentials->has() );
		$this->assertEquals( Beta_Migration::DB_VERSION, $options->get( 'googlesitekit_db_version' ) );

		// The upgrade will not delete proxy credentials if present.
		$this->delete_db_version();
		$this->set_proxy_credentials();
		$this->assertTrue( $credentials->has() );

		$migration->maybe_run_upgrade();

		$this->assertTrue( $credentials->has() );
		$this->assertEquals( Beta_Migration::DB_VERSION, $options->get( 'googlesitekit_db_version' ) );

		// The upgrade will not run if the DB version is greater than or equal to DB_VERSION.
		$options->set( 'googlesitekit_db_version', Beta_Migration::DB_VERSION );
		// Set GCP credentials which would be deleted if the upgrade were to run.
		$this->set_gcp_credentials();
		$this->assertTrue( $credentials->has() );
		$credentials_before = $credentials->get();

		$migration->maybe_run_upgrade();

		$this->assertTrue( $credentials->has() );
		// Credentials are the same as before.
		$this->assertEquals( $credentials_before, $credentials->get() );
		$this->assertEquals( Beta_Migration::DB_VERSION, $options->get( 'googlesitekit_db_version' ) );
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
