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
		$event_names = array( 'add_to_cart' );

		if ( Feature_Flags::enabled( 'gtagUserData' ) ) {
			$event_names[] = 'purchase';
		}

		return $event_names;
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
	 */
	public function register_hooks() {
		if ( Feature_Flags::enabled( 'gtagUserData' ) ) {
			add_action(
				'wp_footer',
				$this->get_method_proxy( 'maybe_add_purchase_data_from_session' )
			);
		}
	}

	/**
	 * Prints the purchase data.
	 *
	 * @since 1.164.0
	 */
	protected function maybe_add_purchase_data_from_session() {
		if ( ! function_exists( 'edd_get_purchase_session' ) || ! function_exists( 'edd_is_success_page' ) || ! edd_is_success_page() ) {
			return;
		}

		$purchase_session = edd_get_purchase_session();
		$purchase_data    = $this->get_enhanced_conversions_data_from_session( $purchase_session );

		wp_add_inline_script(
			'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			join(
				"\n",
				array(
					'window._googlesitekit.edddata = window._googlesitekit.edddata || {};',
					sprintf( 'window._googlesitekit.edddata.purchase = %s;', wp_json_encode( $purchase_data ) ),
				)
			),
			'before'
		);
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

		$user_data = $this->extract_user_data_from_session( $session_data );

		if ( empty( $user_data ) ) {
			return array();
		}

		return array(
			'user_data' => $user_data,
		);
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
}
