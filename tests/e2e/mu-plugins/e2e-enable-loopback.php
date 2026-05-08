<?php
/**
 * Plugin Name: E2E Enable Loopback
 * Description: MU plugin for ensuring WordPress can make HTTP requests to itself during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
add_filter(
	'pre_http_request',
	function ( $preempt, $args, $url ) {
		if ( 'localhost' === parse_url( $url, PHP_URL_HOST ) && parse_url( $url, PHP_URL_PORT ) ) {
			$args['headers'] = array_merge(
				$args['headers'],
				array( 'Host' => 'localhost:' . parse_url( $url, PHP_URL_PORT ) )
			);

			// Split the URL by the port, but only once.
			list( $http_host, $path ) = preg_split( '/:\d+/', $url, 2 );

			// Return the response from the altered request to the same URL, without the port.
			return wp_remote_request( $http_host . $path, $args );
		}
		return $preempt;
	},
	10,
	3
);
