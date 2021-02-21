<?php
/**
 * Description of every element in the doc block must start with a capital letter.
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

class DescriptionStartsWithCapitalLetterSniff implements Sniff
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

        $empty = array(
                  T_DOC_COMMENT_WHITESPACE,
                  T_DOC_COMMENT_STAR,
                 );

        // List of @ comment types to check for capitalisation.
        $docCommentTags = array(
            '@param',
            '@property',
            '@return',
        );

        $short = $phpcsFile->findNext($empty, ($stackPtr + 1), $commentEnd, true);

        // Account for the fact that a short description might cover
        // multiple lines.
        $shortContent = $tokens[$short]['content'];
        $shortEnd     = $short;

        // Remove any trailing white spaces which are detected by other sniffs.
        $shortContent = trim($shortContent);

        if (preg_match('|\p{Lu}|u', $shortContent[0]) === 0 && $shortContent !== '{@inheritdoc}'
            // Ignore Features module export files that just use the file name as
            // comment.
            && $shortContent !== basename($phpcsFile->getFilename())
        ) {
            $error = 'Doc comment short description must start with a capital letter';
            // If we cannot capitalize the first character then we don't have a
            // fixable error.
            if ($tokens[$short]['content'] === ucfirst($tokens[$short]['content'])) {
                $phpcsFile->addError($error, $short, 'ShortNotCapital');
            } else {
                $fix = $phpcsFile->addFixableError($error, $short, 'ShortNotCapital');
                if ($fix === true) {
                    $phpcsFile->fixer->replaceToken($short, ucfirst($tokens[$short]['content']));
                }
            }
        }

        $long = $phpcsFile->findNext($empty, ($shortEnd + 1), ($commentEnd - 1), true);

        if ($tokens[$long]['code'] === T_DOC_COMMENT_STRING) {

            if (preg_match('|\p{Lu}|u', $tokens[$long]['content'][0]) === 0
                && $tokens[$long]['content'] !== ucfirst($tokens[$long]['content'])
            ) {
                $error = 'Doc comment long description must start with a capital letter';
                $fix   = $phpcsFile->addFixableError($error, $long, 'LongNotCapital');
                if ($fix === true) {
                    $phpcsFile->fixer->replaceToken($long, ucfirst($tokens[$long]['content']));
                }
            }
        }

        // Look through all @ comments in the current doc comment.
        $currentToken = $phpcsFile->findNext(T_DOC_COMMENT_TAG, ($shortEnd + 1), ($commentEnd - 1));
        while ($currentToken) {

            $commentTagType = $tokens[$currentToken]['content'];

            // Check to see if this token is an @ comment in the $docCommentTags array.
            if ($tokens[$currentToken]['code'] === T_DOC_COMMENT_TAG && in_array( $commentTagType, $docCommentTags )) {

                // Find the @ tag comment if there is one.
                // $nextTag = $phpcsFile->findNext([T_DOC_COMMENT_TAG, T_DOC_COMMENT_CLOSE_TAG], ($currentToken + 1), ($commentEnd - 1));
                $tagComment = $phpcsFile->findNext(T_DOC_COMMENT_STRING, ($currentToken + 1), ($commentEnd - 1));

                // Check each comment for capitalisation.
                if($tagComment) 
                    $fullTagComment = $tokens[$tagComment]['content'];{

                    $tagDescription = false;
                    if($commentTagType === '@return') {
                        // Tags with the type description structure.

                        // Remove the type string from the description.
                        $tagDescription = preg_replace("/^(\w+\s)/", '', $fullTagComment);
                    } else {
                        // Comments with the type $variable description structure.

                        // Split the Class and variable name from the tag description.
                        $splitTagComment = preg_split('/\$[\w\d]+\ /', $fullTagComment);
                        if(count($splitTagComment) >= 2) {
                            // Get the pure description if there is one.
                            $tagDescription = $splitTagComment[1];
                        }
                    }

                    // Check for capital letter.
                    if ($tagDescription 
                        && preg_match('|\p{Lu}|u', $tagDescription[0]) === 0
                        && $tagDescription !== ucfirst($tagDescription)
                    ) {
                        $error = "Tag $commentTagType comment description must start with a capital letter";
                        $fix   = $phpcsFile->addFixableError($error, $currentToken, 'TagNotCapital');
                        if ($fix === true) {
                            $fixedTagComment = str_replace( $tagDescription, ucfirst($tagDescription), $fullTagComment );

                            $phpcsFile->fixer->replaceToken($tagComment, $fixedTagComment);
                        }
                    }
                }

            }
            // Look through all @ comments in the current doc comment.
            $currentToken = $phpcsFile->findNext(T_DOC_COMMENT_TAG, ($currentToken + 1), ($commentEnd - 1));
        }
    }
}
