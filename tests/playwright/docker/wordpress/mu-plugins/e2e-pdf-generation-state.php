<?php
/**
 * Plugin Name: E2E PDF Generation State
 * Description: Applies the Key Metrics selection and Analytics audiences a test declares via the `withKeyMetrics()` / `withAudiences()` annotations, so the PDF export tests render deterministic sections.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

const E2E_KEY_METRICS_COOKIE = '_wp_test_key_metrics';
const E2E_AUDIENCES_COOKIE   = '_wp_test_audiences';

/**
 * Decodes a JSON array from one of this plugin's cookies.
 *
 * @param string $cookie_name Cookie name.
 * @return array Decoded array, or an empty array when absent or malformed.
 */
function e2e_pdf_generation_decode_cookie( $cookie_name ) {
	if ( empty( $_COOKIE[ $cookie_name ] ) ) {
		return array();
	}

	$decoded = json_decode(
		rawurldecode( wp_unslash( $_COOKIE[ $cookie_name ] ) ),
		true
	);

	return is_array( $decoded ) ? $decoded : array();
}

add_action(
	'init',
	function () {
		$key_metrics = e2e_pdf_generation_decode_cookie( E2E_KEY_METRICS_COOKIE );
		$audiences   = e2e_pdf_generation_decode_cookie( E2E_AUDIENCES_COOKIE );

		// Only the PDF export tests declare this state; skip the admin lookup on
		// every other request in the suite.
		if ( empty( $key_metrics ) && empty( $audiences ) ) {
			return;
		}

		$admin = get_user_by( 'login', 'admin' );
		if ( ! $admin ) {
			return;
		}

		if ( ! empty( $key_metrics ) ) {
			update_user_option(
				$admin->ID,
				'googlesitekit_key_metrics_settings',
				array(
					'widgetSlugs'    => array_values(
						array_filter( $key_metrics, 'is_string' )
					),
					'isWidgetHidden' => false,
				)
			);
		}

		if ( ! empty( $audiences ) ) {
			update_option(
				'googlesitekit_analytics-4_audience_settings',
				array(
					'availableAudiences'                   => $audiences,
					// Kept current against the wall clock the frontend's one-hour
					// freshness check reads (a real `Date.now()`, not the fixed
					// reference date), so the dashboard treats these audiences as
					// already synced and skips the unmocked Analytics Admin sync.
					'availableAudiencesLastSyncedAt'       => time(),
					'audienceSegmentationSetupCompletedBy' => $admin->ID,
				)
			);

			$configured_audiences = array_values(
				array_filter(
					array_map(
						function ( $audience ) {
							return isset( $audience['name'] )
								? $audience['name']
								: null;
						},
						$audiences
					)
				)
			);

			update_user_option(
				$admin->ID,
				'googlesitekit_audience_settings',
				array(
					'configuredAudiences'                => $configured_audiences,
					'isAudienceSegmentationWidgetHidden' => false,
					'didSetAudiences'                    => true,
				)
			);
		}
	}
);
