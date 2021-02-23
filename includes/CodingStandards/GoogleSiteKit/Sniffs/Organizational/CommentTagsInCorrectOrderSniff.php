<?php
/**
 * Description of every section of the docblock must end with a full stop.
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
	 *                                               stack passed in $tokens.
	 * @return void
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$tokens       = $phpcs_file->getTokens();
		$comment_end   = $phpcs_file->findNext( T_DOC_COMMENT_CLOSE_TAG, ( $stack_ptr + 1 ) );
		$commentStart = $tokens[ $comment_end ]['comment_opener'];

		// List of @ comment types to check. They should be in order set by this array.
		$doc_comment_tagsOrder = array(
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
		$params  = array();
		foreach ( $tokens[ $commentStart ]['comment_tags'] as $pos => $tag ) {

			$comment_tag_type = $tokens[ $tag ]['content'];
			$tagToken       = $tag;

			// Only check the tag types defined in $doc_comment_tagsOrder.
			if ( ! in_array( $comment_tag_type, $doc_comment_tagsOrder ) ) {
				continue;
			}

			$comment      = '';
			$commentLines = array();
			if ( $tokens[ ( $tag + 2 ) ]['code'] === T_DOC_COMMENT_STRING ) {
				$matches = array();
				preg_match( '/([^$&.]+)(?:((?:\.\.\.)?(?:\$|&)[^\s]+)(?:(\s+)(.*))?)?/', $tokens[ ( $tag + 2 ) ]['content'], $matches );

				if ( isset( $matches[2] ) === true ) {
					
					if ( isset( $matches[4] ) === true ) {
						$comment        = $matches[4];
						$commentLines[] = array(
							'comment' => $comment,
							'token'   => ( $tag + 2 ),
						);

						// Any strings until the next tag belong to this comment.
						if ( isset( $tokens[ $commentStart ]['comment_tags'][ ( $pos + 1 ) ] ) === true ) {
							$end = $tokens[ $commentStart ]['comment_tags'][ ( $pos + 1 ) ];
						} else {
							$end = $tokens[ $commentStart ]['comment_closer'];
						}

						for ( $i = ( $tag + 3 ); $i < $end; $i++ ) {
							if ( $tokens[ $i ]['code'] === T_DOC_COMMENT_STRING ) {
								$comment       .= ' ' . $tokens[ $i ]['content'];
								$commentLines[] = array(
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
				'tagType'     => $comment_tag_type,
				'tagToken'    => $tagToken,
				'comment'      => $comment,
				'commentLines' => $commentLines,
			);
		}

		// Track the previous and next tags to check the order is correct.
		$previousTags = array();
		$nextTags     = $params;

		while ( count( $nextTags ) > 0 ) {
			// Remove the current tag.
			$currentTag     = array_shift( $nextTags );
			$currentTagType = $currentTag['tagType'];

			$tagOrderPosition = array_search( $currentTagType, $doc_comment_tagsOrder );

			$allowedPreviousTags = $doc_comment_tagsOrder;
			$allowedPreviousTags = array_splice( $allowedPreviousTags, 0, $tagOrderPosition );

			// Loop through previous tags and show error for disallowed tags.
			foreach ( $previousTags as $tag ) {
				if ( $tag['tagType'] !== $currentTagType && ! in_array( $tag['tagType'], $allowedPreviousTags ) ) {
					$error = "Tag {$tag['tagType']} must be below $currentTagType tag";
					$phpcs_file->addError( $error, $tag['tagToken'], 'TagOrder' );
				}
			}

			// Add the tag we have checked into the $previousTags array.
			$previousTags[] = $currentTag;
		}
	}
}
