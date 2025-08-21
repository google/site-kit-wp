<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Easy_Digital_Downloads
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Modules\Ads\Enhanced_Conversions;

/**
 * Class for handling Easy Digital Downloads conversion events.
 *
 * @since 1.130.0
 * @access private
 * @ignore
 */
class Easy_Digital_Downloads extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'easy-digital-downloads';

	/**
	 * Checks if the Easy Digital Downloads plugin is active.
	 *
	 * @since 1.130.0
	 *
	 * @return bool True if Easy Digital Downloads is active, false otherwise.
	 */
	public function is_active() {
		return defined( 'EDD_VERSION' );
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * @since 1.130.0
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return $this->events_to_track();
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of event names.
	 */
	protected function events_to_track() {
		return array( 'add_to_cart', 'purchase' );
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since 1.130.0
	 *
	 * @return Script Script instance.
	 */
	public function register_script() {
		$script = new Script(
			'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			array(
				'src'          => $this->context->url( 'dist/assets/js/googlesitekit-events-provider-easy-digital-downloads.js' ),
				'execution'    => 'defer',
				'dependencies' => array( 'edd-ajax' ),
			)
		);

		$script->register( $this->context );

		return $script;
	}

	/**
	 * Registers hooks for user data extraction.
	 *
	 * @since n.e.x.t
	 */
	public function register_hooks() {
		add_action(
			'edd_complete_purchase',
			fn( $payment_id ) => $this->maybe_add_purchase_inline_script( $payment_id ),
			10,
			1
		);

		add_action(
			'wp_footer',
			function () {
				$script_slug = 'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG;

				$events_to_track = $this->events_to_track();

				$inline_script = join(
					"\n",
					array(
						'window._googlesitekit.edddata = window._googlesitekit.edddata || {};',
						sprintf( 'window._googlesitekit.edddata.eventsToTrack = %s;', wp_json_encode( $events_to_track ) ),
					)
				);

				// Add currency for add_to_cart events.
				if ( function_exists( 'edd_get_currency' ) ) {
					$inline_script .= sprintf( "\n" . 'window._googlesitekit.easyDigitalDownloadsCurrency = "%s";', esc_js( edd_get_currency() ) );
				}

				// Check if we're on an EDD purchase completion page and add purchase data
				$this->maybe_add_purchase_data_on_completion_page( $inline_script );

				wp_add_inline_script( $script_slug, $inline_script, 'before' );
			}
		);
	}

	/**
	 * Adds purchase inline script for EDD (like WooCommerce).
	 *
	 * @since n.e.x.t
	 *
	 * @param int $payment_id The EDD payment ID.
	 */
	protected function maybe_add_purchase_inline_script( $payment_id ) {
		if ( ! function_exists( 'edd_get_payment_meta' ) ) {
			return;
		}

		$payment_meta = edd_get_payment_meta( $payment_id );
		if ( ! $payment_meta ) {
			return;
		}



		// Get Enhanced Conversions data (if feature flag enabled)
		$purchase_user_data = $this->get_enhanced_conversions_data( $payment_meta );

		// Store user data in transient for the completion page to pick up (short expiry)
		$transient_key = 'googlesitekit_edd_user_data_' . get_current_user_id();
		set_transient( $transient_key, $purchase_user_data, 30 ); // 30 seconds - just enough for page redirect
	}

	/**
	 * Checks if we're on EDD purchase completion page and adds purchase data.
	 *
	 * @since n.e.x.t
	 *
	 * @param string &$inline_script Reference to the inline script being built.
	 */
	protected function maybe_add_purchase_data_on_completion_page( &$inline_script ) {
		// Check if we're on EDD purchase completion page using EDD's native function
		$is_edd_completion = function_exists( 'edd_is_success_page' ) && edd_is_success_page();

		if ( ! $is_edd_completion ) {
			return;
		}

		// Get user data from transient (stored during edd_complete_purchase)
		$transient_key = 'googlesitekit_edd_user_data_' . get_current_user_id();
		$purchase_user_data = get_transient( $transient_key );

		if ( ! $purchase_user_data ) {
			return;
		}

		// Delete the transient so it doesn't persist
		delete_transient( $transient_key );

		// Add user data to the inline script
		$inline_script .= "\n" . sprintf( 'window._googlesitekit.edddata.purchase = %s;', wp_json_encode( $purchase_user_data ) );
		$inline_script .= "\n" . 'console.log("✅ EDD Enhanced Conversions user data added on completion page:", window._googlesitekit.edddata.purchase);';
	}

	/**
	 * Gets Enhanced Conversions data for purchase.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $payment_meta The EDD payment metadata.
	 * @return array Enhanced Conversions data with 'user_data' key or empty array.
	 */
	protected function get_enhanced_conversions_data( $payment_meta ) {
		if ( ! Feature_Flags::enabled( 'gtagUserData' ) ) {
			return array();
		}

		$user_data = $this->extract_user_data_from_payment( $payment_meta );
		
		if ( ! empty( $user_data ) ) {
			return array( 'user_data' => $user_data );
		}

		return array();
	}

	/**
	 * Extracts and normalizes user data from EDD payment for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $payment_meta The EDD payment metadata.
	 * @return array Normalized user data or empty array if no supported fields are available.
	 */
	protected function extract_user_data_from_payment( $payment_meta ) {
		$user_data = array();

		if ( ! is_array( $payment_meta ) ) {
			return $user_data;
		}

		// Extract email from payment meta.
		$email = isset( $payment_meta['email'] ) ? $payment_meta['email'] : '';
		if ( ! empty( $email ) ) {
			$user_data['email'] = Enhanced_Conversions::get_normalized_email( $email );
		}

		// Extract user info (first name, last name) from payment meta.
		$user_info = isset( $payment_meta['user_info'] ) ? $payment_meta['user_info'] : array();
		$address_data = array();

		if ( isset( $user_info['first_name'] ) && ! empty( $user_info['first_name'] ) ) {
			$address_data['first_name'] = Enhanced_Conversions::get_normalized_value( $user_info['first_name'] );
		}

		if ( isset( $user_info['last_name'] ) && ! empty( $user_info['last_name'] ) ) {
			$address_data['last_name'] = Enhanced_Conversions::get_normalized_value( $user_info['last_name'] );
		}

		// Extract address information if available.
		if ( isset( $user_info['address'] ) && is_array( $user_info['address'] ) ) {
			$address_info = $user_info['address'];

			if ( isset( $address_info['line1'] ) && ! empty( $address_info['line1'] ) ) {
				$address_data['street'] = Enhanced_Conversions::get_normalized_value( $address_info['line1'] );
			}

			if ( isset( $address_info['city'] ) && ! empty( $address_info['city'] ) ) {
				$address_data['city'] = Enhanced_Conversions::get_normalized_value( $address_info['city'] );
			}

			if ( isset( $address_info['state'] ) && ! empty( $address_info['state'] ) ) {
				$address_data['region'] = Enhanced_Conversions::get_normalized_value( $address_info['state'] );
			}

			if ( isset( $address_info['zip'] ) && ! empty( $address_info['zip'] ) ) {
				$address_data['postal_code'] = Enhanced_Conversions::get_normalized_value( $address_info['zip'] );
			}

			if ( isset( $address_info['country'] ) && ! empty( $address_info['country'] ) ) {
				$address_data['country'] = Enhanced_Conversions::get_normalized_value( $address_info['country'] );
			}
		}

		// Only include address if it has at least one field.
		if ( ! empty( $address_data ) ) {
			$user_data['address'] = $address_data;
		}

		// Return user data only if it contains at least one supported field.
		return $user_data;
	}
}
