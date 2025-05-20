<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerceGoogleAnalyticsIntegration
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;

/**
 * Class for handling Google Analytics for WooCommerce conversion events.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class WooCommerceGoogleAnalyticsIntegration extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'woocommerce-google-analytics-integration';

	/**
	 * Checks if the Google Analytics for WooCommerce plugin is active.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if Google Analytics for WooCommerce is active, false otherwise.
	 */
	public function is_active() {
		return class_exists( 'WC_Google_Analytics_Integration' );
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		$settings    = get_option( 'woocommerce_google_analytics_settings' );
		$event_names = array();

		// If only product identifier is availabe in the saved settings, it means default options are used.
		// And by default all events are tracked.
		if ( isset( $settings['ga_product_identifier'] ) && count( $settings ) === 1 ) {
			return array(
				'purchase',
				'add_to_cart',
				'remove_from_cart',
				'view_item_list',
				'select_content',
				'view_item',
				'begin_checkout',
			);
		}

		$event_mapping = array(
			'ga_ecommerce_tracking_enabled'           => 'purchase',
			'ga_event_tracking_enabled'               => 'add_to_cart',
			'ga_enhanced_remove_from_cart_enabled'    => 'remove_from_cart',
			'ga_enhanced_product_impression_enabled'  => 'view_item_list',
			'ga_enhanced_product_click_enabled'       => 'select_content',
			'ga_enhanced_product_detail_view_enabled' => 'view_item',
			'ga_enhanced_checkout_process_enabled'    => 'begin_checkout',
		);

		$event_names = array();

		foreach ( $event_mapping as $setting_key => $event_name ) {
			if ( isset( $settings[ $setting_key ] ) && 'yes' === $settings[ $setting_key ] ) {
				$event_names[] = $event_name;
			}
		}

		return $event_names;
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since n.e.x.t
	 *
	 * @return Script|null Script instance, or null if no script is registered.
	 */
	public function register_script() {
		return null;
	}
}
