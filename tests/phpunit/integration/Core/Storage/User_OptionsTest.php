<?php
/**
 * User_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 */
class User_OptionsTest extends TestCase {

	public function test_get() {
		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new User_Options( $context, $user_id );
		$this->assertFalse( $context->is_network_mode() );
		$this->assertFalse( $options->get( 'test-key' ) );

		update_user_option( $user_id, 'test-key', 'test-value' );

		$this->assertEquals( 'test-value', $options->get( 'test-key' ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_get() {
		$this->network_activate_site_kit();
		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new User_Options( $context, $user_id );
		$this->assertTrue( $context->is_network_mode() );
		$this->assertFalse( $options->get( 'test-key' ) );

		update_user_meta( $user_id, 'test-key', 'test-value' );

		$this->assertEquals( 'test-value', $options->get( 'test-key' ) );
	}

	public function test_set() {
		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new User_Options( $context, $user_id );
		$this->assertFalse( $context->is_network_mode() );
		$this->assertFalse( get_user_option( 'test-key', $user_id ) );

		$this->assertTrue( $options->set( 'test-key', 'test-value' ) );

		$this->assertEquals( 'test-value', get_user_option( 'test-key', $user_id ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_set() {
		$this->network_activate_site_kit();
		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new User_Options( $context, $user_id );
		$this->assertTrue( $context->is_network_mode() );
		$this->assertFalse( metadata_exists( 'user', $user_id, 'test-key' ) );

		$this->assertTrue( $options->set( 'test-key', 'test-value' ) );

		$this->assertEquals( 'test-value', get_user_meta( $user_id, 'test-key', true ) );
	}

	public function test_delete() {
		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new User_Options( $context, $user_id );
		$this->assertFalse( $context->is_network_mode() );
		update_user_option( $user_id, 'test-key', 'test-value' );
		$this->assertEquals( 'test-value', get_user_option( 'test-key', $user_id ) );

		$this->assertTrue( $options->delete( 'test-key' ) );

		$this->assertFalse( get_user_option( 'test-key', $user_id ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_delete() {
		$this->network_activate_site_kit();
		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new User_Options( $context, $user_id );
		$this->assertTrue( $context->is_network_mode() );
		update_user_meta( $user_id, 'test-key', 'test-value' );
		$this->assertEquals( 'test-value', get_user_meta( $user_id, 'test-key', true ) );

		$this->assertTrue( $options->delete( 'test-key' ) );

		$this->assertFalse( metadata_exists( 'user', $user_id, 'test-key' ) );
	}

	public function test_switch_user() {
		$user_id_a = $this->factory()->user->create();
		$user_id_b = $this->factory()->user->create();
		update_user_option( $user_id_a, 'test-key', 'test-value-a' );
		update_user_option( $user_id_b, 'test-key', 'test-value-b' );

		// User Options will use the current user if not passed explicitly.
		wp_set_current_user( $user_id_a );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new User_Options( $context );
		$this->assertFalse( $context->is_network_mode() );

		$this->assertEquals( 'test-value-a', $options->get( 'test-key' ) );

		$options->switch_user( $user_id_b );

		$this->assertEquals( 'test-value-b', $options->get( 'test-key' ) );
	}

	protected function network_activate_site_kit() {
		add_filter(
			'pre_site_option_active_sitewide_plugins',
			function () {
				return array( GOOGLESITEKIT_PLUGIN_BASENAME => true );
			}
		);
	}
}
