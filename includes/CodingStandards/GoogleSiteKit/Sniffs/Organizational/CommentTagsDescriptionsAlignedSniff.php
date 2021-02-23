<?php
/**
 * Descriptions of tags in docblock should be aligned.
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
		);

		// Check for full stop on doc block tags.
		$params  = array();
		$maxType = 0;
		$maxVar  = 0;
		foreach ( $tokens[ $commentStart ]['comment_tags'] as $pos => $tag ) {

			// Tokens used to calculate total indent later.
			$preTagWhitespace         = $tokens[ ( $tag - 1 ) ];
			$fullTag                  = $tokens[ $tag ];
			$full_tag_commentWhitespace = $tokens[ ( $tag + 1 ) ];
			$fullComment              = $tokens[ ( $tag + 2 ) ];

			$comment_tag_type = $tokens[ $tag ]['content'];
			$tagToken       = $tag;

			// Only check the tag types defined in $doc_comment_tags.
			if ( ! in_array( $comment_tag_type, $doc_comment_tags ) ) {
				continue;
			}

			$type         = '';
			$comment      = '';
			$commentLines = array();
			if ( $fullComment['code'] === T_DOC_COMMENT_STRING ) {
				$matches = array();
				preg_match( '/([^$&.]+)(?:((?:\.\.\.)?(?:\$|&)[^\s]+)(?:(\s+)(.*))?)?/', $fullComment['content'], $matches );

				if ( empty( $matches ) === false ) {
					$typeLen = strlen( $matches[1] );
					$type    = trim( $matches[1] );
					$typeLen = strlen( $type );
					if ( $typeLen > $maxType ) {
						$maxType = $typeLen;
					}
				}

				if ( isset( $matches[2] ) === true ) {

					// Return is special as it doesn't need a var.
					if ( $comment_tag_type === '@return' ) {
						// Pass the description to the following comment check.
						$matches[4] = $matches[2];

						$varLen = 0;
					} else {
						$var    = $matches[2];
						$varLen = strlen( $var );
						if ( $varLen > $maxVar ) {
							$maxVar = $varLen;
						}
					}

					if ( isset( $matches[4] ) === true ) {

						$comment = $matches[4];

						// Sum the length of each section of the comment to get the total indent of the description.
						$lineLength =
							$preTagWhitespace['length'] +
							$fullTag['length'] +
							$full_tag_commentWhitespace['length'] +
							$fullComment['length'];

						$commentLength = strlen( $comment );

						$tag_descriptionIndent = $lineLength - $commentLength;

						$commentLines[] = array(
							'comment' => $comment,
							'token'   => ( $tag + 2 ),
							'indent'  => $tag_descriptionIndent,
						);

						// Any strings until the next tag belong to this comment.
						if ( isset( $tokens[ $commentStart ]['comment_tags'][ ( $pos + 1 ) ] ) === true ) {
							$end = $tokens[ $commentStart ]['comment_tags'][ ( $pos + 1 ) ];
						} else {
							$end = $tokens[ $commentStart ]['comment_closer'];
						}

						for ( $i = ( $tag + 3 ); $i < $end; $i++ ) {
							if ( $tokens[ $i ]['code'] === T_DOC_COMMENT_STRING ) {
								$indent = 0;
								if ( $tokens[ ( $i - 1 ) ]['code'] === T_DOC_COMMENT_WHITESPACE ) {
									$indent = $tokens[ ( $i - 1 ) ]['length'];
								}

								$comment       .= ' ' . $tokens[ $i ]['content'];
								$commentLines[] = array(
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
			// echo "commentTagType $comment_tag_type blankLineOffset $blankLineOffset \n\n";
			$commentBlankLines = $stars;
			if ( $commentBlankLines > 0 ) {
				$commentBlankLines = $stars - $blankLineOffset;
			}

			$params[] = array(
				'tag'               => $tag,
				'type'              => $type,
				'comment'           => $comment,
				'commentLines'      => $commentLines,
				'commentBlankLines' => $commentBlankLines,
			);
		}

		// Track the previous and next tags to check the order is correct.
		$tagGroups = array();
		$tagGroup  = array();
		foreach ( $params as $tag ) {

			// Only add tags that have descriptions to the array.
			if ( $tag['comment'] ) {
				$tagGroup[] = $tag;
			}

			// Once we hit a blank line, store this group and reset the tagGroup
			// array for the next group.
			if ( $tag['commentBlankLines'] > 0 ) {
				$tagGroups[] = $tagGroup;
				$tagGroup    = array();
			}
		}
		$tagGroups[] = $tagGroup;

		// Make sure all of the descriptions in every tag group are alligned.
		foreach ( $tagGroups as $tagGroup ) {
			$maxFirstLineIndent = array_reduce(
				$tagGroup,
				function ( $previous, $current ) {
					// echo 'previous'.$previous."\n\n";
					// echo 'current'.$current['commentLines'][0]['indent']."\n\n";

					if ( $current['commentLines'][0]['indent'] > $previous ) {
						return $current['commentLines'][0]['indent'];
					}
					return $previous;
				},
				0
			);

			foreach ( $tagGroup as $singleTagComment ) {
				foreach ( $singleTagComment['commentLines'] as $commentLine ) {
					if ( $commentLine['indent'] !== $maxFirstLineIndent ) {
						$error = "Tag description not aligned with surrounding tags; expected $maxFirstLineIndent spaces but found {$commentLine['indent']}";
						$phpcs_file->addError( $error, $commentLine['token'], 'TagDescriptionAlignment' );
					}
				}
			}
		}
	}
}
