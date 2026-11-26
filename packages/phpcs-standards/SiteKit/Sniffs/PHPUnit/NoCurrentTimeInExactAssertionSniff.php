<?php
/**
 * Class NoCurrentTimeInExactAssertionSniff
 *
 * @package Google\Site_Kit\PHPCS\Sniffs\PHPUnit
 */

namespace Google\Site_Kit\PHPCS\Sniffs\PHPUnit;

use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Util\Tokens;

/**
 * Class NoCurrentTimeInExactAssertionSniff
 *
 * Ensures that the expected value of an exact PHPUnit assertion does not read the current time.
 *
 * A test that reads the current time once for the actual value and again for the expected
 * value fails at random when the clock moves to the next second between the two calls.
 */
class NoCurrentTimeInExactAssertionSniff implements Sniff {

	/**
	 * Exact assertion methods whose expected value is checked.
	 *
	 * @var array
	 */
	protected $assertion_methods = array(
		'assertEquals',
		'assertSame',
		'assertNotEquals',
		'assertNotSame',
	);

	/**
	 * Functions that always read the current time.
	 *
	 * @var array
	 */
	protected $time_functions = array(
		'time',
		'microtime',
		'current_time',
	);

	/**
	 * Functions that read the current time when called without a timestamp argument.
	 *
	 * @var array
	 */
	protected $date_functions = array(
		'date',
		'gmdate',
	);

	/**
	 * Tokens that carry no code, such as whitespace and comments.
	 *
	 * @var array
	 */
	protected $empty_tokens = array();

	/**
	 * Constructor.
	 */
	public function __construct() {
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- The property is defined by PHPCS.
		$this->empty_tokens = Tokens::$emptyTokens;
	}

	/**
	 * Returns an array of tokens this test wants to listen for.
	 *
	 * @return array Token types to listen for.
	 */
	public function register() {
		return array( T_STRING );
	}

	/**
	 * Processes this test, when one of its tokens is encountered.
	 *
	 * @param File $phpcs_file The file being scanned.
	 * @param int  $stack_ptr  The position of the current token in the stack.
	 *
	 * @return void Errors are emitted on the file directly.
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$tokens    = $phpcs_file->getTokens();
		$assertion = $tokens[ $stack_ptr ]['content'];

		if ( ! in_array( $assertion, $this->assertion_methods, true ) ) {
			return;
		}

		$open_parenthesis = $phpcs_file->findNext( $this->empty_tokens, $stack_ptr + 1, null, true );
		if ( false === $open_parenthesis || T_OPEN_PARENTHESIS !== $tokens[ $open_parenthesis ]['code'] ) {
			return;
		}

		$arguments = $this->get_arguments( $tokens, $open_parenthesis );
		if ( empty( $arguments ) ) {
			return;
		}

		// Only the expected value, which is the first argument, is checked.
		list( $start, $end ) = $arguments[0];

		for ( $ptr = $start; $ptr <= $end; $ptr++ ) {
			if ( T_STRING !== $tokens[ $ptr ]['code'] ) {
				continue;
			}

			$function_name = strtolower( $tokens[ $ptr ]['content'] );
			if ( ! $this->is_global_function_call( $phpcs_file, $ptr ) ) {
				continue;
			}

			if ( ! $this->reads_current_time( $phpcs_file, $ptr, $function_name ) ) {
				continue;
			}

			$phpcs_file->addError(
				'Do not call %s() in the expected value of "%s", because the time can change between calls. Capture the time once in a variable and reuse it, or assert that the value is within a range.',
				$ptr,
				'CurrentTimeInExactAssertion',
				array( $function_name, $assertion )
			);
		}
	}

	/**
	 * Checks whether a function call reads the current time.
	 *
	 * @param File   $phpcs_file    The file being scanned.
	 * @param int    $ptr           The position of the function name token.
	 * @param string $function_name The lowercase function name.
	 * @return bool True if the call reads the current time, false otherwise.
	 */
	private function reads_current_time( File $phpcs_file, $ptr, $function_name ) {
		if ( in_array( $function_name, $this->time_functions, true ) ) {
			return true;
		}

		if ( ! in_array( $function_name, $this->date_functions, true ) && 'strtotime' !== $function_name ) {
			return false;
		}

		$tokens           = $phpcs_file->getTokens();
		$open_parenthesis = $phpcs_file->findNext( $this->empty_tokens, $ptr + 1, null, true );
		$arguments        = $this->get_arguments( $tokens, $open_parenthesis );

		// With a second argument, date(), gmdate() and strtotime() use the given timestamp.
		if ( 1 !== count( $arguments ) ) {
			return false;
		}

		if ( 'strtotime' !== $function_name ) {
			return true;
		}

		// An absolute date such as '2024-01-01' does not depend on the current time.
		list( $start, $end ) = $arguments[0];
		$first               = $phpcs_file->findNext( $this->empty_tokens, $start, $end + 1, true );
		$last                = $phpcs_file->findPrevious( $this->empty_tokens, $end, $start - 1, true );

		if ( $first === $last && T_CONSTANT_ENCAPSED_STRING === $tokens[ $first ]['code'] ) {
			$value = substr( $tokens[ $first ]['content'], 1, -1 );
			return ! preg_match( '/^\d{4}/', $value );
		}

		return true;
	}

	/**
	 * Checks whether a T_STRING token is a call to a global function.
	 *
	 * Method calls, static calls, declarations and calls with a namespace prefix other than a
	 * single leading backslash are not global function calls.
	 *
	 * @param File $phpcs_file The file being scanned.
	 * @param int  $ptr        The position of the T_STRING token.
	 * @return bool True if the token is a global function call, false otherwise.
	 */
	private function is_global_function_call( File $phpcs_file, $ptr ) {
		$tokens = $phpcs_file->getTokens();

		$next = $phpcs_file->findNext( $this->empty_tokens, $ptr + 1, null, true );
		if ( false === $next || T_OPEN_PARENTHESIS !== $tokens[ $next ]['code'] ) {
			return false;
		}

		$prev = $phpcs_file->findPrevious( $this->empty_tokens, $ptr - 1, null, true );
		if ( false === $prev ) {
			return true;
		}

		// The nullsafe operator is matched by type, as its constant does not exist before PHP 8.0.
		$non_global = array( T_OBJECT_OPERATOR, T_DOUBLE_COLON, T_FUNCTION, T_NEW );
		if ( in_array( $tokens[ $prev ]['code'], $non_global, true ) || 'T_NULLSAFE_OBJECT_OPERATOR' === $tokens[ $prev ]['type'] ) {
			return false;
		}

		if ( T_NS_SEPARATOR === $tokens[ $prev ]['code'] ) {
			// A leading backslash is allowed, but a namespace prefix such as Foo\time() is not.
			$before = $phpcs_file->findPrevious( $this->empty_tokens, $prev - 1, null, true );
			if ( false !== $before && in_array( $tokens[ $before ]['code'], array( T_STRING, T_NAMESPACE ), true ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Gets the token ranges of the arguments of a function call.
	 *
	 * Arguments are split on top-level commas, so commas inside nested calls, arrays and
	 * closures are ignored.
	 *
	 * @param array $tokens           The file tokens.
	 * @param int   $open_parenthesis The position of the opening parenthesis of the call.
	 * @return array List of arguments, each as an array of its first and last token position.
	 */
	private function get_arguments( array $tokens, $open_parenthesis ) {
		if ( ! isset( $tokens[ $open_parenthesis ]['parenthesis_closer'] ) ) {
			return array();
		}

		$close_parenthesis = $tokens[ $open_parenthesis ]['parenthesis_closer'];
		$arguments         = array();
		$start             = $open_parenthesis + 1;
		$has_content       = false;

		for ( $ptr = $start; $ptr < $close_parenthesis; $ptr++ ) {
			$code = $tokens[ $ptr ]['code'];

			if ( T_COMMA === $code ) {
				$arguments[] = array( $start, $ptr - 1 );
				$start       = $ptr + 1;
				$has_content = false;
				continue;
			}

			if ( ! isset( $this->empty_tokens[ $code ] ) ) {
				$has_content = true;
			}

			// Skip nested groups so that their commas are not counted.
			if ( T_OPEN_PARENTHESIS === $code && isset( $tokens[ $ptr ]['parenthesis_closer'] ) ) {
				$ptr = $tokens[ $ptr ]['parenthesis_closer'];
			} elseif ( in_array( $code, array( T_OPEN_SHORT_ARRAY, T_OPEN_SQUARE_BRACKET, T_OPEN_CURLY_BRACKET ), true ) && isset( $tokens[ $ptr ]['bracket_closer'] ) ) {
				$ptr = $tokens[ $ptr ]['bracket_closer'];
			}
		}

		// Add the last argument, unless the call has no arguments or ends with a trailing comma.
		if ( $has_content ) {
			$arguments[] = array( $start, $close_parenthesis - 1 );
		}

		return $arguments;
	}
}
