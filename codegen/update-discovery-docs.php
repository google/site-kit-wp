<?php
/**
 * Utility for adding/updating discovery docs for each API.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable WordPress.WP.AlternativeFunctions
 * phpcs:disable WordPressVIPMinimum
 */

$apis = json_decode( file_get_contents( __DIR__ . '/apis.json' ) );

foreach ( $apis as list( $name, $version ) ) {
	$response = file_get_contents( "https://$name.googleapis.com/\$discovery/rest?version=$version" );
	file_put_contents( __DIR__ . "/apis/$name.$version.json", $response );
}
