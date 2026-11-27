# A code comment

## What the reader does next

The engineer who edits the file next reads the comment, then changes the code under it. They trust the comment to say what the code does today. A comment that says what the code did before the last change makes them change the wrong thing.

## The rule

Say what is true now. A reason stays where it is still true, and a note on what the code did before goes. The test is that the comment is true for a reader who has never seen the history of the file. A PHPDoc block, the comment above a PHP class or method, keeps the form `docs/context/php/naming-conventions.md` gives it.

## One example from Site Kit

The owner puts one text here that a person corrected, from Site Kit's own issues, pull requests or reviews. It has three parts, each on its own line. The request, in one line. The text, as it read after the correction. One sentence on why it is right.

## Where the example came from

The issue, the pull request or the review the text came from, by its number.
