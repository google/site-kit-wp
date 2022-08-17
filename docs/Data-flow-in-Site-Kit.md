[Back to overview](./README.md)

# Data flow in Site Kit

At a high level, data in Site Kit is obtained from client-side fetch requests to the WordPress REST API, which in turn makes HTTP requests to (authenticated) Google endpoints using Google credentials stored in WordPress's database.

Because of Site Kit's large install base, it has users with environments ranging from slow, shared web servers to very fast, cloud compute instances. But because many WordPress sites are hosted on basic, slow servers—and because much of Site Kit's data does not vary wildly by the minute or even hour, we aggressively cache HTTP responses for at least an hour in `sessionStorage` when it is data like an Analytics Report or PageSpeed Insights test run.

This limits the number of repeated requests to the WordPress REST API we make—both improving the perceived speed of Site Kit and minimising high loads on shared WordPress instances.

## Request lifecycle

We don't make direct REST API requests from React components.

Requests are always triggered Redux (`@wordpress/data`), either by an action with an associated control, or a selector with an associated resolver. Selectors are virtually always `GET` requests, used to get data without modifying it. Actions are usually used when creating/updating/deleting data, eg. an HTTP `POST`/`PUT`/`DELETE` request.

The lifecycle of a request is:

### Step 1. Datastore action/selector

API requests should never be made directly by a component using `fetch`, `@wordpress/api-fetch`, etc. Instead, HTTP requests should be made because either a Redux (`@wordpress/data`) _selector_ was called or a Redux action was dispatched.

Actions will have associated controls that use our `API.get`/`API.set` libraries to trigger requests and then update the datastore appropriately with loading states, error messages, and results.

Selectors will have associated resolvers that trigger requests, usually using asynchronous actions like the ones mentioned above.

### Step 2: Client `fetch` request

Client makes a `fetch` request (using our `API.get`/`API.set` functions, which use the `@wordpress/api-fetch` internally) to WordPress REST API, usually a custom endpoint defined by Site Kit. (If cached data exists, the request is skipped—go to step 5.)

### Step 3: REST API handler

WordPress REST API receives the request and verifies that this user is __authenticated to WordPress__. Many requests involve communicating with a Google API from PHP and then returnin the response. For example, when requesting an Analytics report for an Analytics chart, `fetch` params are sent to the REST API, then used by the PHP library making an authenticated request on behalf of the Site Kit user to the Google Analytics API.

Keeping credentials stored (securely) in WordPress allows us to enable Dashboard Sharing, where one user's credentials are used to make requests for other users, but are never exposed to another WordPress user.

### Step 4: Response from REST API

In the case of a successful request, the WordPress REST API route handler will return either:

* Data obtained from remote APIs (usually a Google API like Analytics or Search Console API) as JSON to the client `fetch` request.
* Data stored in the WordPress database without making the request.

If the request failed, either because it was malformed, there was an error on the remote (eg. Gooogle) API side, a network issue between the WordPress server and Google, or some other reason, the REST API route handler will return the error. If there was an error returned from the remote API, this will often be returned to the client.

### Step 5: Client handling

If the response is successful (eg. a `2xx` HTTP response code) _or_ there is a non-stale cache of the request in `sessionStorage`, the retrieved data (from either the API or `sessionStorage` cache) will be stored in the Redux store for the appropriate fetch request. The UI will update now that the data exists in Redux, and from the user perspective the request is complete.

### Step 6: Caching

Most `GET` requests that are reading data, especially in the case of report data, will cache the response in `sessionStorage` for one hour. Some requests, like `GET` requests for account lists, will not cache—this is because a user might update their list of accounts on a service like Google Analytics, then want to refresh their list of accounts in the Site Kit UI. If we cached that data, the user would need to wait one hour to refresh data.

Generally speaking, we cache report data that does not vary (either much or at all) every hour.

If the WordPress REST API returns a non-`2xx` HTTP response code (or the request fails entirely), the client will not save any data for this request in a cache and will instead log the error using a Redux (`@wordpress/data`) action. Usually the client will display this error in an appropriate fashion. Again: failed request data is never cached in `sessionStorage`.

If the data was retrieved from the cache, the cache will not be modified. Cached data is stored with a time-to-live and will be cleared/ignored if "stale".
