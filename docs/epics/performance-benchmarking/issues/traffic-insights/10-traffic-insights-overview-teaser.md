# Traffic Overview tab — generated insight teaser

GitHub issue: [#13947](https://github.com/google/site-kit-wp/issues/13947)

## Feature Description

The Traffic Overview tab shows the site's numbers, but it does not say what they mean. This issue adds a one-line teaser from the generated insight at the top of the tab ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=740-40731&m=dev)). It adds the `GeneratedInsight` component. The Typical Traffic tab also uses this component for the full insight (#13948).

The teaser shows `teaser` from the insight in the `benchmarking` slice (#13946). The service puts each period in one of eleven scenarios, and each scenario has its own icon and emphasis. A scenario that the plugin does not know gets a default treatment, so a scenario that the service adds later still looks right. The service marks names in bold with `**…**`. The component shows them in bold, and shows everything else as plain text, because the text is written by AI.

This issue shows only an insight that has arrived. The placeholder while the insight is coming, and the state when it is not coming, are added in #13952.

The service counts visits, but the Traffic Overview chart shows visitors. How the teaser handles this is still an open question, and it blocks the acceptance of this issue.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Generated insight", "Sanitization responsibilities" and "Internationalization (i18n)")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `trafficInsights` enabled, when the insight has arrived and has a `teaser`, the top of the Traffic Overview tab shows the teaser, as in the design.
* When the insight has no `teaser`, nothing is shown at the top of the tab.
* `**Organic Search** brought more visits` shows `Organic Search` in bold. `<b>Organic</b>`, `<img src=x>`, `[link](https://example.com)` and `*Organic*` are shown exactly as typed.
* Each scenario shows its own icon and emphasis from the design: `GROWTH`, `SUSTAINED_HIGH`, `PULLBACK`, `POST_SURGE_PULLBACK`, `SUSTAINED_LOW`, `STEADY_AND_SHIFTING`, `STEADY_BUT_DRIFTING`, `CHANNEL_SURGES`, `RECENT_CONTENT_MOMENTUM`, `SEARCH_QUERY_SHIFTS` and `CATEGORY_RESONANCE`. An unknown scenario, such as `NEW_SCENARIO`, shows the default icon and emphasis.
* A teaser of 140 characters is shown in full at every screen size.
* The teaser is also shown on the view-only dashboard.
* With `trafficInsights` disabled, the Traffic Overview tab is the same as before.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
