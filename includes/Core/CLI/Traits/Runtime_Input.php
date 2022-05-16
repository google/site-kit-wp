<?php
/**
 * Trait Google\Site_Kit\Core\CLI\Traits\Runtime_Input
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI\Traits;

use WP_CLI;

/**
 * Trait for runtime input helper methods.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Runtime_Input {

	/**
	 * Prompts the user with a yes or no question.
	 *
	 * Based on \WP_CLI::confirm without using `exit`.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $question The question to prompt the user with.
	 * @throws WP_CLI\ExitException Thrown if the question does not receive an affirmative ('y') answer.
	 */
	protected function confirm( $question ) {
		fwrite( STDOUT, $question . ' [y/N] ' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fwrite,WordPressVIPMinimum.Functions.RestrictedFunctions.file_ops_fwrite

		$answer = fgets( STDIN );

		if ( 'y' !== strtolower( trim( $answer ) ) ) {
			throw new WP_CLI\ExitException();
		}
	}
}
