# An issue

## What the reader does next

The engineer who writes the implementation brief reads the issue, and so does the engineer who builds the change. The tester tests the change against the issue, and the reviewer grades the pull request against it. Some of them read the issue months after the design doc was written, and none of them has that doc open. The issue has to stand on its own.

## The rule

Say what is wrong or missing today, what the user gets, and what a tester sees in Site Kit when it works. The test is that a reader who never saw the design doc can build the change and check it from the issue alone. A sentence about how the design was decided fails that test, so it goes. The sections of an issue come from `.github/ISSUE_TEMPLATE/feature_request.md` or `.github/ISSUE_TEMPLATE/bug_report.md`. The steps for the description and the `Acceptance criteria` are in `docs/context/workflow/write-issue-requirements.md`.

## One example from Site Kit

The owner puts one text here that a person corrected, from Site Kit's own issues, pull requests or reviews. It has three parts, each on its own line. The request, in one line. The text, as it read after the correction. One sentence on why it is right.

## Where the example came from

The issue, the pull request or the review the text came from, by its number.
