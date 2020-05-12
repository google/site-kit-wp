<?php
/**
 * Plugin Name: E2E Enable Loopback
 * Description: Plugin to filter http requests to remove the port.
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
add_filter(
	'pre_http_request',
	function ( $preempt, $args, $url ) {
		if ( 'localhost' === parse_url( $url, PHP_URL_HOST ) && 9002 === parse_url( $url, PHP_URL_PORT ) ) {
			$args['headers'] = wp_parse_args( array( 'Host' => $url ), $args['headers'] );
			$no_port_url     = str_replace( ':9002', '', $url );
			$preempt         = wp_remote_request( $no_port_url, $args );
		}
		return $preempt;
	},
	10,
	3 
);
