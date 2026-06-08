<?php
/**
 * Class RequireDocTagDescriptionSniff
 *
 * @package Google\Site_Kit\PHPCS\Sniffs\Commenting
 */

namespace Google\Site_Kit\PHPCS\Sniffs\Commenting;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

/**
 * Class RequireDocTagDescriptionSniff
 *
 * Ensures that `@param` and `@return` tags within function/method docblocks
 * include a description in addition to the type information.
 */
class RequireDocTagDescriptionSniff implements Sniff {

	/**
	 * Tokens that may sit between a docblock and the function token it documents
	 * (visibility, static, final and abstract modifiers, plus whitespace).
	 *
	 * @var array<int|string>
	 */
	private $modifier_tokens = array(
		T_WHITESPACE,
		T_PUBLIC,
		T_PROTECTED,
		T_PRIVATE,
		T_STATIC,
		T_FINAL,
		T_ABSTRACT,
	);

	/**
	 * Returns an array of tokens this sniff wants to listen for.
	 *
	 * @return array Token types to listen for.
	 */
	public function register() {
		return array( T_FUNCTION );
	}

	/**
	 * Processes this sniff, when one of its tokens is encountered.
	 *
	 * @param File $phpcs_file The file being scanned.
	 * @param int  $stack_ptr  The position of the current token in the stack.
	 *
	 * @return void Errors are emitted on the file directly.
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$tokens = $phpcs_file->getTokens();

		// Walk backwards past modifiers to find the docblock close, if any.
		$comment_end = $phpcs_file->findPrevious( $this->modifier_tokens, $stack_ptr - 1, null, true );

		if ( false === $comment_end || T_DOC_COMMENT_CLOSE_TAG !== $tokens[ $comment_end ]['code'] ) {
			// No docblock attached to this function.
			return;
		}

		$comment_start = $tokens[ $comment_end ]['comment_opener'];

		if ( empty( $tokens[ $comment_start ]['comment_tags'] ) ) {
			return;
		}

		foreach ( $tokens[ $comment_start ]['comment_tags'] as $tag_ptr ) {
			$tag_name = $tokens[ $tag_ptr ]['content'];

			if ( '@param' !== $tag_name && '@return' !== $tag_name ) {
				continue;
			}

			$content = $this->get_tag_content( $phpcs_file, $tag_ptr, $comment_end );

			if ( '@param' === $tag_name ) {
				if ( ! $this->has_param_description( $content ) ) {
					$phpcs_file->addError(
						'@param tag must include a description.',
						$tag_ptr,
						'MissingParamDescription'
					);
				}
				continue;
			}

			// $tag_name is '@return' at this point.
			if ( ! $this->has_return_description( $content ) ) {
				$phpcs_file->addError(
					'@return tag must include a description.',
					$tag_ptr,
					'MissingReturnDescription'
				);
			}
		}
	}

	/**
	 * Collects the textual content of a doc tag, including any continuation
	 * lines that precede the next tag or the docblock close.
	 *
	 * @param File $phpcs_file  The file being scanned.
	 * @param int  $tag_ptr     The position of the doc tag token.
	 * @param int  $comment_end The position of the docblock close tag.
	 *
	 * @return string The combined content of the tag, trimmed of surrounding whitespace.
	 */
	private function get_tag_content( File $phpcs_file, $tag_ptr, $comment_end ) {
		$tokens = $phpcs_file->getTokens();
		$pieces = array();

		for ( $i = $tag_ptr + 1; $i < $comment_end; $i++ ) {
			// Stop at the next doc tag — its content is not part of this tag.
			if ( T_DOC_COMMENT_TAG === $tokens[ $i ]['code'] ) {
				break;
			}

			if ( T_DOC_COMMENT_STRING === $tokens[ $i ]['code'] ) {
				$pieces[] = $tokens[ $i ]['content'];
			}
		}

		return trim( implode( ' ', $pieces ) );
	}

	/**
	 * Checks whether a `@param` tag's content includes a description after the
	 * type and variable name.
	 *
	 * @param string $content The combined content of the `@param` tag.
	 *
	 * @return bool True if a description is present (or the tag is malformed
	 *              and a separate sniff would catch that); false otherwise.
	 */
	private function has_param_description( $content ) {
		// Locate the variable portion.
		if ( ! preg_match( '/\$[a-zA-Z_][a-zA-Z0-9_]*/', $content, $matches, PREG_OFFSET_CAPTURE ) ) {
			// Malformed tag with no variable — leave it to other sniffs (e.g.
			// Squiz.Commenting.FunctionComment) to report the malformation.
			return true;
		}

		$variable_end = $matches[0][1] + strlen( $matches[0][0] );
		$after        = substr( $content, $variable_end );

		return '' !== trim( $after );
	}

	/**
	 * Checks whether a `@return` tag's content includes a description after
	 * the return type.
	 *
	 * @param string $content The combined content of the `@return` tag.
	 *
	 * @return bool True if a description is present; false otherwise.
	 */
	private function has_return_description( $content ) {
		if ( '' === $content ) {
			// No type either — leave malformed tag to other sniffs.
			return true;
		}

		$without_type = $this->strip_leading_type( $content );

		return '' !== trim( $without_type );
	}

	/**
	 * Strips the leading type expression from a doc tag content string, with
	 * balanced-bracket awareness so generic types such as `array<string, int>`
	 * or `callable(int): string` are treated as a single type.
	 *
	 * @param string $content The doc tag content to strip from.
	 *
	 * @return string The content with the leading type removed.
	 */
	private function strip_leading_type( $content ) {
		$content = ltrim( $content );
		$length  = strlen( $content );
		$depth   = 0;
		$i       = 0;

		while ( $i < $length ) {
			$char = $content[ $i ];

			if ( 0 === $depth && ( ' ' === $char || "\t" === $char ) ) {
				break;
			}

			if ( false !== strpos( '<({[', $char ) ) {
				++$depth;
			} elseif ( false !== strpos( '>)}]', $char ) ) {
				--$depth;
			}

			++$i;
		}

		return substr( $content, $i );
	}
}
