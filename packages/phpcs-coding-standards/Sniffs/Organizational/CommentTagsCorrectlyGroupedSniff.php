<?php
/**
 * Docblock comment tags should be grouped.
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
 * Comment Tags Correctly Grouped Sniff.
 *
 * @since n.e.x.t
 */
class CommentTagsCorrectlyGrouped implements Sniff {

	/**
	 * Returns the token types that this sniff is interested in.
	 *
	 * @since n.e.x.t
	 *
	 * @return string[]
	 */
	public function register() {
		return array( T_DOC_COMMENT_OPEN_TAG );
	}

	/**
	 * Processes this sniff, when one of its tokens is encountered.
	 *
	 * @since n.e.x.t
	 *
	 * @param File $phpcs_file The current file being checked.
	 * @param int  $stack_ptr  The position of the current token in the
	 *                         stack passed in $tokens.
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$tokens        = $phpcs_file->getTokens();
		$comment_end   = $phpcs_file->findNext( T_DOC_COMMENT_CLOSE_TAG, ( $stack_ptr + 1 ) );
		$comment_start = $tokens[ $comment_end ]['comment_opener'];

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
		$doc_comment_tags_groups = array(
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
		foreach ( $tokens[ $comment_start ]['comment_tags'] as $pos => $tag ) {

			$comment_tag_type = $tokens[ $tag ]['content'];
			$tag_token        = $tag;

			// Only check the tag types defined in $doc_comment_tags.
			if ( ! in_array( $comment_tag_type, $doc_comment_tags, true ) ) {
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

			// Find the number of blank lines after this tag by looking for the number of stars before the next comment.

			// Find the next element that is not a star or whitespace (the next comment location).
			$next_comment_tag     = $phpcs_file->findNext( array( T_DOC_COMMENT_TAG ), $tag_token + 1, null );
			$end_of_comment_block = $phpcs_file->findNext( array( T_DOC_COMMENT_CLOSE_TAG ), $tag_token + 1, null );

			// Stop the search at the end of each comment block.
			if ( $end_of_comment_block < $next_comment_tag ) {
				$next_comment_tag = $end_of_comment_block;
			}

			$current_position = $tag_token;
			$stars            = 0;
			$next_star        = true;
			while ( $next_star ) {
				$next_star = $phpcs_file->findNext( array( T_DOC_COMMENT_STAR ), $current_position, $next_comment_tag );

				if ( $next_star ) {
					$stars            = ++$stars;
					$current_position = $next_star + 1;
				}
			}

			// Subtract the total lines of the current tag comment to account for multi line comments.
			$blank_line_offset = 1;
			if ( count( $comment_lines ) > 1 ) {
				$blank_line_offset = count( $comment_lines );
			}
			$comment_blank_lines = $stars;
			if ( $comment_blank_lines > 0 ) {
				$comment_blank_lines = $stars - $blank_line_offset;
			}

			$params[] = array(
				'tag'               => $tag,
				'tagType'           => $comment_tag_type,
				'tagToken'          => $tag_token,
				'comment'           => $comment,
				'commentBlankLines' => $comment_blank_lines,
			);
		}

		// Track the previous and next tags to check the order is correct.
		$previous_tags   = array();
		$next_tags       = $params;
		$count_next_tags = count( $next_tags );

		while ( $count_next_tags > 0 ) {
			// Remove the current tag.
			$current_tag             = array_shift( $next_tags );
			$current_tag_type        = $current_tag['tagType'];
			$current_tag_blank_lines = $current_tag['commentBlankLines'];

			// Update the next_tags count.
			$count_next_tags = count( $next_tags );

			// Get the next tag to compare with the current.
			if ( empty( $next_tags ) ) {
				break;
			}
			$next_tag      = $next_tags[0];
			$next_tag_type = $next_tag['tagType'];

			$current_tag_group = array();
			foreach ( $doc_comment_tags_groups as $comment_tag_group ) {
				if ( in_array( $current_tag_type, $comment_tag_group, true ) ) {
					$current_tag_group = $comment_tag_group;
				}
			}

			// Check if the next tag is allowed in this group and is not separated by a blank line.
			if ( ! in_array( $next_tag_type, $current_tag_group, true ) && 0 === $current_tag_blank_lines ) {
				$error = "Missing blank line between $current_tag_type tag and $next_tag_type tag";
				$phpcs_file->addError( $error, $current_tag['tagToken'], 'TagGrouping' );
			}

			// Check if the next tag should be grouped with the current one but is spearated by a blank line.
			if ( in_array( $next_tag_type, $current_tag_group, true ) && 0 < $current_tag_blank_lines ) {
				$error = "Blank line not allowed between $current_tag_type tag and $next_tag_type tag";
				$phpcs_file->addError( $error, $current_tag['tagToken'], 'TagGrouping' );
			}

			// Add the tag we have checked into the $previous_tags array.
			$previous_tags[] = $current_tag;
		}

	}
}
