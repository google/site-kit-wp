<?php
/**
 * Class RequireAssertionMessageSniff
 *
 * @package Google\Site_Kit\PHPCS\Sniffs\PHPUnit
 */

namespace Google\Site_Kit\PHPCS\Sniffs\PHPUnit;

use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Files\File;
use PHPUnit\Framework\Assert;
use ReflectionMethod;

/**
 * Class RequireAssertionMessageSniff
 *
 * Ensures that PHPUnit assertions include a message parameter.
 */
class RequireAssertionMessageSniff implements Sniff {

	/**
	 * List of PHPUnit assertion methods.
	 *
	 * @var array
	 */
	protected $assertion_methods = array();

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Get all methods from the Assert class and filter for assertion methods.
		$this->assertion_methods = array_filter(
			get_class_methods( Assert::class ),
			function ( $method ) {
				return 0 === strpos( $method, 'assert' );
			}
		);
	}

	/**
	 * Returns an array of tokens this test wants to listen for.
	 *
	 * @return array
	 */
	public function register() {
		return array( T_STRING );
	}

	/**
	 * Get the required number of parameters for an assertion method.
	 *
	 * @param string $method The method name.
	 * @return int The number of required parameters.
	 */
	private function get_required_assertion_params( $method ) {
		$reflection = new ReflectionMethod( Assert::class, $method );
		return $reflection->getNumberOfParameters();
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
		$tokens  = $phpcs_file->getTokens();
		$content = $tokens[ $stack_ptr ]['content'];

		// Check if the current token is an assertion method.
		if ( ! in_array( $content, $this->assertion_methods, true ) ) {
			return;
		}

		// Check if the next token is an opening parenthesis.
		$next_token = $phpcs_file->findNext( array( T_WHITESPACE ), $stack_ptr + 1, null, true );
		if ( T_OPEN_PARENTHESIS !== $tokens[ $next_token ]['code'] ) {
			return;
		}

		// Find the closing parenthesis.
		$open_parenthesis  = $next_token;
		$close_parenthesis = $tokens[ $open_parenthesis ]['parenthesis_closer'];

		// Count the number of parameters passed to the function.
		$param_count = 0;
		$current_ptr = $open_parenthesis + 1;

		while ( $current_ptr < $close_parenthesis ) {
			if ( T_COMMA === $tokens[ $current_ptr ]['code'] ) {
				++$param_count;
			}
			++$current_ptr;
		}

		// The number of parameters is the number of commas plus 1.
		++$param_count;

		// Check if the message parameter is missing.
		$required_params = $this->get_required_assertion_params( $content );
		if ( $param_count < $required_params ) {
			$phpcs_file->addError(
				'PHPUnit assertion "%s" should have a message parameter',
				$stack_ptr,
				'MissingAssertionMessage',
				array( $content )
			);
		}
	}
}
