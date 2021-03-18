<?php
/**
 * Descriptions of tags in docblock should be aligned.
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
 * Comment Tags Description Aligned Sniff.
 *
 * @since n.e.x.t
 */
class CommentTagsDescriptionsAligned implements Sniff {

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

		// List of @ comment types to check.
		$doc_comment_tags = array(
			'@since',
			'@deprecated',
			'@access',
			'@static',
			'@global',
			'@var',
			'@param',
		);

		// Check for full stop on doc block tags.
		$params   = array();
		$max_type = 0;
		$max_var  = 0;
		foreach ( $tokens[ $comment_start ]['comment_tags'] as $pos => $tag ) {

			// Tokens used to calculate total indent later.
			$pre_tag_whitespace          = $tokens[ ( $tag - 1 ) ];
			$full_tag                    = $tokens[ $tag ];
			$full_tag_comment_whitespace = $tokens[ ( $tag + 1 ) ];
			$full_comment                = $tokens[ ( $tag + 2 ) ];

			$comment_tag_type = $tokens[ $tag ]['content'];
			$tag_token        = $tag;

			// Only check the tag types defined in $doc_comment_tags.
			if ( ! in_array( $comment_tag_type, $doc_comment_tags, true ) ) {
				continue;
			}

			$type          = '';
			$comment       = '';
			$comment_lines = array();
			if ( T_DOC_COMMENT_STRING === $full_comment['code'] ) {
				$matches = array();
				preg_match( '/([^$&.]+)(?:((?:\.\.\.)?(?:\$|&)[^\s]+)(?:(\s+)(.*))?)?/', $full_comment['content'], $matches );

				if ( empty( $matches ) === false ) {
					$type_length = strlen( $matches[1] );
					$type        = trim( $matches[1] );
					$type_length = strlen( $type );
					if ( $type_length > $max_type ) {
						$max_type = $type_length;
					}
				}

				if ( true === isset( $matches[2] ) ) {

					// Return is special as it doesn't need a var.
					if ( '@return' === $comment_tag_type ) {
						// Pass the description to the following comment check.
						$matches[4] = $matches[2];

						$var_length = 0;
					} else {
						$var        = $matches[2];
						$var_length = strlen( $var );
						if ( $var_length > $max_var ) {
							$max_var = $var_length;
						}
					}

					if ( true === isset( $matches[4] ) ) {

						$comment = $matches[4];

						// Sum the length of each section of the comment to get the total indent of the description.
						$line_length =
							$pre_tag_whitespace['length'] +
							$full_tag['length'] +
							$full_tag_comment_whitespace['length'] +
							$full_comment['length'];

						$comment_length = strlen( $comment );

						$tag_description_indent = $line_length - $comment_length;

						$comment_lines[] = array(
							'comment' => $comment,
							'token'   => ( $tag + 2 ),
							'indent'  => $tag_description_indent,
						);

						// Any strings until the next tag belong to this comment.
						if ( isset( $tokens[ $comment_start ]['comment_tags'][ ( $pos + 1 ) ] ) === true ) {
							$end = $tokens[ $comment_start ]['comment_tags'][ ( $pos + 1 ) ];
						} else {
							$end = $tokens[ $comment_start ]['comment_closer'];
						}

						for ( $i = ( $tag + 3 ); $i < $end; $i++ ) {
							if ( T_DOC_COMMENT_STRING === $tokens[ $i ]['code'] ) {
								$indent = 0;
								if ( T_DOC_COMMENT_WHITESPACE === $tokens[ ( $i - 1 ) ]['code'] ) {
									$indent = $tokens[ ( $i - 1 ) ]['length'];
								}

								$comment        .= ' ' . $tokens[ $i ]['content'];
								$comment_lines[] = array(
									'comment' => $tokens[ $i ]['content'],
									'token'   => $i,
									'indent'  => $indent,
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
				'type'              => $type,
				'comment'           => $comment,
				'commentLines'      => $comment_lines,
				'commentBlankLines' => $comment_blank_lines,
			);
		}

		// Track the previous and next tags to check the order is correct.
		$tag_groups = array();
		$tag_group  = array();
		foreach ( $params as $tag ) {

			// Only add tags that have descriptions to the array.
			if ( $tag['comment'] ) {
				$tag_group[] = $tag;
			}

			// Once we hit a blank line, store this group and reset the tagGroup
			// array for the next group.
			if ( $tag['commentBlankLines'] > 0 ) {
				$tag_groups[] = $tag_group;
				$tag_group    = array();
			}
		}
		$tag_groups[] = $tag_group;

		// Make sure all of the descriptions in every tag group are alligned.
		foreach ( $tag_groups as $tag_group ) {
			$max_first_line_indent = array_reduce(
				$tag_group,
				function ( $previous, $current ) {
					if ( $current['commentLines'][0]['indent'] > $previous ) {
						return $current['commentLines'][0]['indent'];
					}
					return $previous;
				},
				0
			);

			foreach ( $tag_group as $single_tag_comment ) {
				foreach ( $single_tag_comment['commentLines'] as $comment_line ) {
					if ( $comment_line['indent'] !== $max_first_line_indent ) {
						$error = "Tag description not aligned with surrounding tags; expected $max_first_line_indent spaces but found {$comment_line['indent']}";
						$phpcs_file->addError( $error, $comment_line['token'], 'TagDescriptionAlignment' );
					}
				}
			}
		}
	}
}
