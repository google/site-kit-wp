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
use Google\Site_Kit\Modules\Ads\Enhanced_Conversions;

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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 */
	protected function maybe_add_purchase_data_from_session() {
		if ( ! edd_is_success_page() ) {
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
	 * @since n.e.x.t
	 *
	 * @param mixed|array|null $session An array containing EDD purchase session data.
	 *
	 * @return array
	 */
	protected function get_enhanced_conversions_data_from_session( $session ) {
		if ( ! is_array( $session ) ) {
			return array();
		}

		$user_data = $this->extract_user_data_from_session( $session );

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
	 * @since n.e.x.t
	 *
	 * @param array $session An array containing EDD purchase session data.
	 *
	 * @return array
	 */
	protected function extract_user_data_from_session( $session ) {
		if ( isset( $session['user_info'] ) ) {
			$session_info = $session['user_info'];

			$email      = $session_info['email'] ?? $session['user_email'];
			$first_name = $session_info['first_name'];
			$last_name  = $session_info['last_name'];

			if ( isset( $session['user_info']['address'] ) ) {
				$session_address = $session_info['address'];

				$phone_number = $session_address['phone'];
				$street       = $session_address['line1'];
				$city         = $session_address['city'];
				$region       = $session_address['state'];
				$postal_code  = $session_address['zip'];
				$country      = $session_address['country'];
			}
		}

		$user_data    = array();
		$address_data = array();

		if ( ! empty( $email ) ) {
			$user_data['email'] = Enhanced_Conversions::get_normalized_email( $email );
		}

		if ( ! empty( $phone_number ) ) {
			$user_data['phone_number'] = Enhanced_Conversions::get_normalized_value( $phone_number );
		}

		if ( ! empty( $first_name ) ) {
			$address_data['first_name'] = Enhanced_Conversions::get_normalized_value( $first_name );
		}

		if ( ! empty( $last_name ) ) {
			$address_data['last_name'] = Enhanced_Conversions::get_normalized_value( $last_name );
		}

		if ( ! empty( $street ) ) {
			$address_data['street'] = Enhanced_Conversions::get_normalized_value( $street );
		}

		if ( ! empty( $city ) ) {
			$address_data['city'] = Enhanced_Conversions::get_normalized_value( $city );
		}

		if ( ! empty( $region ) ) {
			// Attempt to get full region name.
			$region                 = edd_get_state_name( $user_data['address']['country'], $region );
			$address_data['region'] = Enhanced_Conversions::get_normalized_value( $region );
		}

		if ( ! empty( $postal_code ) ) {
			$address_data['postal_code'] = Enhanced_Conversions::get_normalized_value( $postal_code );
		}

		if ( ! empty( $country ) ) {
			$address_data['country'] = $country;
		}

		if ( ! empty( $address_data ) ) {
			$user_data['address'] = $address_data;
		}

		return $user_data;
	}
}
