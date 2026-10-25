# `Google_Proxy` — send a benchmarking insight request and read its operation

GitHub issue: [#13939](https://github.com/google/site-kit-wp/issues/13939)

## Feature Description

Traffic Insights shows text that the Site Kit Service writes with AI. The plugin cannot call the service's generative endpoints yet. Writing the text can take several seconds, so the plugin asks for it in two steps. First, it sends the request to `/v1/ai/benchmarking` in asynchronous mode and gets back an operation ID. Then, it reads that operation from `/v1/ai/operations/:operation_id` until the text is ready.

This issue adds one `Google_Proxy` method for each step. The submit sends `async: true` in the JSON body. It does not use the request helper's own `async` mode, because that mode sends the request and ignores the answer.

The operation read is a `GET` request with the site credentials in the query string. The `Google_Proxy` request helper can only send a `POST` request with the credentials in the body, so this issue also lets the helper send a `GET` request. Every proxy call in the plugin uses this helper, so all existing calls must send the same requests as before.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Google_Proxy additions" and "Request and response field mapping")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* The submit method sends a `POST` request to `/v1/ai/benchmarking`:
  * The JSON body has the payload fields it is given, `async: true`, `site_id` and `site_secret`.
  * The URL has the language tag it is given as the `hl` query parameter, such as `/v1/ai/benchmarking?hl=de-DE`.
  * The `Authorization` header is `Bearer <access token>`.
* The submit method returns the service's answer unchanged: an `operation_id` with `interaction_id` and `model_version`, or the generated fields when the service answers from its cache.
* The read method sends a `GET` request to `/v1/ai/operations/<operation ID>`, with `site_id` and `site_secret` as query parameters, no body, and the same `Authorization` header. It returns the operation unchanged, with `done`, `state`, and `response` or `error`.
* When the service answers with a status outside `200`–`299`, both methods return a `WP_Error` with that status, such as `429` or `404`, and with the `error` message from the JSON body when there is one.
* Every existing `Google_Proxy` method sends the same request as before: a `POST` with `site_id` and `site_secret` in the body.

## Implementation Brief

* [ ] In `includes/Core/Authentication/Google_Proxy.php`:
  * Add two URI constants after `INTENT_COMPLETE_URI`:
    * `BENCHMARKING_INSIGHT_URI = '/v1/ai/benchmarking'`.
    * `BENCHMARKING_INSIGHT_OPERATION_URI = '/v1/ai/operations/%s'`.
  * Add a `method` key to the `$args` of `request()`. Its value is `'GET'` or `'POST'`, and the default is `'POST'`. When `method` is `'GET'`, `request()` does this after it injects the credentials:
    * Adds every `body` argument, including `site_id` and `site_secret`, to the URL as query parameters with `add_query_arg( urlencode_deep( $request_args['body'] ), $url )`. `Entity_Factory` uses `urlencode_deep()` in the same way.
    * Removes `body` from the request arguments, so the request has no body.
    * Skips the `json_request` handling, so it sets no `Content-Type` header.
    * Sends the request with `wp_remote_get()`. Add the same `// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_remote_get_wp_remote_get` comment that `Tag_Placement` uses.
    * Passes the response to the same code that handles the `POST` response: the status check, the JSON decode, and the `WP_Error` with the `error` message and the `status`.
  * In the doc block of `request()`, describe the method as sending a request, not a `POST` request, and add ``@since n.e.x.t Added the `method` argument.``
  * Add `send_benchmarking_insight_request( Credentials $credentials, $access_token, array $payload, $language_tag )`, which returns `array|WP_Error`:
    * It calls `request()` with the URI `add_query_arg( 'hl', $language_tag, self::BENCHMARKING_INSIGHT_URI )`, the `access_token`, `json_request => true`, and `body => array_merge( $payload, array( 'async' => true ) )`.
    * It does not pass `mode`. The `async` field goes only in the JSON body.
    * It returns the result of `request()` without changes.
  * Add `get_benchmarking_insight_operation( Credentials $credentials, $access_token, $operation_id )`, which returns `array|WP_Error`:
    * It calls `request()` with the URI `sprintf( self::BENCHMARKING_INSIGHT_OPERATION_URI, rawurlencode( $operation_id ) )`, the `access_token`, and `method => 'GET'`.
    * It returns the result of `request()` without changes.
  * Write the doc blocks of the two new methods following `send_survey_trigger()`, with `@since n.e.x.t`.

### Test Coverage

* Add tests to `tests/phpunit/integration/Core/Authentication/Google_ProxyTest.php`, using the existing `mock_http_request()` helper, covering:
  * `send_benchmarking_insight_request()` with the language tag `de-DE` sends a `POST` to `/v1/ai/benchmarking?hl=de-DE` with the `Authorization: Bearer <access token>` and `Content-Type: application/json` headers. The JSON body has the given payload fields, `async: true`, `site_id` and `site_secret`.
  * `send_benchmarking_insight_request()` returns the service's answer without changes, both for an answer with `operation_id`, `interaction_id` and `model_version`, and for an answer with the generated fields (`scenario`, `teaser`, `text`, `driver`, `interaction_id`, `model_version`).
  * `get_benchmarking_insight_operation()` sends a `GET` to `/v1/ai/operations/<operation ID>` with `site_id` and `site_secret` as query parameters, the `Authorization` header and no body. It returns the operation without changes, for a `SUCCEEDED` operation with `response` and for a `FAILED` operation with `error`.
  * When the service answers with `429` and an `error` message in the JSON body, `send_benchmarking_insight_request()` returns a `WP_Error` with status `429` and that message.
  * When the service answers with `404`, `get_benchmarking_insight_operation()` returns a `WP_Error` with status `404`.
* No Storybook story required because the change adds no UI.
* VRT: N/A.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
