<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit_Dependencies\Google\Model;

/**
 * Normalizes Web Content Publisher publication resources for existing consumers.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Publication_Normalizer {

	/**
	 * Normalizes a publication resource.
	 *
	 * @since n.e.x.t
	 *
	 * @param Model|array $publication Publication resource.
	 * @return array Normalized publication resource.
	 */
	public static function normalize( $publication ) {
		if ( $publication instanceof Model ) {
			$publication = json_decode( wp_json_encode( $publication->toSimpleObject() ), true );
		}

		$publication = (array) $publication;

		self::normalize_onboarding_state( $publication );
		self::normalize_products( $publication );
		self::normalize_payment_options( $publication );
		self::normalize_content_policy_status( $publication );

		return $publication;
	}

	/**
	 * Normalizes onboarding state values.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $publication Publication data.
	 */
	private static function normalize_onboarding_state( array &$publication ) {
		if ( empty( $publication['onboardingState'] ) ) {
			return;
		}

		$state_map = array(
			'ACTION_REQUIRED' => 'ONBOARDING_ACTION_REQUIRED',
			'COMPLETE'        => 'ONBOARDING_COMPLETE',
		);

		if ( isset( $state_map[ $publication['onboardingState'] ] ) ) {
			$publication['onboardingState'] = $state_map[ $publication['onboardingState'] ];
		}
	}

	/**
	 * Normalizes product strings to legacy product resources.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $publication Publication data.
	 */
	private static function normalize_products( array &$publication ) {
		if ( empty( $publication['products'] ) || ! is_array( $publication['products'] ) ) {
			return;
		}

		$publication['products'] = array_map(
			function ( $product ) {
				return is_string( $product ) ? array( 'name' => $product ) : $product;
			},
			$publication['products']
		);
	}

	/**
	 * Normalizes the payment option enum to the legacy payment options object.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $publication Publication data.
	 */
	private static function normalize_payment_options( array &$publication ) {
		if ( empty( $publication['paymentOption'] ) ) {
			return;
		}

		$payment_option_map = array(
			'CONTRIBUTIONS' => 'contributions',
			'NONE'          => 'noPayment',
			'SUBSCRIPTIONS' => 'subscriptions',
		);

		if ( isset( $payment_option_map[ $publication['paymentOption'] ] ) ) {
			$publication['paymentOptions'] = array(
				$payment_option_map[ $publication['paymentOption'] ] => true,
			);
		}

		unset( $publication['paymentOption'] );
	}

	/**
	 * Normalizes content policy status keys and values.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $publication Publication data.
	 */
	private static function normalize_content_policy_status( array &$publication ) {
		if ( empty( $publication['contentPolicyStatus'] ) ) {
			return;
		}

		$status = (array) $publication['contentPolicyStatus'];

		if ( isset( $status['state'] ) ) {
			if ( 'OK' === $status['state'] ) {
				$status['contentPolicyState'] = 'CONTENT_POLICY_STATE_OK';
			} else {
				$status['contentPolicyState'] = 0 === strpos( $status['state'], 'CONTENT_POLICY_' )
					? $status['state']
					: 'CONTENT_POLICY_' . $status['state'];
			}

			unset( $status['state'] );
		}

		if ( isset( $status['policyInfoUrl'] ) ) {
			$status['policyInfoLink'] = $status['policyInfoUrl'];
			unset( $status['policyInfoUrl'] );
		}

		$publication['contentPolicyStatus'] = $status;
	}
}
