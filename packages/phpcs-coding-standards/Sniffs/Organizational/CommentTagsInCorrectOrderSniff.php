<?php
/**
 * Description of every section of the docblock must end with a full stop.
 *
 * @since n.e.x.t
 *
 * @package   Google\Site_Kit_CS
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit_CS\Sniffs\Semantic;

use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Files\File;

/**
 * Comment Tags In Correct Order Sniff.
 *
 * @since n.e.x.t
 */
class CommentTagsInCorrectOrder implements Sniff {

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
		$tokens        = $phpcs_file->getTokens();
		$comment_end   = $phpcs_file->findNext( T_DOC_COMMENT_CLOSE_TAG, ( $stack_ptr + 1 ) );
		$comment_start = $tokens[ $comment_end ]['comment_opener'];

		// List of @ comment types to check. They should be in order set by this array.
		$doc_comment_tags_order = array(
			'@since',
			'@deprecated',
			'@access',
			'@static',
			'@global',
			'@var',
			'@param',
			'@return',
		);

		// Check for full stop on doc block tags.
		$params = array();
		foreach ( $tokens[ $comment_start ]['comment_tags'] as $pos => $tag ) {

			$comment_tag_type = $tokens[ $tag ]['content'];
			$tag_token        = $tag;

			// Only check the tag types defined in $doc_comment_tags_order.
			if ( ! in_array( $comment_tag_type, $doc_comment_tags_order, true ) ) {
				continue;
			}

			$comment       = '';
			$comment_lines = array();
			if ( T_DOC_COMMENT_STRING === $tokens[ ( $tag + 2 ) ]['code'] ) {
				$matches = array();
				preg_match( '/([^$&.]+)(?:((?:\.\.\.)?(?:\$|&)[^\s]+)(?:(\s+)(.*))?)?/', $tokens[ ( $tag + 2 ) ]['content'], $matches );

				if ( true === isset( $matches[2] ) ) {

					if ( true === isset( $matches[4] ) ) {
						$comment         = $matches[4];
						$comment_lines[] = array(
							'comment' => $comment,
							'token'   => ( $tag + 2 ),
						);

						// Any strings until the next tag belong to this comment.
						if ( isset( $tokens[ $comment_start ]['comment_tags'][ ( $pos + 1 ) ] ) === true ) {
							$end = $tokens[ $comment_start ]['comment_tags'][ ( $pos + 1 ) ];
						} else {
							$end = $tokens[ $comment_start ]['comment_closer'];
						}

						for ( $i = ( $tag + 3 ); $i < $end; $i++ ) {
							if ( T_DOC_COMMENT_STRING === $tokens[ $i ]['code'] ) {
								$comment        .= ' ' . $tokens[ $i ]['content'];
								$comment_lines[] = array(
									'comment' => $tokens[ $i ]['content'],
									'token'   => $i,
								);
							}
						}
					}
				}
			}

			$params[] = array(
				'tag'          => $tag,
				'tagType'      => $comment_tag_type,
				'tagToken'     => $tag_token,
				'comment'      => $comment,
				'commentLines' => $comment_lines,
			);
		}

		// Track the previous and next tags to check the order is correct.
		$previous_tags   = array();
		$next_tags       = $params;
		$count_next_tags = count( $next_tags );

		while ( 0 < $count_next_tags ) {
			// Remove the current tag.
			$current_tag      = array_shift( $next_tags );
			$current_tag_type = $current_tag['tagType'];

			// Update the next_tags count.
			$count_next_tags = count( $next_tags );

			$tag_order_position = array_search( $current_tag_type, $doc_comment_tags_order, true );

			$allowed_previous_tags = $doc_comment_tags_order;
			$allowed_previous_tags = array_splice( $allowed_previous_tags, 0, $tag_order_position );

			// Loop through previous tags and show error for disallowed tags.
			foreach ( $previous_tags as $tag ) {
				if ( $tag['tagType'] !== $current_tag_type && ! in_array( $tag['tagType'], $allowed_previous_tags, true ) ) {
					$error = "Tag {$tag['tagType']} must be below $current_tag_type tag";
					$phpcs_file->addError( $error, $tag['tagToken'], 'TagOrder' );
				}
			}

			// Add the tag we have checked into the $previous_tags array.
			$previous_tags[] = $current_tag;
		}
	}
}
