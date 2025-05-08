<?php
/**
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerce;
use Google\Site_Kit\Tests\TestCase;

class WooCommerceTest extends TestCase {

	/**
	 * WooCommerce instance.
	 *
	 * @var WooCommerce
	 */
	private $woocommerce;

	public function set_up() {
		parent::set_up();
		$this->woocommerce = new WooCommerce( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_is_active() {
		$this->assertFalse( $this->woocommerce->is_active() );

		// Fake the existence of the `WooCommerce` class.
		class_alias( __CLASS__, 'WooCommerce' );

		$this->assertTrue( $this->woocommerce->is_active() );
	}

	public function test_get_event_names() {
		$events = $this->woocommerce->get_event_names();
		$this->assertCount( 2, $events );
		$this->assertEquals( 'add_to_cart', $events[0] );
		$this->assertEquals( 'purchase', $events[1] );
	}

	public function test_register_script() {
		$handle = 'googlesitekit-events-provider-' . WooCommerce::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ) );

		$script = $this->woocommerce->register_script();
		$this->assertInstanceOf( Script::class, $script );
		$this->assertTrue( wp_script_is( $handle, 'registered' ) );
	}

	public function test_register_hooks() {
		$this->assertFalse( has_action( 'woocommerce_thankyou' ) );
		$this->assertFalse( has_action( 'woocommerce_add_to_cart' ) );
		$this->assertFalse( has_filter( 'woocommerce_loop_add_to_cart_link' ) );

		$this->woocommerce->register_hooks();
		$this->assertTrue( has_action( 'woocommerce_thankyou' ) );
		$this->assertTrue( has_action( 'woocommerce_add_to_cart' ) );
		$this->assertTrue( has_filter( 'woocommerce_loop_add_to_cart_link' ) );
	}
}
