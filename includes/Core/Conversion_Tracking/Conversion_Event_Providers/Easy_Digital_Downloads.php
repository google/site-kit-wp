<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Easy_Digital_Downloads
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\Enhanced_Conversions\Enhanced_Conversions;

/**
 * Class for handling Easy Digital Downloads conversion events.
 *
 * @since 1.130.0
 * @access private
 * @ignore
 */
class Easy_Digital_Downloads extends Conversion_Events_Provider {

	use Method_Proxy_Trait;

	const CONVERSION_EVENT_PROVIDER_SLUG = 'easy-digital-downloads';

	/**
	 * Gets the provider category.
	 *
	 * @since 1.181.0
	 *
	 * @return string Provider category.
	 */
	public function get_category() {
		return self::CATEGORY_ECOMMERCE;
	}

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
		return array( 'add_to_cart', 'purchase' );
	}

	/**
	 * Gets the enhanced conversion event names that are tracked by this provider.
	 *
	 * @since 1.165.0
	 *
	 * @return array List of enhanced conversion event names.
	 */
	public function get_enhanced_event_names() {
		return array( 'add_to_cart' );
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
	 * Registers hooks for the Easy Digital Downloads provider.
	 *
	 * @since 1.164.0
	 * @since 1.188.0 The footer callback adds the store currency as well as the purchase data.
	 */
	public function register_hooks() {
		add_action(
			'wp_footer',
			$this->get_method_proxy( 'add_inline_data' )
		);
	}

	/**
	 * Adds the data the provider script needs to the page.
	 *
	 * @since 1.188.0
	 */
	protected function add_inline_data() {
		$inline_script = array();

		$currency = $this->get_currency();

		if ( $currency ) {
			$inline_script[] = sprintf( 'window._googlesitekit.edddata.currency = %s;', wp_json_encode( $currency ) );
		}

		$purchase_data = $this->get_purchase_data_from_session();

		if ( null !== $purchase_data ) {
			$inline_script[] = sprintf( 'window._googlesitekit.edddata.purchase = %s;', wp_json_encode( $purchase_data ) );
		}

		if ( empty( $inline_script ) ) {
			return;
		}

		array_unshift( $inline_script, 'window._googlesitekit.edddata = window._googlesitekit.edddata || {};' );

		wp_add_inline_script(
			'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			join( "\n", $inline_script ),
			'before'
		);
	}

	/**
	 * Gets the store's currency.
	 *
	 * Only a currency in ISO 4217 format is one gtag accepts, so a code of any
	 * other shape is discarded rather than reported. A lowercase code is
	 * uppercased, as ISO 4217 codes are uppercase.
	 *
	 * @since 1.188.0
	 *
	 * @return string The store's three-letter currency code, or an empty string if there isn't a usable one.
	 */
	protected function get_currency() {
		$currency = $this->read_store_currency();

		if ( ! is_string( $currency ) || ! preg_match( '/^[A-Za-z]{3}$/', $currency ) ) {
			return '';
		}

		return strtoupper( $currency );
	}

	/**
	 * Gets the purchase data for the current request.
	 *
	 * @since 1.188.0
	 *
	 * @return array|null The purchase data, or null when the current request isn't a completed purchase.
	 */
	protected function get_purchase_data_from_session() {
		if ( ! $this->is_success_page() ) {
			return null;
		}

		$purchase_session = $this->read_purchase_session();

		// A session is missing or expired on a success page reached without a
		// purchase. Reporting it as a purchase of nothing would have the provider
		// script send an empty purchase event.
		if ( ! is_array( $purchase_session ) ) {
			return null;
		}

		return $this->get_enhanced_conversions_data_from_session( $purchase_session );
	}

	/**
	 * Reads the store's configured currency from Easy Digital Downloads.
	 *
	 * This is one of the seams where the provider talks to Easy Digital Downloads.
	 * It holds no logic of its own, so the code around it stays testable without
	 * the plugin installed.
	 *
	 * @since 1.188.0
	 *
	 * @return mixed Whatever Easy Digital Downloads reports, or null when it isn't there to ask.
	 */
	protected function read_store_currency() {
		return function_exists( 'edd_get_currency' ) ? edd_get_currency() : null;
	}

	/**
	 * Reads the current purchase from the Easy Digital Downloads session.
	 *
	 * This is one of the seams where the provider talks to Easy Digital Downloads.
	 * It holds no logic of its own, so the code around it stays testable without
	 * the plugin installed.
	 *
	 * @since 1.188.0
	 *
	 * @return mixed Whatever Easy Digital Downloads reports, or null when it isn't there to ask.
	 */
	protected function read_purchase_session() {
		return function_exists( 'edd_get_purchase_session' ) ? edd_get_purchase_session() : null;
	}

	/**
	 * Determines whether the current request is the Easy Digital Downloads purchase success page.
	 *
	 * This is one of the seams where the provider talks to Easy Digital Downloads.
	 * It holds no logic of its own, so the code around it stays testable without
	 * the plugin installed.
	 *
	 * @since 1.188.0
	 *
	 * @return bool Whether the current request is the purchase success page, false when Easy Digital Downloads isn't there to ask.
	 */
	protected function is_success_page() {
		return function_exists( 'edd_is_success_page' ) && edd_is_success_page();
	}

	/**
	 * Extracts Enhanced Conversions data from an EDD session.
	 *
	 * @since 1.164.0
	 *
	 * @param mixed|array|null $session_data An array containing EDD purchase session data.
	 *
	 * @return array
	 */
	protected function get_enhanced_conversions_data_from_session( $session_data ) {
		if ( ! is_array( $session_data ) ) {
			return array();
		}

		$enhanced_conversions_data = array(
			'items' => $this->extract_items_data_from_session( $session_data ),
			'value' => $this->extract_cart_total_from_session( $session_data ),
		);

		if ( Feature_Flags::enabled( 'gtagUserData' ) ) {
			$user_data = $this->extract_user_data_from_session( $session_data );
			if ( ! empty( $user_data ) ) {
				$enhanced_conversions_data['user_data'] = $user_data;
			}
		}

		return $enhanced_conversions_data;
	}


	/**
	 * Extracts user data from an EDD session.
	 *
	 * @since 1.164.0
	 *
	 * @param array $session_data An array containing EDD purchase session data.
	 *
	 * @return array
	 */
	protected function extract_user_data_from_session( $session_data ) {
		$user_data    = array();
		$address_data = array();

		if ( isset( $session_data['user_info'] ) ) {
			$email = $session_data['user_info']['email'] ?? $session_data['user_email'] ?? '';

			if ( ! empty( $email ) ) {
				$user_data['email'] = Enhanced_Conversions::get_normalized_email( $email );
			}

			if ( ! empty( $session_data['user_info']['first_name'] ) ) {
				$address_data['first_name'] = Enhanced_Conversions::get_normalized_value( $session_data['user_info']['first_name'] );
			}

			if ( ! empty( $session_data['user_info']['last_name'] ) ) {
				$address_data['last_name'] = Enhanced_Conversions::get_normalized_value( $session_data['user_info']['last_name'] );
			}

			if ( isset( $session_data['user_info']['address'] ) ) {

				if ( ! empty( $session_data['user_info']['address']['phone'] ) ) {
					$user_data['phone_number'] = Enhanced_Conversions::get_normalized_value( $session_data['user_info']['address']['phone'] );
				}

				if ( ! empty( $session_data['user_info']['address']['line1'] ) ) {
					$address_data['street'] = Enhanced_Conversions::get_normalized_value( $session_data['user_info']['address']['line1'] );
				}

				if ( ! empty( $session_data['user_info']['address']['city'] ) ) {
					$address_data['city'] = Enhanced_Conversions::get_normalized_value( $session_data['user_info']['address']['city'] );
				}

				if ( ! empty( $session_data['user_info']['address']['state'] ) ) {
					$region = $session_data['user_info']['address']['state'];

					// Attempt to get full region name.
					if ( function_exists( 'edd_get_state_name' ) && ! empty( $session_data['user_info']['address']['country'] ) ) {
						$region = edd_get_state_name( $session_data['user_info']['address']['country'], $region );
					}

					$address_data['region'] = Enhanced_Conversions::get_normalized_value( $region );
				}

				if ( ! empty( $session_data['user_info']['address']['zip'] ) ) {
					$address_data['postal_code'] = Enhanced_Conversions::get_normalized_value( $session_data['user_info']['address']['zip'] );
				}

				if ( ! empty( $session_data['user_info']['address']['country'] ) ) {
					$address_data['country'] = $session_data['user_info']['address']['country'];
				}
			}
		}

		if ( ! empty( $address_data ) ) {
			$user_data['address'] = $address_data;
		}

		return $user_data;
	}

	/**
	 * Extracts purchased items' data from an EDD session.
	 *
	 * @since 1.178.0
	 *
	 * @param array $session_data An array containing EDD purchase session data.
	 *
	 * @return array
	 */
	protected function extract_items_data_from_session( $session_data ) {
		$items = array();

		if ( ! isset( $session_data['cart_details'] ) || ! is_array( $session_data['cart_details'] ) ) {
			return $items;
		}

		foreach ( $session_data['cart_details'] as $item_data ) {
			$items[] = array(
				'item_id'   => $item_data['id'],
				'item_name' => $item_data['name'],
				'price'     => $item_data['item_price'],
			);
		}

		return $items;
	}

	/**
	 * Extracts the cart's total from an EDD session.
	 *
	 * @since 1.178.0
	 *
	 * @param array $session_data An array containing EDD purchase session data.
	 *
	 * @return float|null The cart's total.
	 */
	protected function extract_cart_total_from_session( $session_data ) {
		if ( isset( $session_data['price'] ) ) {
			return $session_data['price'];
		}

		// Mimic the client side's way of defaulting to 0.
		return 0;
	}
}
