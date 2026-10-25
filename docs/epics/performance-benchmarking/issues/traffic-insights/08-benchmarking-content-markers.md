# Benchmarking response — content markers for recently published posts

GitHub issue: [#13945](https://github.com/google/site-kit-wp/issues/13945)

## Feature Description

Both charts are going to show a dot on each day when the site published something. This issue adds the list of these days to `GET:benchmarking-data` (#13594) as `contentMarkers`. Each marker has a publish date and the posts that were published on that day, each with its title and URL.

The list comes from the content report that was added for the insight (#13942). This report runs only when the post date custom dimension has data. The markers need no traffic history, so they also show on a new property. Posts published on the same day share one marker, because one day is one dot. The list has a length limit and is ranked by sessions, so a site that publishes every day does not get a dot on every day. The root URL and index pages are left out, because they are not published content.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Content markers on the charts", "Wire format members" and "Datapoint response shapes")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `trafficInsights` enabled and data in the post date custom dimension, `getBenchmarkingData()` returns `contentMarkers`: one `{ date, posts: [ { title, url } ] }` for each publish date inside the selected range, with `date` as `YYYY-MM-DD`.
* Two posts published on `2026-09-10` give one marker for `2026-09-10` that lists both posts.
* A post published before the selected range gets no marker.
* `/` and index pages, such as `/index.php`, get no marker.
* When there are more publish dates than the limit, the dates whose posts had the most sessions are kept.
* Without data in the post date dimension, `contentMarkers` is empty.
* The encoded response carries the markers in member `9`, and each post's title and URL as references to the string table.
* With `trafficInsights` disabled, the response is the same as before, byte for byte.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
