# An implementation brief

## What the reader does next

An implementation brief is the section of an issue that says how to build it. The engineer builds the change from the brief and the code, with the design doc closed. The reviewer grades the pull request against it. A moderator reads it too, without the design doc. Each of them needs the path of every file that changes and the change under it.

## The rule

Name each file by its path and say what changes in it, one instruction per bullet. A reason goes in as a clause, and only where the brief decides a technical point the engineer would otherwise stop to question. The test is that the engineer opens the files the brief names and never has to guess which one was meant. The steps for the brief and the `Test Coverage` under it are in `docs/context/workflow/write-implementation-brief.md`.

## One example from Site Kit

The owner puts one text here that a person corrected, from Site Kit's own issues, pull requests or reviews. It has three parts, each on its own line. The request, in one line. The text, as it read after the correction. One sentence on why it is right.

## Where the example came from

The issue, the pull request or the review the text came from, by its number.
