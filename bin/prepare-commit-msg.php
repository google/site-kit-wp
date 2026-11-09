<?php
/**
 * Script to prepare commit message
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// Husky passes all hook arguments as one space-separated string: the message file path,
// then the message source and commit SHA when Git provides them. The path can contain
// spaces, so drop trailing words until the remainder names an existing file.
$message_file = isset( $argv[1] ) ? $argv[1] : '';
while ( ! file_exists( $message_file ) && false !== strrpos( $message_file, ' ' ) ) {
	$message_file = substr( $message_file, 0, strrpos( $message_file, ' ' ) );
}

if ( ! file_exists( $message_file ) ) {
	exit( 0 );
}

// Checks if the current commit message is generated for a merge, then adds a dot at the end of the commit message.
// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents,WordPressVIPMinimum.Performance.FetchingRemoteData.FileGetContentsUnknown
$message = explode( PHP_EOL, file_get_contents( $message_file ) );
if ( ! empty( $message[0] ) ) {
	$tokens = preg_split( '/\s+/', trim( $message[0] ) );

	$last_index = count( $tokens ) - 1;
	if ( strtolower( $tokens[0] ) === 'merge' && ! preg_match( '/\.$/', $tokens[ $last_index ] ) ) {
		$tokens[ $last_index ] .= '.';
	}

	$message[0] = implode( ' ', $tokens );

	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents,WordPressVIPMinimum.Functions.RestrictedFunctions.file_ops_file_put_contents
	file_put_contents( $message_file, implode( PHP_EOL, $message ) );
}
