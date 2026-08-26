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
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Publication_Normalizer {

	/**
	 * Normalizes a publication resource.
	 *
	 * @since 1.186.0
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
	 * Maps a WCP onboarding state to the value persisted in settings.
	 *
	 * @since 1.186.0
	 *
	 * @param string $onboarding_state WCP onboarding state.
	 * @return string Settings onboarding state.
	 */
	public static function map_onboarding_state( $onboarding_state ) {
		$state_map = array(
			'ACTION_REQUIRED' => Settings::ONBOARDING_STATE_ACTION_REQUIRED,
			'COMPLETE'        => Settings::ONBOARDING_STATE_COMPLETE,
		);

		return $state_map[ $onboarding_state ] ?? $onboarding_state;
	}

	/**
	 * Maps a WCP payment option enum to the value persisted in settings.
	 *
	 * @since 1.186.0
	 *
	 * @param string $payment_option WCP payment option.
	 * @return string Settings payment option.
	 */
	public static function map_payment_option( $payment_option ) {
		$payment_option_map = array(
			'CONTRIBUTIONS' => 'contributions',
			'NONE'          => 'noPayment',
			'SUBSCRIPTIONS' => 'subscriptions',
		);

		return $payment_option_map[ $payment_option ] ?? '';
	}

	/**
	 * Maps a WCP content policy state to the value persisted in settings.
	 *
	 * @since 1.186.0
	 *
	 * @param string $state WCP content policy state.
	 * @return string Settings content policy state.
	 */
	public static function map_content_policy_state( $state ) {
		if ( 'OK' === $state ) {
			return 'CONTENT_POLICY_STATE_OK';
		}

		return 0 === strpos( $state, 'CONTENT_POLICY_' )
			? $state
			: 'CONTENT_POLICY_' . $state;
	}

	/**
	 * Normalizes onboarding state values.
	 *
	 * @since 1.186.0
	 *
	 * @param array $publication Publication data.
	 */
	private static function normalize_onboarding_state( array &$publication ) {
		if ( empty( $publication['onboardingState'] ) ) {
			return;
		}

		$publication['onboardingState'] = self::map_onboarding_state(
			$publication['onboardingState']
		);
	}

	/**
	 * Normalizes product strings to legacy product resources.
	 *
	 * @since 1.186.0
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
	 * @since 1.186.0
	 *
	 * @param array $publication Publication data.
	 */
	private static function normalize_payment_options( array &$publication ) {
		if ( empty( $publication['paymentOption'] ) ) {
			return;
		}

		$payment_option = self::map_payment_option( $publication['paymentOption'] );

		if ( ! empty( $payment_option ) ) {
			$publication['paymentOptions'] = array(
				$payment_option => true,
			);
		}

		unset( $publication['paymentOption'] );
	}

	/**
	 * Normalizes content policy status keys and values.
	 *
	 * @since 1.186.0
	 *
	 * @param array $publication Publication data.
	 */
	private static function normalize_content_policy_status( array &$publication ) {
		if ( empty( $publication['contentPolicyStatus'] ) ) {
			return;
		}

		$status = (array) $publication['contentPolicyStatus'];

		if ( isset( $status['state'] ) ) {
			$status['contentPolicyState'] = self::map_content_policy_state( $status['state'] );
			unset( $status['state'] );
		}

		if ( isset( $status['policyInfoUrl'] ) ) {
			$status['policyInfoLink'] = $status['policyInfoUrl'];
			unset( $status['policyInfoUrl'] );
		}

		$publication['contentPolicyStatus'] = $status;
	}
}
