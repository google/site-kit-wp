<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_1_3_0Test
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_1_3_0;
use Google\Site_Kit\Core\Util\Tracking;
use Google\Site_Kit\Tests\TestCase;

class Migration_1_3_0Test extends TestCase {
	/**
	 * @var Context
	 */
	protected $context;

	public function setUp() {
		parent::setUp();
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->delete_db_version();
	}

	public function test_register() {
		$migration = new Migration_1_3_0( $this->context );
		remove_all_actions( 'admin_init' );

		$migration->register();

		$this->assertTrue( has_action( 'admin_init' ) );
	}

	public function test_migrate_without_tracking_enabled() {
		$migration = new Migration_1_3_0( $this->context );
		remove_all_actions( 'admin_init' );
		$migration->register();

		$this->disable_global_tracking();
		$this->create_user_without_access_token();
		$this->assertEmpty( $this->get_opted_in_users() );

		$migration->migrate();

		$this->assertEmpty( $this->get_opted_in_users() );
		$this->assertEquals( Migration_1_3_0::DB_VERSION, $this->get_db_version() );
	}

	public function test_migrate_with_tracking_enabled_and_no_authenticated_users() {
		$migration = new Migration_1_3_0( $this->context );
		remove_all_actions( 'admin_init' );
		$migration->register();

		$this->enable_global_tracking();
		$this->create_user_without_access_token();
		$this->assertEmpty( $this->get_users_with_access_tokens() );

		$migration->migrate();

		$this->assertEmpty( $this->get_opted_in_users() );
		$this->assertEquals( Migration_1_3_0::DB_VERSION, $this->get_db_version() );
	}

	public function test_migrate_with_tracking_enabled_and_one_authenticated_user() {
		$migration = new Migration_1_3_0( $this->context );
		remove_all_actions( 'admin_init' );
		$migration->register();

		$this->enable_global_tracking();
		$user_id = $this->create_user_with_access_token();
		$this->assertCount( 1, $this->get_users_with_access_tokens() );

		$migration->migrate();

		$opted_in_users = $this->get_opted_in_users();
		$this->assertCount( 1, $opted_in_users );
		$this->assertEquals( $user_id, $opted_in_users[0]->ID );
		$this->assertEquals( Migration_1_3_0::DB_VERSION, $this->get_db_version() );
	}

	public function test_migrate_with_tracking_enabled_and_multiple_authenticated_users() {
		$migration = new Migration_1_3_0( $this->context );
		remove_all_actions( 'admin_init' );
		$migration->register();

		$this->enable_global_tracking();
		$this->create_user_with_access_token();
		$this->create_user_with_access_token();
		$this->assertCount( 2, $this->get_users_with_access_tokens() );

		$migration->migrate();

		$this->assertEmpty( $this->get_opted_in_users() );
		$this->assertEquals( Migration_1_3_0::DB_VERSION, $this->get_db_version() );
	}

	private function get_opted_in_users() {
		global $wpdb;

		return get_users(
			array(
				'meta_key'   => $wpdb->get_blog_prefix() . Tracking::OPTION,
				'meta_value' => '1',
			)
		);
	}

	private function get_users_with_access_tokens() {
		global $wpdb;

		return get_users(
			array(
				'meta_key'     => $wpdb->get_blog_prefix() . OAuth_Client::OPTION_ACCESS_TOKEN,
				'meta_compare' => 'EXISTS',
			)
		);
	}

	private function create_user_without_access_token() {
		return $this->factory()->user->create();
	}

	private function create_user_with_access_token() {
		$user_id = $this->factory()->user->create();
		update_user_option( $user_id, OAuth_Client::OPTION_ACCESS_TOKEN, "test-access-token-$user_id" );

		return $user_id;
	}

	private function enable_global_tracking() {
		( new Options( $this->context ) )->set( Tracking::OPTION, 1 );
	}

	private function disable_global_tracking() {
		( new Options( $this->context ) )->set( Tracking::OPTION, 0 );
	}

	private function get_db_version() {
		return ( new Options( $this->context ) )->get( 'googlesitekit_db_version' );
	}

	private function delete_db_version() {
		( new Options( $this->context ) )->delete( 'googlesitekit_db_version' );
	}
}
