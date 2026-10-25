# Generated insight — thumbs up and down on each part, sent to the AI feedback endpoint

GitHub issue: [#13950](https://github.com/google/site-kit-wp/issues/13950)

## Feature Description

This issue adds a thumbs up and a thumbs down button to each part of the generated insight ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-13136&m=dev)): the teaser on the Traffic Overview tab (#13947), and the traffic performance and the primary drivers on the Typical Traffic tab (#13948). Each part has its own vote, because one part can be wrong while another part is right.

The buttons use `FeedbackPrompt` (#13801) in its hover placement, in the top-right corner of the part. What is new is where a vote goes. It is sent with `POST:benchmarking-insight-feedback` (#13949), linked to the generation that wrote the text, and not as a survey trigger. So `FeedbackPrompt` gets an option that gives the vote and the reason to the caller, instead of sending them itself. The Typical Traffic chart and the key factor cards do not use this option, and keep sending their votes as before.

A vote is sent as soon as the reader clicks. After a thumbs down, the reason that the reader chooses is sent as a second vote. When the service accepts a vote, the part shows the vote as pressed and does not ask again about the same text. This is kept in `localStorage` for two days, so a new tab does not ask again either.

Some things are still open, and they block the acceptance of this issue: which tokens the reasons send, what the teaser's thumbs down asks, and where the notice that a vote is sent to Google goes. The service must also store `surface` before this issue can be accepted on the live endpoint.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Insight feedback", "Internal Measurement: GA4 Events" and "Dashboard sharing")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `trafficInsights` enabled, the teaser, the traffic performance part and the primary drivers part each have a thumbs up and a thumbs down button in their top-right corner. The buttons appear on hover and on keyboard focus, like the buttons on a key factor card (#13801).
* The buttons are shown only when the insight has arrived. The teaser's buttons are shown only when there is a teaser.
* Clicking thumbs up on the traffic performance part sends one `POST:benchmarking-insight-feedback` request with the insight's `interactionID` and `scenario`, `surface: 'text'`, `sentiment: 'POSITIVE'` and no `reasons`. The teaser sends `surface: 'teaser'`, and the primary drivers part sends `surface: 'driver'`.
* Clicking thumbs down sends one request with `sentiment: 'NEGATIVE'`, and opens `What seems off?` with the reasons of the part:

  | Part | Reasons |
  | :---- | :---- |
  | Traffic performance | `My traffic didn’t change like this`, `Hard to understand`, `Too obvious to be useful` |
  | Primary drivers | `Leaves out an important traffic source or page`, `Too obvious to be useful`, `Too hard to understand` |

* Choosing `My traffic didn’t change like this` sends one more request, with `sentiment: 'NEGATIVE'` and `reasons: [ 'INACCURATE_DATA' ]`. Closing the menu without a choice sends nothing more.
* After the service accepts a vote, the part shows that thumb as pressed for two days. In that time, the part sends no more votes for the same generation, on this mount, on a later mount, or in a new tab. Only the reason after a thumbs down is still sent.
* When a vote request fails, nothing is stored, and the part asks for a vote again on the next mount.
* A vote on one part leaves the other two parts of the same generation unanswered.
* A vote on the insight sends no survey trigger and no other feedback request.
* Each vote also sends the GA4 event `vote_up` or `vote_down` in the category `<viewContext>_traffic-insights-survey`, such as `mainDashboard_traffic-insights-survey`, with the label `teaser`, `text` or `driver`.
* The view-only dashboard shows no buttons on the insight.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
