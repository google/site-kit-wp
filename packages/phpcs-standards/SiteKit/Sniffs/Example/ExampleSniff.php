<?php
/**
 * Example Sniff
 *
 * @package   Google\Site_Kit\PHPCS
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 */

namespace Google\Site_Kit\PHPCS\Sniffs\Example;

use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Files\File;

/**
 * Example Sniff.
 *
 * This is an example sniff that you can use as a template for your own custom sniffs.
 */
class ExampleSniff implements Sniff {

	/**
	 * Returns an array of tokens this test wants to listen for.
	 *
	 * @return array
	 */
	public function register() {
		return array(
			T_STRING,
		);
	}

	/**
	 * Processes this test, when one of its tokens is encountered.
	 *
	 * @param File $phpcs_file The file being scanned.
	 * @param int  $stack_ptr  The position of the current token in the stack.
	 *
	 * @return void
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$tokens = $phpcs_file->getTokens();
		$token  = $tokens[ $stack_ptr ];

		// Example: Flag usage of a specific function.
		if ( 'example_deprecated_function' === strtolower( $token['content'] ) ) {
			$phpcs_file->addWarning(
				'The function %s is deprecated and should not be used.',
				$stack_ptr,
				'DeprecatedFunction',
				array( $token['content'] )
			);
		}
	}
}
