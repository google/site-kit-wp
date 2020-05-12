<?php
/**
 * Plugin Name: Fake AMP Responses
 * Description: Plugin to filter AMP HTTP responses to return without errors.
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
add_filter(
	'http_response',
	function( $response, $parsed_args, $url ) {
		if ( false !== strpos( $url, 'amp_validate' ) ) {
			return array(
				'body'     => wp_json_encode( array( 'results' => array() ) ),
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
			);
		}
		return $response;
	},
	10,
	3
);
