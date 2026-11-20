# Terminology

This doc is the source of truth for how Site Kit writes product names, feature names, and other
terms in user-facing copy: UI strings, notices, emails, help text, and error messages. It also
sets the spelling and punctuation rules for that copy. Use it when you write copy, and when you
review a change that adds or edits copy.

Designs and issue text are not reliable sources for capitalization. The same term can appear in
two forms in one Figma view. When a design, an issue, or existing code disagrees with this doc,
follow this doc and point out the difference on the issue or pull request.

## General rules

-   Site Kit uses sentence case for headings, labels, buttons, and links. Capitalize the first word
    and proper nouns only: "Return to dashboard", "Placement settings".
-   A proper noun keeps its capitalization everywhere: in the middle of a sentence, in a link, and
    in a button label.
-   A common noun is lowercase unless it starts a sentence, heading, or label. "Dashboard" is correct
    as the first word of a label. It is wrong in "Return to Dashboard".
-   When copy names a labeled element of the WordPress admin, such as a menu item, match that
    label exactly.
-   Keep the casing of an abbreviation inside a common term: "measurement ID", not "measurement id".
-   When a term belongs to a Google service and this doc does not list it, match the casing that
    the service uses in its own UI and help pages.
-   When a term is not in this doc and the change uses it in more than one form, do not guess.
    Raise it on the issue or pull request so someone can decide. Then add the decision to this doc.

## Spelling and punctuation

These rules apply to every translatable source string, in JavaScript and in PHP.

-   Use American English spelling: "color", "behavior", "analyze", "customize", "organization",
    "canceled", "center".
-   Use the Oxford comma. In a list of three or more items, put a comma before the final "and" or
    "or": "Analytics, Search Console, and AdSense", not "Analytics, Search Console and AdSense".

## Modules and Google services

Refer to a module by its module name, without the "Google" prefix. Every service Site Kit
connects is a Google service, so the prefix adds nothing. Use the full service name only when the
copy refers to the external service itself or its web UI: "View the report in Google Analytics".

| Module name            | Full service name         | Wrong forms                            |
| ---------------------- | ------------------------- | -------------------------------------- |
| Analytics              | Google Analytics          | Google analytics                       |
| Search Console         | Google Search Console     | Search console, search console         |
| AdSense                | Google AdSense            | Adsense, adsense                       |
| Ads                    | Google Ads                | Google ads                             |
| Tag Manager            | Google Tag Manager        | Tag manager                            |
| PageSpeed Insights     | Google PageSpeed Insights | Pagespeed Insights, PageSpeed insights |
| Reader Revenue Manager | Reader Revenue Manager    | Reader revenue manager                 |
| Sign in with Google    | Sign in with Google       | Sign In With Google                    |
| Site Verification      | Google Site Verification  | Site verification                      |

"Sign in with Google" capitalizes only "Sign" and "Google", even mid-sentence. As a plain verb
phrase it is lowercase: "Visitors can sign in with Google".

## Other proper nouns

Always capitalize these terms as shown.

| Term                      | Wrong forms                        | Notes                                                                                              |
| ------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Site Kit                  | Sitekit, Site kit, site kit        | The plugin. The full name is "Site Kit by Google".                                                 |
| Publisher Center          | Publisher center, publisher center | The Google tool where publishers manage publications. Reader Revenue Manager is one product in it. |
| WordPress                 | Wordpress                          |                                                                                                    |
| Core Web Vitals           | Core web vitals                    |                                                                                                    |
| Largest Contentful Paint  | Largest contentful paint           | A Core Web Vitals metric.                                                                          |
| Cumulative Layout Shift   | Cumulative layout shift            | A Core Web Vitals metric.                                                                          |
| Interaction to Next Paint | Interaction to next paint          | A Core Web Vitals metric.                                                                          |
| First Contentful Paint    | First contentful paint             | A PageSpeed Insights metric.                                                                       |
| Total Blocking Time       | Total blocking time                | A PageSpeed Insights metric.                                                                       |

## Common nouns

These terms are lowercase unless they start a sentence, heading, or label.

| Term                 | Wrong forms                                | Notes                                                                                                           |
| -------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| dashboard            | Dashboard                                  | Site Kit's dashboard, including "Site Kit dashboard". For the WordPress admin menu item, see the general rules. |
| settings             | Settings                                   | Site Kit's settings, including "Site Kit settings".                                                             |
| visitor groups       | Visitor Groups                             | The user-facing name of the feature. Do not use "audience segmentation" in user-facing copy.                    |
| Google tag           | Google Tag                                 | Only "Google" is capitalized.                                                                                   |
| property             | Property                                   | An Analytics or Search Console property.                                                                        |
| web data stream      | Web Data Stream, Web data stream           |                                                                                                                 |
| measurement ID       | Measurement ID, measurement id             |                                                                                                                 |
| conversion events    | Conversion Events                          |                                                                                                                 |
| enhanced measurement | Enhanced Measurement, Enhanced measurement |                                                                                                                 |
| consent mode         | Consent Mode, Consent mode                 |                                                                                                                 |
| publication          | Publication                                | An entity in Publisher Center. It is not specific to Reader Revenue Manager.                                    |
| sign-up form         | signup form, sign up form                  | Hyphenated, as Reader Revenue Manager writes "Newsletter sign-up". The verb is "sign up".                       |

## Changing this doc

-   Add a term only after a decision is made, for example in a design review or on an issue. Put
    it in the right table with its wrong forms.
-   Fix existing strings that break a rule in a separate change, not as part of an unrelated one.
