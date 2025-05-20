<?php
/**
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerceGoogleAnalyticsIntegration;
use Google\Site_Kit\Tests\TestCase;

class WooCommerceGoogleAnalyticsIntegrationTest extends TestCase {

	/**
	 * WooCommerce instance.
	 *
	 * @var WooCommerce
	 */
	private $woocommerceAnalyticsIntegration;

	public function set_up() {
		parent::set_up();

		update_option( 'woocommerce_google_analytics_settings', array( 'ga_product_identifier' => 'product' ) );

		$this->woocommerceAnalyticsIntegration = new WooCommerceGoogleAnalyticsIntegration( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function tear_down() {
		parent::tear_down();

		delete_option( 'woocommerce_google_analytics_settings' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_is_active() {
		$this->assertFalse( $this->woocommerceAnalyticsIntegration->is_active(), 'Expected WooCommerceGoogleAnalyticsIntegration to be inactive.' );

		// Fake the existence of the `WC_Google_Analytics_Integration` class.
		class_alias( __CLASS__, 'WC_Google_Analytics_Integration' );

		$this->assertTrue( $this->woocommerceAnalyticsIntegration->is_active() );
	}

	public function test_get_event_names() {
		$events = $this->woocommerceAnalyticsIntegration->get_event_names();
		$this->assertCount( 7, $events, 'Expected 7 events, got ' . count( $events ) );
	}

	/**
	 * @dataProvider data_settings
	 */
	public function test_get_event_names__settings_mapping( $settings, $expectedEvents ) {
		update_option( 'woocommerce_google_analytics_settings', $settings );

		$events = $this->woocommerceAnalyticsIntegration->get_event_names();

		$this->assertEquals( $expectedEvents, $events, 'Event names ' . implode( ', ', $events ) . ' do not match the expected values ' . implode( ', ', $expectedEvents ) . '.' );
	}

	public function data_settings() {
		return array(
			'only add_to_cart enabled'      => array(
				array( 'ga_event_tracking_enabled' => 'yes' ),
				array( 'add_to_cart' ),
			),
			'only purchase enabled'         => array(
				array( 'ga_ecommerce_tracking_enabled' => 'yes' ),
				array( 'purchase' ),
			),
			'only remove_from_cart enabled' => array(
				array( 'ga_enhanced_remove_from_cart_enabled' => 'yes' ),
				array( 'remove_from_cart' ),
			),
			'only view_item_list enabled'   => array(
				array( 'ga_enhanced_product_impression_enabled' => 'yes' ),
				array( 'view_item_list' ),
			),
			'only select_content enabled'   => array(
				array( 'ga_enhanced_product_click_enabled' => 'yes' ),
				array( 'select_content' ),
			),
			'only view_item enabled'        => array(
				array( 'ga_enhanced_product_detail_view_enabled' => 'yes' ),
				array( 'view_item' ),
			),
			'only begin_checkout enabled'   => array(
				array( 'ga_enhanced_checkout_process_enabled' => 'yes' ),
				array( 'begin_checkout' ),
			),
			'default settings with only ga_product_identifier' => array(
				array( 'ga_product_identifier' => 'id' ),
				array(
					'purchase',
					'add_to_cart',
					'remove_from_cart',
					'view_item_list',
					'select_content',
					'view_item',
					'begin_checkout',
				),
			),
			'multiple enabled'              => array(
				array(
					'ga_ecommerce_tracking_enabled'     => 'yes',
					'ga_event_tracking_enabled'         => 'yes',
					'ga_enhanced_product_click_enabled' => 'yes',
				),
				array( 'purchase', 'add_to_cart', 'select_content' ),
			),
			'nothing enabled'               => array(
				array(),
				array(),
			),
		);
	}
}
