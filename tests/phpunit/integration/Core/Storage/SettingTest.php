<?php
/**
 * SettingTest
 *
 * @package   Google
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 */
class SettingTest extends TestCase {

	/**
	 * @var Context
	 */
	protected $context;

	public function setUp() {
		parent::setUp();
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
		$this->assertTrue( $this->context->is_network_mode() );

		update_network_option( null, FakeSetting::OPTION, 'test-value' );
		$this->assertEquals( 'test-value', get_network_option( null, FakeSetting::OPTION ) );

		$setting->delete();

		$this->assertFalse( get_network_option( null, FakeSetting::OPTION ) );
	}

	public function test_validate() {
		$setting = new FakeSetting( new Options( $this->context ) );

		// Without callback, value should be passed through.
		$this->assertSame( '1234', $setting->validate( '1234' ) );

		$setting->set_validate_callback(
			function( $value ) {
				if ( empty( $value ) ) {
					return new WP_Error( 'empty_value', 'Empty value.' );
				}
				return (int) $value;
			}
		);

		// With callback and valid value.
		$this->assertSame( 1234, $setting->validate( $value ) );

		// With callback and invalid value.
		$this->assertWPError( $setting->validate( '' ), 'Empty value.' );
	}
}
