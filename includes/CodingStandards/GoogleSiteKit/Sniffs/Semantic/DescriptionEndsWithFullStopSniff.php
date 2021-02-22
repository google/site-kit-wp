<?php
/**
 * Description of every section of the docblock must end with a full stop.
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

class DescriptionEndsWithFullStopSniff implements Sniff
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

        // List of @ comment types to check for full stops.
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

        $lastChar = substr($shortContent, -1);
        if (in_array($lastChar, array('.', '!', '?', ')')) === false && $shortContent !== '{@inheritdoc}'
            // Ignore Features module export files that just use the file name as
            // comment.
            && $shortContent !== basename($phpcsFile->getFilename())
        ) {
            $error = 'Doc comment short description must end with a full stop';
            $fix   = $phpcsFile->addFixableError($error, $shortEnd, 'ShortFullStop');
            if ($fix === true) {
                $phpcsFile->fixer->addContent($shortEnd, '.');
            }
        }

        $long = $phpcsFile->findNext($empty, ($shortEnd + 1), ($commentEnd - 1), true);

        if ($tokens[$long]['code'] === T_DOC_COMMENT_STRING) {

            // Account for the fact that a description might cover multiple lines.
            $longContent = $tokens[$long]['content'];
            $longEnd     = $long;

            // Remove any trailing white spaces which are detected by other sniffs.
            $longContent = trim($longContent);

            // TODO: TODO: take into account multiple line long comments.

            if (preg_match('/[a-zA-Z]$/', $longContent) === 1) {
                $error = 'Doc comment long description must end with a full stop';
                $fix   = $phpcsFile->addFixableError($error, $longEnd, 'LongFullStop');
                if ($fix === true) {
                    $phpcsFile->fixer->addContent($longEnd, '.');
                }
            }
        }

        // Check for full stop on doc block tags.
        $params  = [];
        $maxType = 0;
        $maxVar  = 0;
        foreach ($tokens[$commentStart]['comment_tags'] as $pos => $tag) {

            $commentTagType = $tokens[$tag]['content'];

            // Only check the tag types defined in $docCommentTags.
            if (! in_array( $commentTagType, $docCommentTags ) ) {
                continue;
            }

            $type         = '';
            $comment      = '';
            $commentLines = [];
            if ($tokens[($tag + 2)]['code'] === T_DOC_COMMENT_STRING) {
                $matches = [];
                preg_match('/([^$&.]+)(?:((?:\.\.\.)?(?:\$|&)[^\s]+)(?:(\s+)(.*))?)?/', $tokens[($tag + 2)]['content'], $matches);

                if (empty($matches) === false) {
                    $typeLen   = strlen($matches[1]);
                    $type      = trim($matches[1]);
                    $typeSpace = ($typeLen - strlen($type));
                    $typeLen   = strlen($type);
                    if ($typeLen > $maxType) {
                        $maxType = $typeLen;
                    }
                }

                if (isset($matches[2]) === true) {
                    $var    = $matches[2];
                    $varLen = strlen($var);
                    if ($varLen > $maxVar) {
                        $maxVar = $varLen;
                    }

                    if (isset($matches[4]) === true) {
                        $varSpace       = strlen($matches[3]);
                        $comment        = $matches[4];
                        $commentLines[] = [
                            'comment' => $comment,
                            'token'   => ($tag + 2),
                            'indent'  => $varSpace,
                        ];

                        // Any strings until the next tag belong to this comment.
                        if (isset($tokens[$commentStart]['comment_tags'][($pos + 1)]) === true) {
                            $end = $tokens[$commentStart]['comment_tags'][($pos + 1)];
                        } else {
                            $end = $tokens[$commentStart]['comment_closer'];
                        }

                        for ($i = ($tag + 3); $i < $end; $i++) {
                            if ($tokens[$i]['code'] === T_DOC_COMMENT_STRING) {
                                $indent = 0;
                                if ($tokens[($i - 1)]['code'] === T_DOC_COMMENT_WHITESPACE) {
                                    $indent = $tokens[($i - 1)]['length'];
                                }

                                $comment       .= ' '.$tokens[$i]['content'];
                                $commentLines[] = [
                                    'comment' => $tokens[$i]['content'],
                                    'token'   => $i,
                                    'indent'  => $indent,
                                ];
                            }
                        }
                    }
                }
            }

            $params[] = [
                'tag'          => $tag,
                'tag_type'     => $commentTagType,
                'type'         => $type,
                'comment'      => $comment,
                'commentLines'      => $commentLines,
            ];
        }

        foreach ($params as $pos => $param) {
            // If the type is empty, the whole line is empty.
            if ($param['type'] === '') {
                continue;
            }

            // TODO: TODO: this breaks for full some @return tags as well as multi line comments. 

            $lastChar = substr($param['comment'], -1);
            if ($lastChar !== '.') {
                $error = "Tag {$param['tag_type']} description must end with a full stop";

                $phpcsFile->addError($error, $param['tag'], 'TagFullStop');
            }
        }
    }
}
