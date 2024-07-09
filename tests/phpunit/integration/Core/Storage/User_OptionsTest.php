<?php
/**
 * User_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Core\Storage\User_Aware_Interface_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 */
class User_OptionsTest extends TestCase {

	use User_Aware_Interface_ContractTests;

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

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

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

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

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

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new User_Options( $context, $user_id );
		$this->assertTrue( $context->is_network_mode() );
		update_user_meta( $user_id, 'test-key', 'test-value' );
		$this->assertEquals( 'test-value', get_user_meta( $user_id, 'test-key', true ) );

		$this->assertTrue( $options->delete( 'test-key' ) );

		$this->assertFalse( metadata_exists( 'user', $user_id, 'test-key' ) );
	}

	protected function create_user_aware_instance() {
		$user_id      = $this->factory()->user->create();
		$user_options = new User_Options(
			new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
			$user_id
		);

		return array( $user_options, $user_id );
	}
}
