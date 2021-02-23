<?php
/**
 * Docblock comment tags should be grouped.
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

class CommentTagsCorrectlyGrouped implements Sniff {

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

		// List of @ comment types to check.
		$doc_comment_tags = array(
			'@since',
			'@deprecated',
			'@access',
			'@static',
			'@global',
			'@var',
			'@param',
			'@return',
		);

		// List how the @ tags should be grouped.
		$doc_comment_tagsGroups = array(
			array(
				'@since',
				'@deprecated',
				'@access',
				'@static',
			),
			array(
				'@global',
			),
			array(
				'@var',
				'@param',
				'@return',
			),
		);

		// Check for full stop on doc block tags.
		$params = array();
		foreach ( $tokens[ $commentStart ]['comment_tags'] as $pos => $tag ) {

			$comment_tag_type = $tokens[ $tag ]['content'];
			$tagToken       = $tag;

			// Only check the tag types defined in $doc_comment_tags.
			if ( ! in_array( $comment_tag_type, $doc_comment_tags ) ) {
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

			// Find the number of blank lines after this tag by looking for the number of stars before the next comment.

			// Find the next element that is not a star or whitespace (the next comment location)
			$nextCommentTag    = $phpcs_file->findNext( array( T_DOC_COMMENT_TAG ), $tagToken + 1, null );
			$endOfCommentBlock = $phpcs_file->findNext( array( T_DOC_COMMENT_CLOSE_TAG ), $tagToken + 1, null );

			// Stop the search at the end of each comment block.
			if ( $endOfCommentBlock < $nextCommentTag ) {
				$nextCommentTag = $endOfCommentBlock;
			}

			$currentPosition = $tagToken;
			$stars           = 0;
			$nextStar        = true;
			while ( $nextStar ) {
				$nextStar = $phpcs_file->findNext( array( T_DOC_COMMENT_STAR ), $currentPosition, $nextCommentTag );

				if ( $nextStar ) {
					$stars           = $stars + 1;
					$currentPosition = $nextStar + 1;
				}
			}

			// Subtract the total lines of the current tag comment to account for multi line comments.
			$blankLineOffset = 1;
			if ( count( $commentLines ) > 1 ) {
				$blankLineOffset = count( $commentLines );
			}
			$commentBlankLines = $stars;
			if ( $commentBlankLines > 0 ) {
				$commentBlankLines = $stars - $blankLineOffset;
			}

			$params[] = array(
				'tag'               => $tag,
				'tagType'           => $comment_tag_type,
				'tagToken'          => $tagToken,
				'comment'           => $comment,
				'commentBlankLines' => $commentBlankLines,
			);
		}

		// Track the previous and next tags to check the order is correct.
		$previousTags = array();
		$nextTags     = $params;

		while ( count( $nextTags ) > 0 ) {
			// Remove the current tag.
			$currentTag           = array_shift( $nextTags );
			$currentTagType       = $currentTag['tagType'];
			$currentTagBlankLines = $currentTag['commentBlankLines'];

			// Get the next tag to compare with the current.
			if ( empty( $nextTags ) ) {
				break;
			}
			$nextTag     = $nextTags[0];
			$nextTagType = $nextTag['tagType'];

			$currentTagGroup = array();
			foreach ( $doc_comment_tagsGroups as $commentTagGroup ) {
				if ( in_array( $currentTagType, $commentTagGroup ) ) {
					$currentTagGroup = $commentTagGroup;
				}
			}

			// Check if the next tag is allowed in this group and is not separated by a blank line.
			if ( ! in_array( $nextTagType, $currentTagGroup ) && $currentTagBlankLines === 0 ) {
				$error = "Missing blank line between $currentTagType tag and $nextTagType tag";
				$phpcs_file->addError( $error, $currentTag['tagToken'], 'TagGrouping' );
			}

			// Check if the next tag should be grouped with the current one but is spearated by a blank line.
			if ( in_array( $nextTagType, $currentTagGroup ) && $currentTagBlankLines > 0 ) {
				$error = "Blank line not allowed between $currentTagType tag and $nextTagType tag";
				$phpcs_file->addError( $error, $currentTag['tagToken'], 'TagGrouping' );
			}

			// Add the tag we have checked into the $previousTags array.
			$previousTags[] = $currentTag;
		}

	}
}
