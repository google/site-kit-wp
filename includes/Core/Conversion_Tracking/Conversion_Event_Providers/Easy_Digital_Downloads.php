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
	 * Registers hooks for user data extraction.
	 *
	 * @since n.e.x.t
	 */
	public function register_hooks() {
		// Only register Enhanced Conversions hooks if feature flag is enabled
		if ( Feature_Flags::enabled( 'gtagUserData' ) ) {
			// PREVIOUS APPROACH: edd_complete_purchase + transient storage
			// Commented out to test edd_get_purchase_session() approach
			/*
			add_action(
				'edd_complete_purchase',
				fn( $payment_id ) => $this->maybe_add_purchase_inline_script( $payment_id ),
				10,
				1
			);
			*/

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

					// NEW APPROACH: Check if we're on an EDD purchase completion page and add purchase data using session
					$this->maybe_add_purchase_data_from_session( $inline_script );

					wp_add_inline_script( $script_slug, $inline_script, 'before' );
				}
			);
		}
	}

	// PREVIOUS APPROACH: Transient-based data storage (commented out)
	/*
	/**
	 * Adds purchase inline script for EDD (like WooCommerce).
	 *
	 * @since n.e.x.t
	 *
	 * @param int $payment_id The EDD payment ID.
	 */
	/*
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
	*/

	// PREVIOUS APPROACH: Transient-based completion page data retrieval (commented out)
	/*
	/**
	 * Checks if we're on EDD purchase completion page and adds purchase data.
	 *
	 * @since n.e.x.t
	 *
	 * @param string &$inline_script Reference to the inline script being built.
	 */
	/*
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
	*/

	/**
	 * NEW APPROACH: Checks if we're on EDD purchase completion page and adds purchase data from session.
	 *
	 * @since n.e.x.t
	 *
	 * @param string &$inline_script Reference to the inline script being built.
	 */
	protected function maybe_add_purchase_data_from_session( &$inline_script ) {
		// Check if we're on EDD completion page
		$is_edd_completion = function_exists( 'edd_is_success_page' ) && edd_is_success_page();

		if ( ! $is_edd_completion ) {
			error_log( 'Site Kit EDD: Not on purchase completion page, skipping session data retrieval' );
			return;
		}

		// Check if edd_get_purchase_session function exists
		if ( ! function_exists( 'edd_get_purchase_session' ) ) {
			error_log( 'Site Kit EDD: edd_get_purchase_session function not available' );
			return;
		}

		// Get purchase session data
		$session_data = edd_get_purchase_session();
		
		if ( ! $session_data ) {
			error_log( 'Site Kit EDD: No purchase session data available' );
			return;
		}

		error_log( 'Site Kit EDD: Purchase session data retrieved: ' . print_r( $session_data, true ) );

		// Try to extract user data from session
		$purchase_user_data = $this->get_enhanced_conversions_data_from_session( $session_data );

		if ( ! $purchase_user_data ) {
			error_log( 'Site Kit EDD: No Enhanced Conversions data extracted from session' );
			return;
		}

		// Add user data to the inline script
		$inline_script .= "\n" . sprintf( 'window._googlesitekit.edddata.purchase = %s;', wp_json_encode( $purchase_user_data ) );
		$inline_script .= "\n" . 'console.log("✅ EDD Enhanced Conversions user data added from session:", window._googlesitekit.edddata.purchase);';
		
		error_log( 'Site Kit EDD: Enhanced Conversions data added to client from session: ' . print_r( $purchase_user_data, true ) );
	}

	// PREVIOUS APPROACH: Payment meta based data extraction (commented out)
	/*
	/**
	 * Gets Enhanced Conversions data for purchase.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $payment_meta The EDD payment metadata.
	 * @return array Enhanced Conversions data with 'user_data' key or empty array.
	 */
	/*
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
	*/

	// PREVIOUS APPROACH: Payment meta based data extraction (commented out)
	/*
	/**
	 * Extracts and normalizes user data from EDD payment for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $payment_meta The EDD payment metadata.
	 * @return array Normalized user data or empty array if no supported fields are available.
	 */
	/*
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
	*/

	/**
	 * NEW APPROACH: Gets Enhanced Conversions data from EDD purchase session.
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
			error_log( 'Site Kit EDD: Session data is not an array: ' . print_r( $session_data, true ) );
			return $user_data;
		}

		// Log session data structure for debugging
		error_log( 'Site Kit EDD: Analyzing session data structure: ' . print_r( array_keys( $session_data ), true ) );

		// Try to find email in various possible locations within session data
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
			error_log( 'Site Kit EDD: Found email in session: ' . $email );
		}

		// Try to find user info in various possible locations
		$user_info = array();
		if ( isset( $session_data['user_info'] ) ) {
			$user_info = $session_data['user_info'];
		} elseif ( isset( $session_data['purchase_data']['user_info'] ) ) {
			$user_info = $session_data['purchase_data']['user_info'];
		}

		if ( ! empty( $user_info ) && is_array( $user_info ) ) {
			error_log( 'Site Kit EDD: Found user_info in session: ' . print_r( $user_info, true ) );
			
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

		error_log( 'Site Kit EDD: Extracted user data from session: ' . print_r( $user_data, true ) );

		// Return user data only if it contains at least one supported field
		return $user_data;
	}
}
