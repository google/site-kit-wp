<?php
/**
 * Plugin Name: E2E Tests Email Reporting Plugin
 * Description: Intercepts Google API calls with fixture data and exposes a REST endpoint to run the email pipeline synchronously.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;

add_filter(
	'googlesitekit_is_feature_enabled',
	function ( $enabled, $feature ) {
		if ( 'proactiveUserEngagement' === $feature ) {
			return true;
		}
		return $enabled;
	},
	999,
	2
);

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/email-reporting/trigger-cron',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'permission_callback' => '__return_true',
				'callback'            => function ( WP_REST_Request $request ) {
					$frequency = $request->get_param( 'frequency' );
					if ( empty( $frequency ) ) {
						return new WP_Error(
							'missing_frequency',
							'Frequency is required.',
							array( 'status' => 400 )
						);
					}

					// Trigger the initiator action which creates the batch.
					do_action_ref_array( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency ) );

					// Get the batch ID from the database.
					$batch_id = get_batch_id_from_database( $frequency );
					if ( ! $batch_id ) {
						return new WP_Error(
							'batch_id_not_found',
							'Batch ID not found in database.',
							array( 'status' => 500 )
						);
					}

					// Trigger the worker action with the retrieved batch ID.
					do_action_ref_array( Email_Reporting_Scheduler::ACTION_WORKER, array( $batch_id, $frequency, time() ) );

					return array( 'success' => true );
				},
			)
		);
	}
);

function get_batch_id_from_database( $frequency ) {
	$posts = get_posts(
		array(
			'post_type'      => Email_Log::POST_TYPE,
			'post_status'    => Email_Log::STATUS_SCHEDULED,
			'meta_key'       => Email_Log::META_REPORT_FREQUENCY,
			'meta_value'     => $frequency,
			'posts_per_page' => 1,
			'orderby'        => 'ID',
			'order'          => 'DESC',
			'fields'         => 'ids',
		)
	);

	if ( empty( $posts ) ) {
		return false;
	}

	$batch_id = get_post_meta( $posts[0], Email_Log::META_BATCH_ID, true );
	return $batch_id ?: false;
}
