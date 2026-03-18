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
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;

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

					add_filter(
						'googlesitekit_email_reporting_batch_id',
						function () {
							return 'test-batch-id';
						}
					);

					do_action_ref_array( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency ) );
					do_action_ref_array( Email_Reporting_Scheduler::ACTION_WORKER, array( 'test-batch-id', $frequency, time() ) );

					return array( 'success' => true );
				},
			)
		);
	}
);
