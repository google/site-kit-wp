# Benchmarking payload — the key factor cards as the service's `decomposition`

GitHub issue: [#13944](https://github.com/google/site-kit-wp/issues/13944)

## Feature Description

The Typical Traffic tab shows up to three key factor cards (#13845, #13601). The "primary drivers" part of the insight should describe the same cards. So the payload (#13943) sends these cards to the service as `decomposition`. The service writes the drivers text from exactly these cards, and it selects no cards of its own.

The panel's cards do not have the shape that the service expects. The service checks every `decomposition` against its own card model. When one card breaks a rule, it refuses the whole request with a `400`. The service also writes about four figures without checking them: `excess`, `traffic_impact_pct`, `outsized` and `is_large_share`. This issue translates the cards into the service's model, and calculates these figures with the service's own definitions.

Two things that the panel can show have no counterpart in the service's model: a search keyword card, and a traffic channel attribute on a landing page card or a campaign card. How the payload sends them is still an open question. These two cases are added to this issue when the question is decided.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Key factor cards", "Technical debt" and "Request and response field mapping")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* Each card keeps its kind: a channel card is sent as `CHANNEL`, a landing page card as `CONTENT`, a referring site card as `REFERRING_SITE`, and a campaign card as `CAMPAIGN`. No card is sent as `CHANNEL_GROUP`.
* Each card attribute is sent as a row:

  | Attribute | Row |
  | :---- | :---- |
  | Landing page | `TARGET_PAGE` |
  | Referring site, platform | `SOURCE_TYPE`, `Referring site` |
  | Campaign | `SOURCE_TYPE`, `Campaign` |
  | Search keyword | `SOURCE_TYPE`, `Search keyword` |
  | Device | `READER_DEVICE` |
  | User type | `VISITOR_TYPE` |

* A row's share is its change divided by its card's change. A row with a share of a quarter or more is part of the card's decomposition. A row with a smaller share is context.
* A `Search keyword` row is always context, and its share is of the change in the site's search clicks. A keyword row with less than a quarter of that change is not sent.
* A row whose value changed more than its own card is not sent.
* `opening_sessions` and `closing_sessions` are the site's visits in the previous and the current 28 days. `residual_delta` makes the cards' changes add up to the difference between these two totals.
* Each card's role, share basis, metric type, `excess`, `traffic_impact_pct`, `outsized` and `is_large_share`, and the `shape` of the `decomposition`, follow the service's definitions.
* A `decomposition` built from any card that the panel can show, other than the two open cases, passes the service's validation.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
