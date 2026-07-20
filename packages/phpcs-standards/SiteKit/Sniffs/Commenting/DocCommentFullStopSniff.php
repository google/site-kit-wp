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
	 * @return array Token types to listen for.
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
	 * @return void Errors are emitted on the file directly.
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
			$phpcs_file->fixer->replaceToken( $last_ptr, $this->append_full_stop_preserve_newline( $tokens[ $last_ptr ]['content'] ) );
		}
	}

	/**
	 * Check inline comments for full stop.
	 *
	 * @param File $phpcs_file The file being scanned.
	 * @param int  $stack_ptr  Current token position.
	 * @return void No return value.
	 */
	private function check_inline_comment( File $phpcs_file, $stack_ptr ) {
		$tokens = $phpcs_file->getTokens();
		$line   = $tokens[ $stack_ptr ]['line'];

		if ( ! $this->is_inline_double_slash_comment( $tokens[ $stack_ptr ]['content'] ) ) {
			return;
		}

		// Only process if this is the first line of a contiguous // comment block.
		$prev_comment_ptr = $phpcs_file->findPrevious( T_COMMENT, $stack_ptr - 1 );
		if (
			false !== $prev_comment_ptr
			&& $this->is_inline_double_slash_comment( $tokens[ $prev_comment_ptr ]['content'] )
			&& ( $line - 1 ) === $tokens[ $prev_comment_ptr ]['line']
		) {
			return;
		}

		// Collect this block (current + any following // lines).
		$block_ptrs = array( $stack_ptr );
		$last_line  = $line;
		$next_ptr   = $stack_ptr;

		while ( true ) {
			$next_comment_ptr = $phpcs_file->findNext( T_COMMENT, $next_ptr + 1 );

			if ( false === $next_comment_ptr ) {
				break;
			}

			if ( ! $this->is_inline_double_slash_comment( $tokens[ $next_comment_ptr ]['content'] ) ) {
				break;
			}

			if ( ( $last_line + 1 ) !== $tokens[ $next_comment_ptr ]['line'] ) {
				break;
			}

			$block_ptrs[] = $next_comment_ptr;
			$last_line    = $tokens[ $next_comment_ptr ]['line'];
			$next_ptr     = $next_comment_ptr;
		}

		// Take the last non-empty line in this block.
		$last_ptr = null;
		foreach ( array_reverse( $block_ptrs ) as $ptr ) {
			$content = trim( preg_replace( '#^\s*/{2,}\s*#', '', $tokens[ $ptr ]['content'] ) );
			if ( '' !== $content ) {
				$last_ptr = $ptr;
				break;
			}
		}

		if ( null === $last_ptr ) {
			return;
		}

		$last_content = trim( preg_replace( '#^\s*/{2,}\s*#', '', $tokens[ $last_ptr ]['content'] ) );

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
			$new = $this->append_full_stop_preserve_newline( $tokens[ $last_ptr ]['content'] );
			$phpcs_file->fixer->replaceToken( $last_ptr, $new );
		}
	}

	/**
	 * Checks whether a comment token is an inline double-slash comment.
	 *
	 * @param string $content Token content.
	 * @return bool True if the token is a // comment.
	 */
	private function is_inline_double_slash_comment( $content ) {
		return 1 === preg_match( '#^\s*//+#', $content );
	}

	/**
	 * Appends a full stop while preserving any trailing newline characters.
	 *
	 * @param string $content Token content.
	 * @return string Updated token content.
	 */
	private function append_full_stop_preserve_newline( $content ) {
		$line_ending = '';

		if ( 1 === preg_match( '/\R$/', $content, $matches ) ) {
			$line_ending = $matches[0];
			$content     = substr( $content, 0, -strlen( $line_ending ) );
		}

		return rtrim( $content ) . '.' . $line_ending;
	}

	/**
	 * Check if text needs a full stop.
	 *
	 * @param string $text The text to check.
	 * @return bool True if a full stop is needed, false otherwise.
	 */
	private function needs_full_stop( $text ) {
		// Ignore if it already ends correctly.
		return ( 1 !== preg_match( '/[.?!]$/u', $text ) );
	}
}
