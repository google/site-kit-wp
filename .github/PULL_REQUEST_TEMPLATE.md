## Summary

<!-- Please reference the issue this PR addresses. -->
Addresses issue #

## Relevant technical choices

<!-- Please describe your changes. -->

## Checklist

- [ ] My code is tested and passes existing unit tests.
- [ ] My code has an appropriate set of unit tests which all pass.
- [ ] My code is backward-compatible with WordPress 4.7 and PHP 5.6.
- [ ] My code follows the [WordPress](https://make.wordpress.org/core/handbook/best-practices/coding-standards/) coding standards.
- [ ] My code has proper inline documentation.
- [ ] I have added a QA Brief on the issue linked above.
- [ ] I have signed the Contributor License Agreement (see <https://cla.developers.google.com/>).

## Code Review Checklist

- [ ] **Run the code.** _Do not just look at the code (the “minimum” code review), but also briefly test it in your development environment, especially if the pull request touches production code. This should explicitly not be QA, but a basic “sanity check” that the PR is not significantly off or even broken. For example:_
  * _For any user-facing change (e.g. widget-related, or in a setup flow), visit the respective area in the plugin to check that there’s no fatal error or JS error and that at a high level it looks okay._
  * _Specifically if there’s a UI change, look at the respective UI in the plugin to at least check that it doesn’t look obviously broken on all breakpoints._
- [ ] **Ensure the acceptance criteria are covered.** _Sometimes, even when a PR works as expected, the implementation may have missed a point from the acceptance criteria. You can sometimes cross-compare and spot that even from looking at the code, but at least when running it. Per the above, you don’t need to 100% verify that the implementation works correctly in the plugin, especially if it requires some special setup - but you at least need to verify that every point in the acceptance criteria is at least somewhat “covered” by the implementation._
- [ ] **Stay open-minded.** _The implementation brief is highly important and should typically be followed, but sometimes it can happen that only in the code review an approach shows to be not as efficient as originally envisioned in the implementation brief. Basically, while the acceptance criteria are requirements, the implementation brief is more of a proposal (a proposal that’s already been reviewed and approved though!) on how to meet these requirements. So feel free to make suggestions that diverge from the IB if the current approach has problems. Be reasonable with it though - if it’s a tiny thing where you think another method name is better, that’s probably not worth diverging from the IB for_ :smile:
- [ ] **Ensure CI checks pass.** _If PHPUnit or Jest tests fail, that is usually a sign that the PR requires something to be fixed. Visual regression and e2e tests can be unstable, so if those fail, it’s worth rerunning them. If they keep failing with the same error, it’s likely the problem is caused by the PR, so it needs to be addressed._
- [ ] **Check Storybook where applicable.** _If the PR encompasses JS logic or UI changes for which there’s a Storybook story (at least the case for any widgets and module setup flows), open the respective stories to give a high-level check they still look right and, at a minimum, are not broken with a JS error. Again, as mentioned above this should explicitly not be QA, but a basic “sanity check”._
- [ ] **Ensure there is a QA Brief.** _As mentioned above, it is the responsibility of the PR author to also add a QA Brief to the issue. Before approving the PR, check that the author has kept in mind to add it to the respective issue. Also give it a high-level review whether it satisfies the acceptance criteria and is understandable._

## Merge Review Checklist

- [ ] **Ensure the PR has the correct target branch.** _If a PR fixes something in the upcoming release which has already been branched off into the “main” branch, the PR also must be based on and target that branch. Otherwise, “develop” is correct, but this needs to be paid special attention to once the upcoming release has been branched off - it can be especially relevant for follow-up PRs to other PRs for the same issue._
- [ ] **Double-check that the PR is okay to be merged.** _This is rarely relevant, but sometimes the PR description or issue has some special requirement where it requires some final sign-off before merge, e.g. if it depends on an external change to be made first. But more usually, this is important to consider while in that short time period where we are close to branching off the upcoming release into “main” but it has not been done yet: Every Monday of the second week of the sprint, we define which issues should land in the upcoming release and which should not. Shortly after (sometimes up to 1 day later though), the upcoming release is branched off into “main”. In that brief period in between, special caution is advised._
- [ ] **Ensure the corresponding issue has a ZenHub release assigned.** _No pull request should ever be merged without its corresponding issue having a ZenHub release. If you are merging a PR, add the upcoming release to its issue. The one exception is the case when you merge a PR into the “develop” branch after the upcoming release has already been branched off into the “main” branch - in that case the PR will only go out in the following release, so in that case you need to add that release to the issue instead of the upcoming one._
- [ ] **Add a changelog message to the issue.** _By the time a PR gets merged, the issue must have a changelog message, and it is the responsibility of the merge reviewer to add it, unless it was already added before. If an issue is irrelevant for end users (often applies e.g. to infrastructure changes), use “N/A”._