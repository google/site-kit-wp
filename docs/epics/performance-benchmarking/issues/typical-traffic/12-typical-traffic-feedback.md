# Typical Traffic feedback — thumbs up and down on the chart and on each key factor column

## Feature Description

The Typical Traffic tab shows a reader a year of their own traffic and the factors behind the latest change. It gives the reader no way to say that a part of the tab looks wrong or does not help, so the team cannot tell which parts readers trust and which confuse them. The Site Goals widgets already ask for this with a thumbs up and a thumbs down button, and #13679 turns that prompt into a shared `FeedbackPrompt` component that other widgets can use with their own vote ID and tracking.

This issue adds a thumbs up and a thumbs down button to the chart and to each key factor column. When the reader gives a thumbs down, a short popup asks what seems off.

**The chart.** The buttons sit at the right end of the row below the chart, after the text `Help us improve`, on the same line as the legend ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1755-25930&m=dev)). They are always visible.

**The key factor columns.** Each block of the Key factors section from #13601 is a column in the design. Each column has its own two buttons, with no text, in its top-right corner ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1741-11863&m=dev)). The buttons appear only while the pointer is over the column, so the row of columns does not show six buttons all the time. They also appear when keyboard focus reaches them, so a keyboard user can vote. On a touch screen they are always visible, because a touch screen has no hover. A vote on a column is about that column only, so the vote records which factor the reader voted on.

**The popup after a thumbs down.** The popup asks one question and offers three answers. The answers are different for the chart ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-13886&m=dev)) and for a key factor column ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-12871&m=dev)). The reader answers with one click and does not have to type. Choosing an answer closes the popup and thanks the reader. Closing the popup without an answer keeps the thumbs down.

**What a vote sends.** A vote is sent the same way the Site Goals prompt sends it: as a survey trigger, which the Site Kit Service records for the user, and as a GA4 event. An answer from the popup is sent as one more survey trigger, the same way the feature card's dismiss menu sends the reason a reader chose. This lets the team count the reasons behind the thumbs down for each part of the tab.

**Not on the view-only dashboard.** A reader on the view-only dashboard sees no feedback buttons. Survey triggers are sent only for a user who has connected their own Google account to Site Kit, so a vote from a view-only reader would never reach the Site Kit Service. This rule is part of the shared `FeedbackPrompt`, not of the Typical Traffic tab, so it applies to every widget that shows the prompt. The Site Goals widgets stop showing their `Is this section helpful?` prompt on the view-only dashboard too.

The chart's first answer, `The expected range feels too high or too low`, is about an expected range that the chart does not draw yet. The chart's title and tooltip in #13600 have the same gap.

This issue needs the shared `FeedbackPrompt` from #13679, the chart from #13600 and the key factor columns from #13601.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* On the Typical Traffic tab, the row below the chart shows the legend on the left and, on the right, the text `Help us improve` followed by a thumbs up and a thumbs down button. The text and the buttons are always visible.
* Each key factor column has its own thumbs up and thumbs down buttons, with no text, in the column's top-right corner:
  * They appear when the pointer moves over the column and disappear when it leaves.
  * They appear when keyboard focus moves to either button, and stay while focus is on them.
  * They stay visible while the column's popup or its `Thanks for the feedback!` message is open.
  * On a touch screen, they are always visible.
* Clicking thumbs up on the chart or on a column:
  * Shows thumbs up as pressed and dims thumbs down.
  * Shows `Thanks for the feedback!` next to the buttons.
  * Sends the survey trigger `vote:typical_traffic_chart:up` for the chart, or `vote:typical_traffic_key_factors:up` for a column.
  * Sends the GA4 event `vote_up` in the category `<viewContext>_typical-traffic-survey`, such as `mainDashboard_typical-traffic-survey`, with the label `chart` for the chart, or the column's dimension code for a column, such as `CHANNELS` for a traffic channel or `CONTENT` for a page.
* Clicking thumbs down on the chart or on a column:
  * Shows thumbs down as pressed and dims thumbs up.
  * Sends the survey trigger `vote:typical_traffic_chart:down` for the chart, or `vote:typical_traffic_key_factors:down` for a column.
  * Sends the GA4 event `vote_down`, with the same category and label as `vote_up`.
  * Opens a popup, with its right edge lined up with the buttons, above the chart's buttons or below a column's. The popup has this heading and these three answers, in this order, and no close button:
    | Part | Heading | Answers |
    | :---- | :---- | :---- |
    | The chart | `What seems off about this chart?` | `The expected range feels too high or too low`<br>`Doesn’t reflect a seasonal change or recent event`<br>`Not sure how to read this` |
    | A key factor column | `What seems off about this?` | `This didn’t really drive my recent traffic change`<br>`An important page or traffic source is missing`<br>`The numbers or percentages are confusing` |
  * Shows no `Thanks for the feedback!` message while the popup is open.
* Choosing an answer closes the popup, shows `Thanks for the feedback!` next to the buttons, and sends one survey trigger, `feedback:<vote ID>:<answer ID>`, such as `feedback:typical_traffic_chart:expected_range_off`:
  | Answer | Answer ID |
  | :---- | :---- |
  | `The expected range feels too high or too low` | `expected_range_off` |
  | `Doesn’t reflect a seasonal change or recent event` | `missing_seasonal_change` |
  | `Not sure how to read this` | `hard_to_read` |
  | `This didn’t really drive my recent traffic change` | `not_a_driver` |
  | `An important page or traffic source is missing` | `missing_page_or_source` |
  | `The numbers or percentages are confusing` | `confusing_numbers` |
* Pressing Escape, or clicking outside the popup, closes it without sending an answer and leaves thumbs down pressed. After Escape, keyboard focus is back on thumbs down.
* The popup can be used with the keyboard alone: the arrow keys move between the answers, and Enter chooses one.
* A vote in one key factor column does not change the buttons or open a popup in any other column, or on the chart.
* On the view-only dashboard:
  * The Typical Traffic tab shows no `Help us improve` text and no feedback buttons, below the chart or on any key factor column, including when the pointer is over a column.
  * The Site Goals widgets show no `Is this section helpful?` prompt.
* On the main dashboard, the `Is this section helpful?` prompt on the Site Goals widgets works as before: either button shows `Thanks for the feedback!` and opens no popup.
* The menu that opens when a reader dismisses a feature card still has the heading `Help us improve` and its four options.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
