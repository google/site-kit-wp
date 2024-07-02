<?php
/**
 * Plugin Name: E2E Survey Trigger Interception
 * Description: REST Endpoint for bypassing survey trigger requests to the Site Kit service during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'core/user/data/survey-trigger',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function () {
					return array(
						'session'                    => null,
						'survey_payload'             => null,
						'no_available_survey_reason' => 'The available survey has already been completed or dismissed.',
						'survey_id'                  => '',
					);
				},
				'permission_callback' => '__return_true',
			),
			true
		);
	},
	0
);
