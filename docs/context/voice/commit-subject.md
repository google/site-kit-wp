# A commit subject

## What the reader does next

The person reads the subject in a list of commits, one line each, and stops at the change they are looking for. They open a commit only when its subject says it is the one. A subject that names the issue number and nothing else makes them open every commit of that issue.

## The rule

Say what changed. The test is that a reader who knows what they are looking for finds the commit from the subject alone. A subject that names the issue and stops fails that test, because every commit of the issue then reads the same.

## One example from Site Kit

The owner puts one text here that a person corrected, from Site Kit's own issues, pull requests or reviews. It has three parts, each on its own line. The request, in one line. The text, as it read after the correction. One sentence on why it is right.

## Where the example came from

The issue, the pull request or the review the text came from, by its number.
