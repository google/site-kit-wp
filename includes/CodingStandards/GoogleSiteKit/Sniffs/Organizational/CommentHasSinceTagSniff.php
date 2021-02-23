<?php
/**
 * Doc blocks for every properfy .
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

class CommentHasSinceTag implements Sniff {

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
	 *                                               stack passed in $tokens.
	 * @return void
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$tokens       = $phpcs_file->getTokens();
		$comment_end   = $phpcs_file->findNext( T_DOC_COMMENT_CLOSE_TAG, ( $stack_ptr + 1 ) );
		$commentStart = $tokens[ $comment_end ]['comment_opener'];

		// Check for full stop on doc block tags.
		$hasSinceTag = false;
		foreach ( $tokens[ $commentStart ]['comment_tags'] as $pos => $tag ) {

			$comment_tag_type = $tokens[ $tag ]['content'];

			// Only check the tag types defined in $doc_comment_tags.
			if ( $comment_tag_type === '@since' ) {
				$hasSinceTag = true;
				continue;
			}
		}

		if ( ! $hasSinceTag ) {
			$error = 'Doc comment must include a @since tag';

			$phpcs_file->addError( $error, $stack_ptr, 'MissingSinceTag' );
		}
	}
}
