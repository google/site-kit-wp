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
		$events = array( 'add_to_cart' );
		
		// Only include purchase event if Enhanced Conversions feature flag is enabled
		if ( Feature_Flags::enabled( 'gtagUserData' ) ) {
			$events[] = 'purchase';
		}
		
		return $events;
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
	 * Registers hooks for Enhanced Conversions user data extraction.
	 *
	 * @since n.e.x.t
	 */
	public function register_hooks() {
		// Only register Enhanced Conversions hooks if feature flag is enabled
		if ( Feature_Flags::enabled( 'gtagUserData' ) ) {
			add_action(
				'wp_footer',
				function () {
					$script_slug = 'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG;

					$events_to_track = $this->get_event_names();

					$inline_script = join(
						"\n",
						array(
							'window._googlesitekit.edddata = window._googlesitekit.edddata || {};',
							sprintf( 'window._googlesitekit.edddata.eventsToTrack = %s;', wp_json_encode( $events_to_track ) ),
						)
					);

					// Check if we're on EDD purchase completion page and add purchase data using session
					$this->maybe_add_purchase_data_from_session( $inline_script );

					wp_add_inline_script( $script_slug, $inline_script, 'before' );
				}
			);
		}
	}

	/**
	 * Checks if we're on EDD purchase completion page and adds purchase data from session.
	 *
	 * @since n.e.x.t
	 *
	 * @param string &$inline_script Reference to the inline script being built.
	 */
	protected function maybe_add_purchase_data_from_session( &$inline_script ) {
		// Check if we're on EDD completion page
		if ( ! function_exists( 'edd_is_success_page' ) || ! edd_is_success_page() ) {
			return;
		}

		// Check if edd_get_purchase_session function exists
		if ( ! function_exists( 'edd_get_purchase_session' ) ) {
			return;
		}

		// Get purchase session data
		$session_data = edd_get_purchase_session();
		
		if ( ! $session_data ) {
			return;
		}

		// Try to extract user data from session
		$purchase_user_data = $this->get_enhanced_conversions_data_from_session( $session_data );

		if ( ! $purchase_user_data ) {
			return;
		}

		// Add user data to the inline script
		$inline_script .= "\n" . sprintf( 'window._googlesitekit.edddata.purchase = %s;', wp_json_encode( $purchase_user_data ) );
	}

	/**
	 * Gets Enhanced Conversions data from EDD purchase session.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $session_data The EDD purchase session data.
	 * @return array Enhanced Conversions data with 'user_data' key or empty array.
	 */
	protected function get_enhanced_conversions_data_from_session( $session_data ) {
		if ( ! Feature_Flags::enabled( 'gtagUserData' ) ) {
			return array();
		}

		$user_data = $this->extract_user_data_from_session( $session_data );
		
		if ( ! empty( $user_data ) ) {
			return array( 'user_data' => $user_data );
		}

		return array();
	}

	/**
	 * Extracts and normalizes user data from EDD purchase session for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $session_data The EDD purchase session data.
	 * @return array Normalized user data or empty array if no supported fields are available.
	 */
	protected function extract_user_data_from_session( $session_data ) {
		$user_data = array();

		if ( ! is_array( $session_data ) ) {
			return $user_data;
		}


		// Extract email from session data
		$email = '';
		if ( isset( $session_data['email'] ) ) {
			$email = $session_data['email'];
		} elseif ( isset( $session_data['user_email'] ) ) {
			$email = $session_data['user_email'];
		} elseif ( isset( $session_data['purchase_data']['user_email'] ) ) {
			$email = $session_data['purchase_data']['user_email'];
		} elseif ( isset( $session_data['user_info']['email'] ) ) {
			$email = $session_data['user_info']['email'];
		}

		if ( ! empty( $email ) ) {
			$user_data['email'] = Enhanced_Conversions::get_normalized_email( $email );
		}

		// Extract phone number from session data - it's stored in user_info->address->phone
		if ( isset( $session_data['user_info']['address']['phone'] ) && ! empty( $session_data['user_info']['address']['phone'] ) ) {
			$phone = $session_data['user_info']['address']['phone'];
			$user_data['phone_number'] = Enhanced_Conversions::get_normalized_value( $phone );
			error_log( 'Site Kit EDD: Found phone number: ' . $phone . ' -> normalized: ' . $user_data['phone_number'] );
		}

		// Extract user info from session data
		$user_info = array();
		if ( isset( $session_data['user_info'] ) ) {
			$user_info = $session_data['user_info'];
		} elseif ( isset( $session_data['purchase_data']['user_info'] ) ) {
			$user_info = $session_data['purchase_data']['user_info'];
		}

		if ( ! empty( $user_info ) && is_array( $user_info ) ) {
			$address_data = array();

			// Extract name fields
			if ( isset( $user_info['first_name'] ) && ! empty( $user_info['first_name'] ) ) {
				$address_data['first_name'] = Enhanced_Conversions::get_normalized_value( $user_info['first_name'] );
			}

			if ( isset( $user_info['last_name'] ) && ! empty( $user_info['last_name'] ) ) {
				$address_data['last_name'] = Enhanced_Conversions::get_normalized_value( $user_info['last_name'] );
			}

			// Extract address information if available
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

			// Only include address if it has at least one field
			if ( ! empty( $address_data ) ) {
				$user_data['address'] = $address_data;
			}
		}

		return $user_data;
	}
}
