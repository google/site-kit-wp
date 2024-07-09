<?php
/**
 * Script to prepare commit message
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// Checks if the current commit message is generated for a merge, then adds a dot at the end of the commit message.
// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents,WordPressVIPMinimum.Performance.FetchingRemoteData.FileGetContentsUnknown
$message = explode( PHP_EOL, file_get_contents( $argv[1] ) );
if ( ! empty( $message[0] ) ) {
	$tokens = preg_split( '/\s+/', trim( $message[0] ) );

	$last_index = count( $tokens ) - 1;
	if ( strtolower( $tokens[0] ) === 'merge' && ! preg_match( '/\.$/', $tokens[ $last_index ] ) ) {
		$tokens[ $last_index ] .= '.';
	}

	$message[0] = implode( ' ', $tokens );

	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents,WordPressVIPMinimum.Functions.RestrictedFunctions.file_ops_file_put_contents
	file_put_contents( $argv[1], implode( PHP_EOL, $message ) );
}
