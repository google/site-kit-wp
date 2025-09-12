<?php
/**
 * DocCommentFullStopSniff
 *
 * @package Google\Site_Kit\Sniffs\Commenting
 */

namespace Google\Site_Kit\Sniffs\Commenting;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

/**
 * Ensures that PHPDoc short descriptions and inline comments end with a full stop.
 */
class DocCommentFullStopSniff implements Sniff {

	/**
	 * Tokens this sniff listens for.
	 *
	 * @return array
	 */
	public function register() {
		return array(
			T_FUNCTION,
			T_CLASS,
			T_INTERFACE,
			T_TRAIT,
			T_VARIABLE,
			T_CONST,
			T_COMMENT,
		);
	}

	/**
	 * Process tokens.
	 *
	 * @param File $phpcs_file The file being scanned.
	 * @param int  $stack_ptr  Current token position.
	 * @return void
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$tokens = $phpcs_file->getTokens();
		$token  = $tokens[ $stack_ptr ]['code'];

		// Handle inline comments separately.
		if ( T_COMMENT === $token ) {
			$this->check_inline_comment( $phpcs_file, $stack_ptr );
			return;
		}

		// For PHPDoc: check if immediately before this element is a docblock.
		$find = array(
			T_WHITESPACE,
			T_ABSTRACT,
			T_FINAL,
			T_PUBLIC,
			T_PROTECTED,
			T_PRIVATE,
			T_STATIC,
			T_VAR,
		);

		$comment_end = $phpcs_file->findPrevious( $find, ( $stack_ptr - 1 ), null, true );
		if ( false === $comment_end || T_DOC_COMMENT_CLOSE_TAG !== $tokens[ $comment_end ]['code'] ) {
			return;
		}

		$comment_start = $tokens[ $comment_end ]['comment_opener'];

		// Collect the short summary (all lines before a blank or @tag).
		$summary_line_ptrs = array();
		for ( $i = ( $comment_start + 1 ); $i < $comment_end; $i++ ) {
			$code = $tokens[ $i ]['code'];

			if ( T_DOC_COMMENT_STRING === $code ) {
				$content = trim( $tokens[ $i ]['content'] );
				if ( '' === $content ) {
					break;
				}
				if ( 0 === strpos( $content, '@' ) ) {
					break;
				}
				$summary_line_ptrs[] = $i;
				continue;
			}

			if ( T_DOC_COMMENT_TAG === $code ) {
				break;
			}
		}

		if ( array() === $summary_line_ptrs ) {
			return;
		}

		$last_ptr     = end( $summary_line_ptrs );
		$last_content = trim( $tokens[ $last_ptr ]['content'] );

		if ( false === $this->needs_full_stop( $last_content ) ) {
			return;
		}

		$error = 'PHPDoc summary must end with a full stop.';
		$fix   = $phpcs_file->addFixableError( $error, $last_ptr, 'MissingFullStop' );

		if ( true === $fix ) {
			$phpcs_file->fixer->replaceToken( $last_ptr, rtrim( $tokens[ $last_ptr ]['content'] ) . '.' );
		}
	}

	/**
	 * Check inline comments for full stop.
	 *
	 * @param File $phpcs_file The file being scanned.
	 * @param int  $stack_ptr  Current token position.
	 * @return void
	 */
	private function check_inline_comment( File $phpcs_file, int $stack_ptr ): void {
		$tokens = $phpcs_file->getTokens();

		// Only process if this is the first line of a contiguous // comment block.
		$prev = $stack_ptr - 1;
		if ( $prev >= 0 && T_COMMENT === $tokens[ $prev ]['code'] && 0 === strpos( trim( $tokens[ $prev ]['content'] ), '//' ) ) {
			return;
		}

		// Collect this block (current + any following // lines).
		$block_ptrs = array( $stack_ptr );
		$next       = $stack_ptr + 1;
		$total      = \count( $tokens );

		while ( $next < $total && T_COMMENT === $tokens[ $next ]['code'] && 0 === strpos( trim( $tokens[ $next ]['content'] ), '//' ) ) {
			$block_ptrs[] = $next;
			++$next;
		}

		// Take the last non-empty line in this block.
		$last_ptr = null;
		foreach ( array_reverse( $block_ptrs ) as $ptr ) {
			$content = trim( preg_replace( '#^/{2,}\s*#', '', $tokens[ $ptr ]['content'] ) );
			if ( '' !== $content ) {
				$last_ptr = $ptr;
				break;
			}
		}

		if ( null === $last_ptr ) {
			return;
		}

		$last_content = trim( preg_replace( '#^/{2,}\s*#', '', $tokens[ $last_ptr ]['content'] ) );

		// Skip annotation-like comments (e.g. @todo, @phpcs).
		if ( 0 === strpos( $last_content, '@' ) ) {
			return;
		}

		if ( false === $this->needs_full_stop( $last_content ) ) {
			return;
		}

		$error = 'Inline comment must end with a full stop.';
		$fix   = $phpcs_file->addFixableError( $error, $last_ptr, 'InlineMissingFullStop' );

		if ( true === $fix ) {
			$new = rtrim( $tokens[ $last_ptr ]['content'] ) . '.';
			$phpcs_file->fixer->replaceToken( $last_ptr, $new );
		}
	}

	/**
	 * Check if text needs a full stop.
	 *
	 * @param string $text The text to check.
	 * @return bool True if a full stop is needed, false otherwise.
	 */
	private function needs_full_stop( string $text ): bool {
		// Ignore if it already ends correctly.
		return ( 1 !== preg_match( '/[.?!]$/u', $text ) );
	}
}
