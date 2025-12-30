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
	 * This is automatically populated from the PHPUnit Assert class.
	 *
	 * @var array
	 */
	protected $assertion_methods = array();

	/**
	 * List of custom assertion methods.
	 *
	 * This is a list of custom assertion methods from the Site Kit codebase
	 * which must also be checked. Each method is mapped to the number of
	 * required parameters used to check if a message is passed.
	 *
	 * @var array
	 */
	protected $custom_assertion_methods = array(
		'assertArrayIntersection' => 3,
	);

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
		if ( ! in_array( $content, $this->assertion_methods, true ) && ! array_key_exists( $content, $this->custom_assertion_methods ) ) {
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
		$param_count   = 0;
		$current_ptr   = $open_parenthesis + 1;
		$nesting_level = 0;

		while ( $current_ptr < $close_parenthesis ) {
			if ( in_array( $tokens[ $current_ptr ]['code'], array( T_OPEN_PARENTHESIS, T_OPEN_SHORT_ARRAY, T_OPEN_CURLY_BRACKET ), true ) ) {
				++$nesting_level;
				if ( isset( $tokens[ $current_ptr ]['parenthesis_closer'] ) ) {
					$current_ptr = $tokens[ $current_ptr ]['parenthesis_closer'];
					--$nesting_level;
					++$current_ptr;
					continue;
				}
			} elseif ( in_array( $tokens[ $current_ptr ]['code'], array( T_CLOSE_PARENTHESIS, T_CLOSE_SHORT_ARRAY, T_CLOSE_CURLY_BRACKET ), true ) ) {
				--$nesting_level;
			} elseif ( T_COMMA === $tokens[ $current_ptr ]['code'] && 0 === $nesting_level ) {
				// Only count commas at the top level of the function call.
				++$param_count;
			}
			++$current_ptr;
		}

		// The number of parameters is the number of top-level commas plus 1.
		++$param_count;

		// Determine the required number of parameters for the assertion method.
		if ( array_key_exists( $content, $this->custom_assertion_methods ) ) {
			$required_params = $this->custom_assertion_methods[ $content ];
		} else {
			$required_params = $this->get_required_assertion_params( $content );
		}

		// Check if the message parameter is missing.
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
