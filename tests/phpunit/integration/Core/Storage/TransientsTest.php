<?php
/**
 * TransientsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 */
class TransientsTest extends TestCase {

	public function test_get() {
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$transients = new Transients( $context );
		$this->assertFalse( $context->is_network_mode() );
		set_transient( 'test-transient', 'test-value' );

		$this->assertEquals( 'test-value', $transients->get( 'test-transient' ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_get() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$transients = new Transients( $context );
		$this->assertTrue( $context->is_network_mode() );
		set_site_transient( 'test-transient', 'test-value' );

		$this->assertEquals( 'test-value', $transients->get( 'test-transient' ) );
	}

	public function test_set() {
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$transients = new Transients( $context );
		$this->assertFalse( $context->is_network_mode() );
		$this->assertFalse( get_transient( 'test-transient' ) );

		$transients->set( 'test-transient', 'test-value' );

		$this->assertEquals( 'test-value', get_transient( 'test-transient' ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_set() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$transients = new Transients( $context );
		$this->assertTrue( $context->is_network_mode() );
		$this->assertFalse( get_site_transient( 'test-transient' ) );

		$transients->set( 'test-transient', 'test-value' );

		$this->assertEquals( 'test-value', get_site_transient( 'test-transient' ) );
	}

	public function test_delete() {
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$transients = new Transients( $context );
		$this->assertFalse( $context->is_network_mode() );
		set_transient( 'test-transient', 'test-value' );
		$this->assertEquals( 'test-value', get_transient( 'test-transient' ) );

		$transients->delete( 'test-transient' );

		$this->assertFalse( get_transient( 'test-transient' ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_delete() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$transients = new Transients( $context );
		$this->assertTrue( $context->is_network_mode() );
		set_site_transient( 'test-transient', 'test-value' );
		$this->assertEquals( 'test-value', get_site_transient( 'test-transient' ) );

		$transients->delete( 'test-transient' );

		$this->assertFalse( get_site_transient( 'test-transient' ) );
	}
}
