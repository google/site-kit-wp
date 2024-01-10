<?php
/**
 * SettingTest
 *
 * @package   Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\MethodSpy;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Storage
 */
class SettingTest extends TestCase {

	/**
	 * @var Context
	 */
	protected $context;

	public function set_up() {
		parent::set_up();
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
	}

	public function test_has() {
		$setting = new FakeSetting( new Options( $this->context ) );
		delete_option( FakeSetting::OPTION );

		$this->assertFalse( $setting->has() );
		update_option( FakeSetting::OPTION, 'test-value' );

		$this->assertTrue( $setting->has() );
	}

	public function test_get() {
		$setting = new FakeSetting( new Options( $this->context ) );
		delete_option( FakeSetting::OPTION );

		$this->assertFalse( $setting->get() );
		update_option( FakeSetting::OPTION, 'test-value' );

		$this->assertEquals( 'test-value', $setting->get() );
	}

	public function test_register() {
		$setting = new FakeSetting( new Options( $this->context ) );
		$setting->set_register_callback(
			function () {
				register_setting(
					FakeSetting::OPTION,
					FakeSetting::OPTION,
					array(
						'default' => 'test-default-value',
					)
				);
			}
		);
		delete_option( FakeSetting::OPTION );
		$this->assertFalse( $setting->get() );

		$setting->register();
		$this->assertEquals( 'test-default-value', $setting->get() );

		update_option( FakeSetting::OPTION, 'test-value' );
		$this->assertEquals( 'test-value', $setting->get() );
		update_option( FakeSetting::OPTION, false );
		$this->assertFalse( $setting->get() );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_get() {
		$setting = new FakeSetting( new Options( $this->context ) );
		delete_network_option( null, FakeSetting::OPTION );
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$this->assertTrue( $this->context->is_network_mode() );

		$this->assertFalse( $setting->get() );
		update_network_option( null, FakeSetting::OPTION, 'test-value' );

		$this->assertEquals( 'test-value', $setting->get() );
	}

	public function test_set() {
		$setting = new FakeSetting( new Options( $this->context ) );
		$this->assertFalse( get_option( FakeSetting::OPTION ) );

		$setting->set( 'test-value' );

		$this->assertEquals( 'test-value', get_option( FakeSetting::OPTION ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_set() {
		$setting = new FakeSetting( new Options( $this->context ) );
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$this->assertTrue( $this->context->is_network_mode() );

		$this->assertFalse( get_network_option( null, FakeSetting::OPTION ) );
		$setting->set( 'test-value' );

		$this->assertEquals( 'test-value', get_network_option( null, FakeSetting::OPTION ) );
	}

	public function test_delete() {
		$setting = new FakeSetting( new Options( $this->context ) );
		update_option( FakeSetting::OPTION, 'test-value' );
		$this->assertEquals( 'test-value', get_option( FakeSetting::OPTION ) );

		$setting->delete();

		$this->assertFalse( get_option( FakeSetting::OPTION ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_delete() {
		$setting = new FakeSetting( new Options( $this->context ) );
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$this->assertTrue( $this->context->is_network_mode() );

		update_network_option( null, FakeSetting::OPTION, 'test-value' );
		$this->assertEquals( 'test-value', get_network_option( null, FakeSetting::OPTION ) );

		$setting->delete();

		$this->assertFalse( get_network_option( null, FakeSetting::OPTION ) );
	}

	public function test_on_change() {
		$setting = new FakeSetting( new Options( $this->context ) );
		$spy     = new MethodSpy();

		$unsubscribe = $setting->on_change( array( $spy, 'on_change' ) );

		$this->assertTrue( empty( $spy->invocations['on_change'] ) );

		add_option( FakeSetting::OPTION, 'test value' );

		$this->assertCount( 1, $spy->invocations['on_change'] );

		// Verify that the old value is false, since the option was just added.
		$this->assertEquals( false, $spy->invocations['on_change'][0][0] );

		// Verify that the new value is 'test value'.
		$this->assertEquals( 'test value', $spy->invocations['on_change'][0][1] );

		update_option( FakeSetting::OPTION, 'new test value' );

		$this->assertCount( 2, $spy->invocations['on_change'] );

		// Verify that the old value is 'test value'.
		$this->assertEquals( 'test value', $spy->invocations['on_change'][1][0] );

		// Verify that the new value is 'new test value'.
		$this->assertEquals( 'new test value', $spy->invocations['on_change'][1][1] );

		$unsubscribe();

		update_option( FakeSetting::OPTION, 'after unsubscribe 1' );
		update_option( FakeSetting::OPTION, 'after unsubscribe 2' );
		update_option( FakeSetting::OPTION, 'after unsubscribe 3' );

		// Verify that the changes are no longer listened to after unsubscribing.
		$this->assertCount( 2, $spy->invocations['on_change'] );
	}
}
