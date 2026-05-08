<?php
/**
 * OptionsTest
 *
 * @package   Google
 * @copyright 2021 Google LLC
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
class OptionsTest extends TestCase {

	public function test_has() {
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Ensure default is a truthy value.
		add_filter( 'default_option_test_option', '__return_true' );
		delete_option( 'test_option' );
		$this->assertTrue( get_option( 'test_option' ), 'Default option should be truthy when set via filter.' );
		$this->assertFalse( $options->has( 'test_option' ), 'Options::has should be false when only default is set.' );

		// Ensure default is a truthy value.
		add_filter( 'default_option_test_option', '__return_false' );
		update_option( 'test_option', '1' );
		$this->assertTrue( $options->has( 'test_option' ), 'Options::has should be true when option value exists.' );
	}

	public function test_get() {
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		delete_option( 'test_option' );

		$this->assertFalse( $options->get( 'test_option' ), 'Options::get should return false when option not set.' );
		update_option( 'test_option', 'test-value' );

		$this->assertEquals( 'test-value', $options->get( 'test_option' ), 'Options::get should return stored option value.' );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_get() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );
		delete_network_option( null, 'test_option' );
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$this->assertTrue( $context->is_network_mode(), 'Context should report network mode enabled.' );

		$this->assertFalse( $options->get( 'test_option' ), 'Network Options::get should return false when option not set.' );
		update_network_option( null, 'test_option', 'test-value' );

		$this->assertEquals( 'test-value', $options->get( 'test_option' ), 'Network Options::get should return network option value.' );
	}

	public function test_set() {
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->assertFalse( get_option( 'test_option' ), 'Option should not exist before set.' );

		$options->set( 'test_option', 'test-value' );

		$this->assertEquals( 'test-value', get_option( 'test_option' ), 'Option should be updated by Options::set.' );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_set() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$this->assertTrue( $context->is_network_mode(), 'Context should report network mode enabled.' );

		$this->assertFalse( get_network_option( null, 'test_option' ), 'Network option should not exist before set.' );
		$options->set( 'test_option', 'test-value' );

		$this->assertEquals( 'test-value', get_network_option( null, 'test_option' ), 'Network option should be updated by Options::set.' );
	}

	public function test_delete() {
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		update_option( 'test_option', 'test-value' );
		$this->assertEquals( 'test-value', get_option( 'test_option' ), 'Option should be present before delete.' );

		$options->delete( 'test_option' );

		$this->assertFalse( get_option( 'test_option' ), 'Option should be deleted by Options::delete.' );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_delete() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$this->assertTrue( $context->is_network_mode(), 'Context should report network mode enabled.' );

		update_network_option( null, 'test_option', 'test-value' );
		$this->assertEquals( 'test-value', get_network_option( null, 'test_option' ), 'Network option should be present before delete.' );

		$options->delete( 'test_option' );

		$this->assertFalse( get_network_option( null, 'test_option' ), 'Network option should be deleted by Options::delete.' );
	}
}
