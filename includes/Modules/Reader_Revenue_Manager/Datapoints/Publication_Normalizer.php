<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Publication_Normalizer
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit_Dependencies\Google\Model;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication;

/**
 * Normalizes Web Content Publisher publication resources to the legacy data model.
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
	 * @return Publication Normalized publication resource.
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
		self::normalize_verified_domains( $publication );

		return new Publication( $publication );
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
			$status['contentPolicyState'] = 0 === strpos( $status['state'], 'CONTENT_POLICY_' )
				? $status['state']
				: 'CONTENT_POLICY_' . $status['state'];
		}

		if ( isset( $status['policyInfoUrl'] ) ) {
			$status['policyInfoLink'] = $status['policyInfoUrl'];
		}

		$publication['contentPolicyStatus'] = $status;
	}

	/**
	 * Normalizes verified domain resources to the legacy URL list.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $publication Publication data.
	 */
	private static function normalize_verified_domains( array &$publication ) {
		$domains = array();

		if ( ! empty( $publication['primaryDomain'] ) ) {
			$domains[] = $publication['primaryDomain'];
		}

		if ( ! empty( $publication['additionalDomains'] ) && is_array( $publication['additionalDomains'] ) ) {
			$domains = array_merge( $domains, $publication['additionalDomains'] );
		}

		$verified_domains = array();
		foreach ( $domains as $domain ) {
			$domain = (array) $domain;
			if ( ! empty( $domain['ownershipVerified'] ) && ! empty( $domain['url'] ) ) {
				$verified_domains[] = $domain['url'];
			}
		}

		if ( ! empty( $verified_domains ) ) {
			$publication['verifiedDomains'] = $verified_domains;
		}
	}
}
