<?php
/**
 * Doc blocks for every properfy .
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

class CommentHasSinceTag implements Sniff
{
    /**
     * Returns the token types that this sniff is interested in.
     *
     * @return array(int)
     */
    public function register()
    {
        return array(T_DOC_COMMENT_OPEN_TAG); 
    }

    /**
     * Processes this sniff, when one of its tokens is encountered.
     *
     * @param \PHP_CodeSniffer\Files\File $phpcsFile The current file being checked.
     * @param int                         $stackPtr  The position of the current token in the
     *                                               stack passed in $tokens.
     *
     * @return void
     */
    public function process(File $phpcsFile, $stackPtr)
    {
        $tokens       = $phpcsFile->getTokens();
        $commentEnd   = $phpcsFile->findNext(T_DOC_COMMENT_CLOSE_TAG, ($stackPtr + 1));
        $commentStart = $tokens[$commentEnd]['comment_opener'];

        // Check for full stop on doc block tags.
        $hasSinceTag = false;
        foreach ($tokens[$commentStart]['comment_tags'] as $pos => $tag) {

            $commentTagType = $tokens[$tag]['content'];

            // Only check the tag types defined in $docCommentTags.
            if ($commentTagType === '@since' ) {
                $hasSinceTag = true;
                continue;
            }
        }

        if ( ! $hasSinceTag ) {
            $error = "Doc comment must include a @since tag";

            $phpcsFile->addError($error, $stackPtr, 'MissingSinceTag');
        }
    }
}
