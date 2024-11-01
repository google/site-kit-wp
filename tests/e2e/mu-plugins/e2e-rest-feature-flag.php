<?php
/**
 * Plugin Name: E2E Feature Flag Endpoint
 * Description: REST Endpoint for controlling Feature Flag activation during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Cron;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Util\Feature_Flags;

add_filter(
	'schedule_event',
	function ( $event ) {
		if ( Remote_Features_Cron::CRON_ACTION === $event->hook ) {
			return false;
		}

		return $event;
	}
);

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/feature/set-flag',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function ( WP_REST_Request $request ) {
					$feature_flag_overrides = get_option( 'googlesitekit_e2e_feature_flags', array() );

					if ( $request['feature_value'] ) {
						$feature_flag_overrides[ $request['feature_name'] ] = (bool) $request['feature_value'];
					} else {
						unset( $feature_flag_overrides[ $request['feature_name'] ] );
					}

					update_option( 'googlesitekit_e2e_feature_flags', $feature_flag_overrides );

					return array(
						'success' => true,
					);
				},
				'permission_callback' => '__return_true',
			)
		);
	},
	0
);

// Enforce feature activation as defined by the E2E feature flags option.
add_filter(
	'googlesitekit_is_feature_enabled',
	function ( $feature_enabled, $feature_name ) {
		$features = get_option( 'googlesitekit_e2e_feature_flags', array() );

		return ! empty( $features[ $feature_name ] );
	},
	999,
	2
);
