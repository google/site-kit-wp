# Contributing and Maintaining

First, thank you for taking the time to contribute!

The following is a set of guidelines for contributors as well as information and instructions around our maintenance process. The two are closely tied together in terms of how we all work together and set expectations, so while you may not need to know everything in here to submit an issue or pull request, it's best to keep them in the same document.

Contributing isn't just writing code - it's anything that improves the project. Here are some ways you can help:

## Reporting Bugs and Suggesting Enhancements

If you're running into an issue with the plugin or intend to request a new feature or enhancement...

* please take a look through [existing issues](https://github.com/google/site-kit-wp/issues) first
* [open a new issue](https://github.com/google/site-kit-wp/issues/new) if needed
* follow the guidelines specified in the issue template, particularly include steps to reproduce, environment information, and screenshots/screencasts as relevant if you are able to

We will take a look at your issue and either assign it keywords and a milestone or get back to you if there are open questions.

## Contributing Code

Before contributing code, make sure to outline and discuss the proposed enhancement or bug fix in an issue first.

When contributing code...

* fork the `master` branch of the repository on GitHub
* make changes to the forked repository
    * write code that is backward-compatible with WordPress 4.7 and PHP 5.4
    * make sure you stick to the [WordPress](https://make.wordpress.org/core/handbook/best-practices/coding-standards/) coding standards
    * make sure you document the code properly
    * test your code with the constant `WP_DEBUG` enabled
* when committing, in addition to a note about the fix, please reference your issue
* push the changes to your fork and [submit a pull request](https://github.com/google/site-kit-wp/compare) to the `master` branch
* follow the guidelines specified in the pull request template

After that we will review the pull-request as soon as possible and either merge it, make suggestions on improvements or ask you for further details about your implementation.

### Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License
Agreement. You (or your employer) retain the copyright to your contribution;
this simply gives us permission to use and redistribute your contributions as
part of the project. Head over to <https://cla.developers.google.com/> to see
your current agreements on file or to sign a new one.

You generally only need to submit a CLA once, so if you've already submitted one
(even if it was for a different project), you probably don't need to do it
again.

### Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Providing Translations

When providing translations...

* visit our project on [translate.wordpress.org](https://translate.wordpress.org/projects/wp-plugins/google-site-kit) and sign in with your wordpress.org account (create one if you haven't yet)
* select the language you would like to contribute to
* provide the missing translations
    * make sure you follow the guidelines outlined in the [Translator Handbook](https://make.wordpress.org/polyglots/handbook/translating/expectations/)
    * stick to the translation conventions for your locale (if there are any) - you can find these [here](https://make.wordpress.org/polyglots/handbook/tools/list-of-glossaries-per-locale/)

After having provided translations, a translation editor will review your submissions soon and approve them as appropriate.

## Workflow

The `master` branch is the development branch which means it contains the next version to be released. `stable` contains the current latest release and `develop` contains the current - unstable - work in progress. When contributing, always branch from the `master` branch and open up PRs against `master`.

## Community Guidelines

This project follows
[Google's Open Source Community Guidelines](https://opensource.google.com/conduct/).
