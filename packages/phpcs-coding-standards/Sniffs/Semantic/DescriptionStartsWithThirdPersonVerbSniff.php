<?php
/**
 * Short description of every function and method docblock must start with a third person verb.
 *
 * @since n.e.x.t
 *
 * @category  PHP
 * @package   PHP_CodeSniffer
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace PHP_CodeSniffer\Standards\GoogleSiteKit\Sniffs\Semantic;

use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Files\File;

/**
 * Description Starts With Third Person Verb Sniff.
 *
 * @since n.e.x.t
 */
class DescriptionStartsWithThirdPersonVerbSniff implements Sniff {

	/**
	 * Returns the token types that this sniff is interested in.
	 *
	 * @since n.e.x.t
	 *
	 * @return array(int)
	 */
	public function register() {
		return array( T_DOC_COMMENT_OPEN_TAG );
	}

	/**
	 * Processes this sniff, when one of its tokens is encountered.
	 *
	 * @since n.e.x.t
	 *
	 * @param \PHP_CodeSniffer\Files\File $phpcs_file The current file being checked.
	 * @param int                         $stack_ptr  The position of the current token in the
	 *                                                stack passed in $tokens.
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$tokens      = $phpcs_file->getTokens();
		$comment_end = $phpcs_file->findNext( T_DOC_COMMENT_CLOSE_TAG, ( $stack_ptr + 1 ) );

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$last_token = ( $phpcs_file->numTokens - 1 );

		$empty = array(
			T_DOC_COMMENT_WHITESPACE,
			T_DOC_COMMENT_STAR,
		);

		$short = $phpcs_file->findNext( $empty, ( $stack_ptr + 1 ), $comment_end, true );

		// Account for the fact that a short description might cover
		// multiple lines.
		$short_content = $tokens[ $short ]['content'];

		// Search between this comment and the next.
		$next_comment = $phpcs_file->findNext( T_DOC_COMMENT_OPEN_TAG, ( $stack_ptr + 1 ) );

		// If this is the last comment we need to check between the comment and the end of the file to find it's subject.
		if ( ! $next_comment ) {
			$next_comment = $last_token;
		}

		// Only continue if this comment is on a method or function.
		$is_function = $phpcs_file->findNext( T_FUNCTION, ( $stack_ptr + 1 ), ( $next_comment - 1 ) );

		// Remove any trailing white spaces which are detected by other sniffs.
		$short_content = trim( $short_content );

		// Only check for third person verb on the short description of functions and methods.
		if ( $is_function && $short_content ) {

			$first_word  = strtok( $short_content, ' ' );
			$last_letter = substr( $first_word, -1, 1 );

			if ( 's' !== $last_letter ) {
				$error = 'Doc comment short description must start with third person verb';
				$phpcs_file->addError( $error, $short, 'ShortNotCapital' );
			}
		}
	}
}
