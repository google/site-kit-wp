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

class CommentTagsCorrectlyGrouped implements Sniff
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

        // List of @ comment types to check.
        $docCommentTags = array(
            '@since',
            '@deprecated',
            '@access',
            '@static',
            '@global',
            '@var',
            '@param',
            '@return'
        );

        // List how the @ tags should be grouped.
        $docCommentTagsGroups = array(
            [
                '@since',
                '@deprecated',
                '@access',
                '@static'
            ],
            [
                '@global'
            ],
            [
                '@var',
                '@param',
                '@return'
            ],
        );
        
        // Check for full stop on doc block tags.
        $params  = [];
        $maxType = 0;
        $maxVar  = 0;
        foreach ($tokens[$commentStart]['comment_tags'] as $pos => $tag) {

            $commentTagType = $tokens[$tag]['content'];
            $tagToken = $tag;

            // Only check the tag types defined in $docCommentTags.
            if (! in_array( $commentTagType, $docCommentTags ) ) {
                continue;
            }

            $type          = '';
            $comment       = '';
            $commentLines  = [];
            if ($tokens[($tag + 2)]['code'] === T_DOC_COMMENT_STRING) {
                $matches = [];
                preg_match('/([^$&.]+)(?:((?:\.\.\.)?(?:\$|&)[^\s]+)(?:(\s+)(.*))?)?/', $tokens[($tag + 2)]['content'], $matches);

                if (empty($matches) === false) {
                    $typeLen   = strlen($matches[1]);
                    $type      = trim($matches[1]);
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

            // Find the number of blank lines after this tag by looking for the number of stars before the next comment.

            // Find the next element that is not a star or whitespace (the next comment location)
            $nextCommentTag = $phpcsFile->findNext([T_DOC_COMMENT_TAG], $tagToken + 1, null);
            $endOfCommentBlock = $phpcsFile->findNext([T_DOC_COMMENT_CLOSE_TAG], $tagToken + 1, null);

            // Stop the search at the end of each comment block.
            if( $endOfCommentBlock < $nextCommentTag ) {
                $nextCommentTag = $endOfCommentBlock;
            }

            $currentPosition = $tagToken;
            $stars = 0;
            $nextStar = true;
            while ( $nextStar ) {
                $nextStar = $phpcsFile->findNext([T_DOC_COMMENT_STAR], $currentPosition, $nextCommentTag);

                if( $nextStar ) {
                    $stars = $stars + 1;
                    $currentPosition = $nextStar + 1;
                }
            }

            // Subtract the total lines of the current tag comment to account for multi line comments.
            $blankLineOffset = 1;
            if( count( $commentLines ) > 1 ) {
                $blankLineOffset = count($commentLines);
            }
            // echo "commentTagType $commentTagType blankLineOffset $blankLineOffset \n\n";
            $commentBlankLines = $stars;
            if($commentBlankLines > 0 ){
                $commentBlankLines = $stars - $blankLineOffset;
            }

            $params[] = [
                'tag'               => $tag,
                'tag_type'          => $commentTagType,
                'tag_token'         => $tagToken, // TODO: unify camel case
                'type'              => $type,
                'comment'           => $comment,
                'commentLines'      => $commentLines,
                'commentBlankLines' => $commentBlankLines,
            ];
        }

        // Track the previous and next tags to check the order is correct. 
        $previousTags = [];
        $nextTags = $params;

        while (count($nextTags) > 0) {
            // Remove the current tag.
            $currentTag = array_shift($nextTags);
            $currentTagType = $currentTag['tag_type'];
            $currentTagBlankLines = $currentTag['commentBlankLines'];
            
            // Get the next tag to compare with the current.
            if(empty($nextTags)) {
                break;
            }
            $nextTag = $nextTags[0];
            $nextTagType = $nextTag['tag_type'];

            $currentTagGroup = array();
            foreach ($docCommentTagsGroups as $commentTagGroup) {
                if(in_array($currentTagType, $commentTagGroup)) {
                    $currentTagGroup = $commentTagGroup;
                }
            }

            // Check if the next tag is allowed in this group and is not separated by a blank line.
            if( ! in_array($nextTagType, $currentTagGroup ) && $currentTagBlankLines === 0) {
                $error = "Missing blank line between $currentTagType tag and $nextTagType tag";
                $phpcsFile->addError($error, $currentTag['tag_token'], 'TagGrouping');
            }

            // Check if the next tag should be grouped with the current one but is spearated by a blank line.
            if( in_array($nextTagType, $currentTagGroup ) && $currentTagBlankLines > 0) {
                $error = "Blank line not allowed between $currentTagType tag and $nextTagType tag";
                $phpcsFile->addError($error, $currentTag['tag_token'], 'TagGrouping');
            }

            // Add the tag we have checked into the $previousTags array.
            $previousTags[] = $currentTag;
        }

    }
}
