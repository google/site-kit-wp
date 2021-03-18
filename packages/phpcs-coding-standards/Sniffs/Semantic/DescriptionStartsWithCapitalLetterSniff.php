<?php
/**
 * Description of every element in the doc block must start with a capital letter.
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
 * Description Starts With Capital Letter Sniff.
 *
 * @since n.e.x.t
 */
class DescriptionStartsWithCapitalLetterSniff implements Sniff {

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
	 * @param File $phpcs_file The current file being checked.
	 * @param int  $stack_ptr  The position of the current token in the
	 *                         stack passed in $tokens.
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$tokens      = $phpcs_file->getTokens();
		$comment_end = $phpcs_file->findNext( T_DOC_COMMENT_CLOSE_TAG, ( $stack_ptr + 1 ) );

		$empty = array(
			T_DOC_COMMENT_WHITESPACE,
			T_DOC_COMMENT_STAR,
		);

		// List of @ comment types to check for capitalisation.
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

		if ( 0 === preg_match( '|\p{Lu}|u', $short_content[0] )
			&& '{@inheritdoc}' !== $short_content
			// Ignore Features module export files that just use the file name as
			// comment.
			&& basename( $phpcs_file->getFilename() ) !== $short_content
		) {
			$error = 'Doc comment short description must start with a capital letter';
			// If we cannot capitalize the first character then we don't have a
			// fixable error.
			if ( ucfirst( $tokens[ $short ]['content'] ) === $tokens[ $short ]['content'] ) {
				$phpcs_file->addError( $error, $short, 'ShortNotCapital' );
			} else {
				$fix = $phpcs_file->addFixableError( $error, $short, 'ShortNotCapital' );
				if ( true === $fix ) {
					$phpcs_file->fixer->replaceToken( $short, ucfirst( $tokens[ $short ]['content'] ) );
				}
			}
		}

		$long = $phpcs_file->findNext( $empty, ( $short_end + 1 ), ( $comment_end - 1 ), true );

		if ( T_DOC_COMMENT_STRING === $tokens[ $long ]['code'] ) {

			if ( 0 === preg_match( '|\p{Lu}|u', $tokens[ $long ]['content'][0] )
				&& ucfirst( $tokens[ $long ]['content'] ) !== $tokens[ $long ]['content']
			) {
				$error = 'Doc comment long description must start with a capital letter';
				$fix   = $phpcs_file->addFixableError( $error, $long, 'LongNotCapital' );
				if ( true === $fix ) {
					$phpcs_file->fixer->replaceToken( $long, ucfirst( $tokens[ $long ]['content'] ) );
				}
			}
		}

		// Look through all @ comments in the current doc comment.
		$current_token = $phpcs_file->findNext( T_DOC_COMMENT_TAG, ( $short_end + 1 ), ( $comment_end - 1 ) );
		while ( $current_token ) {

			$comment_tag_type = $tokens[ $current_token ]['content'];

			// Check to see if this token is an @ comment in the $doc_comment_tags array.
			if ( T_DOC_COMMENT_TAG === $tokens[ $current_token ]['code'] && in_array( $comment_tag_type, $doc_comment_tags, true ) ) {

				// Find the @ tag comment if there is one.
				$tag_comment = $phpcs_file->findNext( T_DOC_COMMENT_STRING, ( $current_token + 1 ), ( $comment_end - 1 ) );

				// Check each comment for capitalisation.
				if ( $tag_comment ) {
					$full_tag_comment = $tokens[ $tag_comment ]['content'];

					$tag_description = false;
					if ( '@return' === $comment_tag_type ) {
						// Tags with the type description structure.

						// Remove the type string from the description.
						$tag_description = trim( preg_replace( '/^([\w\(\)]+)/', '', $full_tag_comment ) );
					} else {
						// Comments with the type $variable description structure.

						// Split the Class and variable name from the tag description.
						$split_tag_comment = preg_split( '/\$[\w\d]+\ /', $full_tag_comment );
						if ( 2 <= count( $split_tag_comment ) ) {
							// Get the pure description if there is one.
							$tag_description = $split_tag_comment[1];
						}
					}

					// Skip empty descriptions.
					if ( $tag_description ) {

						// Check for capital letter.
						if ( $tag_description
							&& 0 === preg_match( '|\p{Lu}|u', $tag_description[0] )
							&& ucfirst( $tag_description ) !== $tag_description
						) {
							$error = "Tag $comment_tag_type comment description must start with a capital letter";
							$fix   = $phpcs_file->addFixableError( $error, $current_token, 'TagNotCapital' );
							if ( true === $fix ) {
								$fixed_tag_comment = str_replace( $tag_description, ucfirst( $tag_description ), $full_tag_comment );

								$phpcs_file->fixer->replaceToken( $tag_comment, $fixed_tag_comment );
							}
						}
					}
				}
			}
			// Look through all @ comments in the current doc comment.
			$current_token = $phpcs_file->findNext( T_DOC_COMMENT_TAG, ( $current_token + 1 ), ( $comment_end - 1 ) );
		}
	}
}
