<?php
/**
 * Short description of every function and method docblock must start with a third person verb.
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

class DescriptionStartsWithThirdPersonVerbSniff implements Sniff
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

        $lastToken = ($phpcsFile->numTokens - 1);

        $empty = array(
                  T_DOC_COMMENT_WHITESPACE,
                  T_DOC_COMMENT_STAR,
                 );

        $short = $phpcsFile->findNext($empty, ($stackPtr + 1), $commentEnd, true);

        // Account for the fact that a short description might cover
        // multiple lines.
        $shortContent = $tokens[$short]['content'];

        // Search between this comment and the next.
        $nextComment = $phpcsFile->findNext(T_DOC_COMMENT_OPEN_TAG, ($stackPtr + 1));
        
        // If this is the last comment we need to check between the comment and the end of the file to find it's subject.
        if(!$nextComment) {
            $nextComment = $lastToken;
        }

        // Only continue if this comment is on a method or function.
        $isFunction = $phpcsFile->findNext(T_FUNCTION, ($stackPtr + 1), ($nextComment - 1) );

        // Remove any trailing white spaces which are detected by other sniffs.
        $shortContent = trim($shortContent);

        // Only check for third person verb on the short description of functions and methods.
        if ( $isFunction && $shortContent ) {

            $firstWord = strtok($shortContent, " "); 
            $lastLetter = substr($firstWord, -1, 1);

            if ($lastLetter !== 's') {
                $error = 'Doc comment short description must start with third person verb';
                $phpcsFile->addError($error, $short, 'ShortNotCapital');
            }
        }
    }
}
