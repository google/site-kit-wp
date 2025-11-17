<?php
/**
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760


namespace Google\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerce;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\WC_Countries_Fake;

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

	public function test_events_to_track() {
		$reflection = new \ReflectionClass( $this->woocommerce );
		$method     = $reflection->getMethod( 'events_to_track' );
		$method->setAccessible( true );

		$events = $method->invoke( $this->woocommerce );

		$this->assertCount( 2, $events, 'Expected 2 event, got ' . count( $events ) );
		$this->assertEquals( 'add_to_cart', $events[0], 'Expected add_to_cart event, got ' . $events[0] );
		$this->assertEquals( 'purchase', $events[1], 'Expected purchase event, got ' . $events[1] );
	}

	public function test_events_to_track__when_analytics_integration_addon_is_active() {
		$reflection = new \ReflectionClass( $this->woocommerce );
		$method     = $reflection->getMethod( 'events_to_track' );
		$method->setAccessible( true );

		class_alias( __CLASS__, 'WC_Google_Analytics_Integration' );

		// If the WooCommerce Google Analytics Integration is active, and has `add_to_cart` event enabled,
		// WooCommerce provider should track only purchase event.
		update_option( 'woocommerce_google_analytics_settings', array( 'ga_event_tracking_enabled' => 'yes' ) );

		$events = $method->invoke( $this->woocommerce );
		$this->assertCount( 1, $events, 'Expected 1 event, got ' . count( $events ) );
		$this->assertEquals( 'purchase', $events[0], 'Expected purchase event, got ' . $events[0] );

		// If purchase event is enabled, WooCommerce provider should track only add to cart event.
		update_option( 'woocommerce_google_analytics_settings', array( 'ga_ecommerce_tracking_enabled' => 'yes' ) );
		$events = $method->invoke( $this->woocommerce );
		$this->assertCount( 1, $events, 'Expected 1 event, got ' . count( $events ) );
		$this->assertEquals( 'add_to_cart', $events[0], 'Expected add_to_cart event, got ' . $events[0] );

		// If purchase and add to cart events are enabled, WooCommerce provider should no track any event.
		update_option(
			'woocommerce_google_analytics_settings',
			array(
				'ga_ecommerce_tracking_enabled' => 'yes',
				'ga_event_tracking_enabled'     => 'yes',
			)
		);
		$events = $method->invoke( $this->woocommerce );
		$this->assertCount( 0, $events, 'Expected 0 events, got ' . count( $events ) );

		delete_option( 'woocommerce_google_analytics_settings' );
	}

	public function test_get_event_names() {
		$events = $this->woocommerce->get_event_names();
		$this->assertCount( 2, $events, 'Expected 2 events, got ' . count( $events ) );
		$this->assertEquals( 'add_to_cart', $events[0], 'Expected add_to_cart event, got ' . $events[0] );
		$this->assertEquals( 'purchase', $events[1], 'Expected purchase event, got ' . $events[1] );
	}

	/**
	 * @dataProvider wgai_active_event_names
	 */
	public function test_get_event_names__analytics_integration_addon_settings_mapping( $settings, $expectedEvents ) {
		update_option( 'woocommerce_google_analytics_settings', $settings );

		$events = $this->woocommerce->get_event_names();

		$this->assertEquals( $expectedEvents, $events, 'Event names ' . implode( ', ', $events ) . ' do not match the expected values ' . implode( ', ', $expectedEvents ) . '.' );
	}

	/**
	 * @dataProvider wgai_data_settings
	 */
	public function test_get_wgai_event_names( $settings, $expectedEvents ) {
		$reflection = new \ReflectionClass( $this->woocommerce );
		$method     = $reflection->getMethod( 'get_wgai_event_names' );
		$method->setAccessible( true );

		update_option( 'woocommerce_google_analytics_settings', $settings );

		$events = $method->invoke( $this->woocommerce );

		$this->assertEquals( $expectedEvents, $events, 'Event names ' . implode( ', ', $events ) . ' do not match the expected values ' . implode( ', ', $expectedEvents ) . '.' );
	}

	public function test_register_script() {
		$handle = 'googlesitekit-events-provider-' . WooCommerce::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ), 'Expected script to not be registered.' );

		$script = $this->woocommerce->register_script();
		$this->assertInstanceOf( Script::class, $script, 'Expected script to be an instance of Script.' );
		$this->assertTrue( wp_script_is( $handle, 'registered' ), 'Expected script to be registered.' );
	}

	public function test_register_hooks() {
		$this->assertFalse( has_action( 'woocommerce_thankyou' ), 'Expected woocommerce_thankyou action to not be registered.' );
		$this->assertFalse( has_action( 'woocommerce_add_to_cart' ), 'Expected woocommerce_add_to_cart action to not be registered.' );
		$this->assertFalse( has_filter( 'woocommerce_loop_add_to_cart_link' ), 'Expected woocommerce_loop_add_to_cart_link filter to not be registered.' );

		$this->woocommerce->register_hooks();
		$this->assertTrue( has_action( 'woocommerce_thankyou' ), 'Expected woocommerce_thankyou action to be registered.' );
		$this->assertTrue( has_action( 'woocommerce_add_to_cart' ), 'Expected woocommerce_add_to_cart action to be registered.' );
		$this->assertTrue( has_filter( 'woocommerce_loop_add_to_cart_link' ), 'Expected woocommerce_loop_add_to_cart_link filter to be registered.' );
	}

	public function wgai_active_event_names() {
		// When the WooCommerce Google Analytics Integration is active, events will be combined.
		return array(
			'only add_to_cart enabled'      => array(
				array( 'ga_event_tracking_enabled' => 'yes' ),
				array( 'purchase', 'add_to_cart' ),
			),
			'only purchase enabled'         => array(
				array( 'ga_ecommerce_tracking_enabled' => 'yes' ),
				array( 'add_to_cart', 'purchase' ),
			),
			'only remove_from_cart enabled' => array(
				array( 'ga_enhanced_remove_from_cart_enabled' => 'yes' ),
				array( 'add_to_cart', 'purchase', 'remove_from_cart' ),
			),
			'only view_item_list enabled'   => array(
				array( 'ga_enhanced_product_impression_enabled' => 'yes' ),
				array( 'add_to_cart', 'purchase', 'view_item_list' ),
			),
			'only select_content enabled'   => array(
				array( 'ga_enhanced_product_click_enabled' => 'yes' ),
				array( 'add_to_cart', 'purchase', 'select_content' ),
			),
			'only view_item enabled'        => array(
				array( 'ga_enhanced_product_detail_view_enabled' => 'yes' ),
				array( 'add_to_cart', 'purchase', 'view_item' ),
			),
			'only begin_checkout enabled'   => array(
				array( 'ga_enhanced_checkout_process_enabled' => 'yes' ),
				array( 'add_to_cart', 'purchase', 'begin_checkout' ),
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
				array( 'add_to_cart', 'purchase' ),
			),
		);
	}

	public function wgai_data_settings() {
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

	/**
	 * @dataProvider phone_normalization_data_provider
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_get_normalized_phone( $phone, $country, $country_calling_code, $expected ) {
		// Create a test double for WC_Countries using class_alias.
		if ( ! class_exists( 'WC_Countries' ) ) {
			class_alias( 'Google\Site_Kit\Tests\WC_Countries_Fake', 'WC_Countries' );
		}

		// Set the calling code for this test iteration.
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Using fake class property.
		\WC_Countries::$test_calling_code = $country_calling_code;

		$reflection = new \ReflectionClass( $this->woocommerce );
		$method     = $reflection->getMethod( 'get_normalized_phone' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->woocommerce, $phone, $country );

		$this->assertEquals( $expected, $result );
	}

	public function phone_normalization_data_provider() {
		return array(
			// Test case 1: Phone number with correct country code prefix is not duplicated.
			'phone with correct country code - Sri Lanka' => array(
				'phone'                => '+94771770589',
				'country'              => 'LK',
				'country_calling_code' => '+94',
				'expected'             => '+94771770589',
			),
			// Test case 2: Phone number with different country code than billing is respected.
			'phone with different country code - Mauritius number with UK billing' => array(
				'phone'                => '+2307800099',
				'country'              => 'GB',
				'country_calling_code' => '+44',
				'expected'             => '+2307800099',
			),
			// Test case 3: National number without country code gets it prepended.
			'national number without country code - Sri Lanka' => array(
				'phone'                => '771770589',
				'country'              => 'LK',
				'country_calling_code' => '+94',
				'expected'             => '+94771770589',
			),
			// Test case 4: National number with leading zero.
			'national number with leading zero - Sri Lanka' => array(
				'phone'                => '0771770589',
				'country'              => 'LK',
				'country_calling_code' => '+94',
				'expected'             => '+94771770589',
			),
			// Test case 5: Short invalid number fails validation.
			'short invalid number - UK'                   => array(
				'phone'                => '7800099',
				'country'              => 'GB',
				'country_calling_code' => '+44',
				'expected'             => '', // Too short after prepending +44.
			),
			// Test case 6: Empty/whitespace-only input returns empty string.
			'empty string'                                => array(
				'phone'                => '',
				'country'              => 'US',
				'country_calling_code' => '+1',
				'expected'             => '',
			),
			'whitespace only'                             => array(
				'phone'                => '   ',
				'country'              => 'US',
				'country_calling_code' => '+1',
				'expected'             => '',
			),
			// Test case 7: Number with only non-digit characters returns empty string.
			'only special characters'                     => array(
				'phone'                => '+++---',
				'country'              => 'US',
				'country_calling_code' => '+1',
				'expected'             => '',
			),
			// Test case 8: Very long numbers fail validation.
			'very long number'                            => array(
				'phone'                => '+1234567890123456', // 17 chars, exceeds 15 max.
				'country'              => 'US',
				'country_calling_code' => '+1',
				'expected'             => '',
			),
			// Test case 9: Phone number with formatting characters (spaces, dashes, parentheses).
			'formatted phone number - US'                 => array(
				'phone'                => '(555) 123-4567',
				'country'              => 'US',
				'country_calling_code' => '+1',
				'expected'             => '+15551234567',
			),
			// Test case 10: Phone number with country code but no plus sign.
			'country code without plus - Sri Lanka'       => array(
				'phone'                => '94771770589',
				'country'              => 'LK',
				'country_calling_code' => '+94',
				'expected'             => '+94771770589',
			),
			// Test case 11: Phone number with plus and spaces.
			'phone with plus and spaces - UK'             => array(
				'phone'                => '+44 20 7946 0958',
				'country'              => 'GB',
				'country_calling_code' => '+44',
				'expected'             => '+442079460958',
			),
			// Test case 12: Minimum valid length.
			'minimum valid length - 11 chars'             => array(
				'phone'                => '+12345678901', // Exactly 11 chars (including +).
				'country'              => 'US',
				'country_calling_code' => '+1',
				'expected'             => '+12345678901',
			),
			// Test case 13: Maximum valid length.
			'maximum valid length - 15 chars'             => array(
				'phone'                => '+12345678901234', // Exactly 15 chars (including +).
				'country'              => 'US',
				'country_calling_code' => '+1',
				'expected'             => '+12345678901234',
			),
			// Test case 14: National number that becomes too short after removing leading zeros.
			'all zeros'                                   => array(
				'phone'                => '0000',
				'country'              => 'US',
				'country_calling_code' => '+1',
				'expected'             => '',
			),
			// Test case 15: Phone number with explicit + but matches billing country.
			'explicit plus matching billing country'      => array(
				'phone'                => '+44 7700 900077',
				'country'              => 'GB',
				'country_calling_code' => '+44',
				'expected'             => '+447700900077',
			),
			// Test case 16: National number with multiple leading zeros.
			'multiple leading zeros'                      => array(
				'phone'                => '00771770589',
				'country'              => 'LK',
				'country_calling_code' => '+94',
				'expected'             => '+94771770589',
			),
		);
	}

	/**
	 * Test fallback to Enhanced_Conversions normalization when WooCommerce is unavailable.
	 */
	public function test_get_normalized_phone_fallback() {
		$reflection = new \ReflectionClass( $this->woocommerce );
		$method     = $reflection->getMethod( 'get_normalized_phone' );
		$method->setAccessible( true );

		// Test with empty country (WooCommerce unavailable scenario).
		$result = $method->invoke( $this->woocommerce, '+94771770589', '' );

		// Should fallback to Enhanced_Conversions::get_normalized_value().
		// Enhanced_Conversions normalizes to lowercase and trims, but keeps other chars.
		$this->assertEquals( '+94771770589', $result );
	}
}
