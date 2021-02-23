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

class DescriptionEndsWithFullStopSniff implements Sniff {

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

		$empty = array(
			T_DOC_COMMENT_WHITESPACE,
			T_DOC_COMMENT_STAR,
		);

		// List of @ comment types to check for full stops.
		$doc_comment_tags = array(
			'@param',
			'@property',
			'@return',
		);

		$short = $phpcs_file->findNext( $empty, ( $stack_ptr + 1 ), $comment_end, true );

		// Account for the fact that a short description might cover
		// multiple lines.
		$short_content = $tokens[ $short ]['content'];
		$short_end     = $short;

		// Remove any trailing white spaces which are detected by other sniffs.
		$short_content = trim( $short_content );

		$lastChar = substr( $short_content, -1 );
		if ( in_array( $lastChar, array( '.', '!', '?', ')' ) ) === false && $short_content !== '{@inheritdoc}'
			// Ignore Features module export files that just use the file name as
			// comment.
			&& $short_content !== basename( $phpcs_file->getFilename() )
		) {
			$error = 'Doc comment short description must end with a full stop';
			$fix   = $phpcs_file->addFixableError( $error, $short_end, 'ShortFullStop' );
			if ( $fix === true ) {
				$phpcs_file->fixer->addContent( $short_end, '.' );
			}
		}

		$long = $phpcs_file->findNext( $empty, ( $short_end + 1 ), ( $comment_end - 1 ), true );
		// Account for the fact that a description might cover multiple lines.
		$long_content = $tokens[ $long ]['content'];
		$long_end     = $long;
		for ( $i = $long + 1; $i < $comment_end; $i++ ) {
			if ( $tokens[ $i ]['code'] === T_DOC_COMMENT_STRING ) {
				if ( $tokens[ $i ]['line'] === $tokens[ $long_end ]['line'] + 1 ) {
					$long_content .= $tokens[ $i ]['content'];
					$long_end      = $i;
				} else {
					break;
				}
			}
		}

		if ( $tokens[ $long ]['code'] === T_DOC_COMMENT_STRING ) {

			// Remove any trailing white spaces which will be detected by other sniffs.
			$long_content = trim( $long_content );

			if ( preg_match( '/[a-zA-Z]$/', $long_content ) === 1 ) {
				$error = 'Doc comment long description must end with a full stop';
				$fix   = $phpcs_file->addFixableError( $error, $long_end, 'LongFullStop' );
				if ( $fix === true ) {
					$phpcs_file->fixer->addContent( $long_end, '.' );
				}
			}
		}

		// Check for full stop on doc block tags.
		$params  = array();
		foreach ( $tokens[ $commentStart ]['comment_tags'] as $pos => $tag ) {

			$comment_tag_type = $tokens[ $tag ]['content'];

			// Only check the tag types defined in $doc_comment_tags.
			if ( ! in_array( $comment_tag_type, $doc_comment_tags ) ) {
				continue;
			}

			$type         = '';
			$comment      = '';
			$commentLines = array();
			if ( $tokens[ ( $tag + 2 ) ]['code'] === T_DOC_COMMENT_STRING ) {
				$matches = array();
				preg_match( '/([^$&.]+)(?:((?:\.\.\.)?(?:\$|&)[^\s]+)(?:(\s+)(.*))?)?/', $tokens[ ( $tag + 2 ) ]['content'], $matches );

				if ( empty( $matches ) === false ) {
					$type = trim( $matches[1] );
				}

				// Return is special as it doesn't have a variable name.
				if ( $comment_tag_type === '@return' ) {
					// Pass the description to the following comment check.
					$matches[2] = $matches[1];
					$matches[4] = $tokens[ ( $tag + 2 ) ]['content'];
				}

				if ( isset( $matches[2] ) === true ) {
					
					if ( isset( $matches[4] ) === true ) {

						$comment = $matches[4];

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
				'tagType'      => $comment_tag_type,
				'type'         => $type,
				'comment'      => $comment,
				'commentLines' => $commentLines,
			);
		}

		foreach ( $params as $pos => $param ) {
			// If the type is empty, the whole line is empty.
			if ( $param['type'] === '' ) {
				continue;
			}

			// Only enforce full stop of there is a comment to check.
			if ( $param['comment'] === '' || ! strstr( $param['comment'], ' ' ) ) {
				continue;
			}

			// Check the last character of the last line of the comment.
			$lastChar = substr( end( $param['commentLines'] )['comment'], -1 );
			if ( $lastChar !== '.' ) {
				$error = "Tag {$param['tagType']} description must end with a full stop";
				$phpcs_file->addError( $error, $param['tag'], 'TagFullStop' );
			}
		}
	}
}
