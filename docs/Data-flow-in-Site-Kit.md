[Back to overview](./README.md)

# Data flow in Site Kit

At a high level, data in Site Kit is obtained from client-side fetch requests to the WordPress REST API, which in turn makes HTTP requests to authenticated Google endpoints using Google credentials stored in WordPress' database.

Because of Site Kit's large install base, it has users with environments ranging from slow, shared web servers to very fast, cloud compute instances. But because many WordPress sites are hosted on basic, slow servers—and because much of Site Kit's data does not vary wildly by the minute or even hour, we aggressively cache HTTP responses for at least an hour in `sessionStorage` when it is data like an Analytics Report or PageSpeed Insights test run.

This limits the number of repeated requests to the WordPress REST API we make—both improving the perceived speed of Site Kit and minimizing high loads on shared WordPress instances.

## Request lifecycle

We don't make direct REST API requests from React components.

Requests are always triggered via Redux (`@wordpress/data`) by an action with an associated control either directly or by a selector with an associated resolver. Selectors are virtually always fulfilled by `GET` requests, used to get data without modifying it. Actions are used when creating/updating/deleting data, eg. an HTTP `POST`/`PUT`/`DELETE` request.

The lifecycle of a request is:

### Step 1. Datastore action/selector

API requests should never be made directly by a component using `fetch`, `@wordpress/api-fetch`, etc. Instead, HTTP requests should be made because either a Redux (`@wordpress/data`) _selector_ was called or a Redux action was dispatched.

Actions will have associated controls that use our `API.get`/`API.set` libraries to trigger requests and then update the datastore appropriately with loading states, error messages, and results.

Selectors can have associated resolvers that trigger requests, using asynchronous actions like the ones mentioned above. Some selectors do not have their own resolver, but depend on another selector with a resolver. Be aware of this when waiting for a selector to resolve; some selectors will trigger resolvers up the selector hierarchy.

In either case, under the hood the common infrastructure for making requests via a data store is created using [`createFetchStore`](https://github.com/google/site-kit-wp/blob/develop/assets/js/googlesitekit/data/create-fetch-store.js).

### Step 2: Client `fetch` request

Client makes a `fetch` request to the WordPress REST API, usually to a custom endpoint defined by Site Kit via our `API.get`/`API.set` functions.

[If cached data exists, the request is skipped](#step-6-caching), regardless of how many requests are made. We also have a custom `@wordpress/api-fetch` middleware ([see: `preloadMiddleware`](https://github.com/google/site-kit-wp/blob/develop/assets/js/googlesitekit/api/middleware/preloading.js)) that allows us to preload request data onto the page from the server, but this data is used only for the initial request. Subsequent requests will go through the normal request lifecycle outlined in this doc.

### Step 3: REST API handler

WordPress REST API receives the request and verifies that this user is __authenticated to WordPress__. Many requests involve communicating with a Google API from PHP and then returning the response. For example, when requesting an Analytics report for an Analytics chart, `fetch` params are sent to the REST API, then used by the PHP library making an authenticated request on behalf of the Site Kit user to the Google Analytics API.

Keeping credentials stored securely in WordPress allows us to enable Dashboard Sharing, where one user's credentials are used to make requests for other users, but are never exposed to another WordPress user.

### Step 4: Response from REST API

In the case of a successful request, the WordPress REST API route handler will return either:

* Data obtained from remote APIs (usually a Google API like Analytics or Search Console API) as JSON to the client `fetch` request.
* Data stored in the WordPress database without making an additional request.

If the request failed, either because it was malformed, there was an error on the remote (eg. Gooogle) API side, a network issue between the WordPress server and Google, or some other reason, the REST API route handler will return the error. If there was an error returned from the remote API, this will often be returned to the client.

### Step 5: Client handling

If the response is successful (eg. a `2xx` HTTP response code) _or_ there is a non-stale cache of the request in `sessionStorage`, the retrieved data (from either the API or `sessionStorage` cache) will be stored in the Redux store for the appropriate fetch request. The UI will update now that the data exists in Redux, and from the user perspective the request is complete.

### Step 6: Caching

Most `GET` requests that are reading data, especially in the case of report data, will cache the response in `sessionStorage`. The default cache expiry time is one hour, this is configurable on a case-by-case basis. Some requests, like `GET` requests for account lists, will not cache—this is because a user might update their list of accounts on a service like Google Analytics, then want to refresh their list of accounts in the Site Kit UI. If we cached that data, the user would need to wait one hour to refresh data.

Generally speaking, we cache report data that does not vary (either much or at all) every hour.

If the WordPress REST API returns a non-`2xx` HTTP response code (or the request fails entirely), the client will not save any data for this request in a cache and will instead log the error using a Redux (`@wordpress/data`) action. Usually the client will display this error in an appropriate fashion. Typically, failed request data is not cached in `sessionStorage`.

If the data was retrieved from the cache, the cache will not be modified. Cached data is stored with a time-to-live and will be cleared/ignored if "stale".

## Creating a fetch action/selector using `createFetchStore`

When creating an action/selector that triggers a `fetch` request, use the `createFetchStore` function to return a new [data store that can be combined with an existing store](./Data-store-architecture.md).

Here's an example of what a `createFetchStore` looks like, using the existing `core/site/data/connection` route as a reference:

```js
const fetchGetConnectionStore = createFetchStore( {
 baseName: 'getConnection',
 // Make the API request; by default the cache is used for `get` calls.
 controlCallback: () => {
  return API.get( 'core', 'site', 'connection' );
 },
 // Changes to make to the reducer once the control finishes and gets a response.
 reducerCallback: ( state, connection ) => {
  return {
   ...state,
   connection,
  };
 },
} );
```

More documentation on `createFetchStore`, including detailed usage examples, can be [found in the function's documentation](https://github.com/google/site-kit-wp/blob/develop/assets/js/googlesitekit/data/create-fetch-store.js).

## Defining REST API endpoints on the server

REST API endpoints are defined for each request.

For modules—a common request type, API endpoints are created using four methods for the `Module` class. These cover:

1. Set up remote requests (`setup_services`)
2. REST API routes (`get_datapoint_definitions`)
3. Data request to make to a 3rd-party API, if needed (`create_data_request`)
4. Response parsing for the optional data request (`parse_data_response`)

In the case of non-module REST routes, `get_rest_routes()` is used directly to create routes for a particular route. See examples of the `get_rest_routes()` method used by files like `Authentication.php` or `Notifications.php` to see how non-modules register REST routes.

### Set up remote requests

When communicating with Google APIs, files can set up the services that will be used to make Google API requests. Class instances of the `Google_Service` type can use `setup_services` method returns an array of service identifier to service object instances. These "service objects" can be used to interact with a Google APIs.

The identifier is referenced in the datapoint definitions in `get_datapoint_definitions` and the service instance when making the request in `create_data_request`. Here is an example `setup_services` implementation from the Search Console module.

```php
  protected function setup_services( Google_Site_Kit_Client $client ) {
    return array(
      'searchconsole' => new Google_Service_SearchConsole( $client ),
    );
  }
```

### REST API routes

Define a module's REST routes using the `get_datapoint_definitions` function. This function defines the array of REST routes using an array where the keys are the REST routes and the values are requirements/properties of that route. Here's an example from Search Console's `get_datapoint_definitions`:

```php
protected function get_datapoint_definitions() {
  return array(
   'GET:matched-sites'   => array( 'service' => 'searchconsole' ),
   'GET:searchanalytics' => array(
    // The `service` key means this request requires Search Console to be
    // active/connected.
    'service'   => 'searchconsole',
    // Shareable means this REST route is shared with Dashboard Sharing users.
    'shareable' => true,
   ),
   'POST:site'           => array( 'service' => 'searchconsole' ),
   'GET:sites'           => array( 'service' => 'searchconsole' ),
  );
 }
```

### Remote API requests

If a REST route should communicate with a third-party API, eg. a Google API, that should be defined in the `create_data_request` function for a `Module`. This is usually written as a `switch` case, with each route parsing request params, user info, etc. before making the HTTP request to the remote API from PHP.

This code will be used to create the request sent to the third-party API in a standardized way.

Here's an example from the Tag Manager module's `create_data_request` function:

```php
protected function create_data_request( Data_Request $data ) {
  switch ( "{$data->method}:{$data->datapoint}" ) {
    case 'GET:accounts':
    case 'GET:accounts-containers':
      return $this->get_tagmanager_service()->accounts->listAccounts();
  }

  return parent::create_data_request( $data );
}
```

### Response parsing for data requests

Any custom data handling, code to run after receiving data, etc. can be defined in the `parse_data_response` method. At its most basic, this could return the response from the remote API without modification or any other action:

```php
protected function parse_data_response( Data_Request $data, $response ) {
  return $response;
}
```

In practise, we don't return full responses from Google, because they include things like pagination and other info not relevant to Site Kit requests. Instead, we will return the actual "data" the request was meant to fetch, but not the metadata.

An example of this is `listAccounts` response, which returns only the accounts and not the associated response metadata:

```php
protected function parse_data_response( Data_Request $data, $response ) {
  switch ( "{$data->method}:{$data->datapoint}" ) {
   case 'GET:accounts':
    return array_map( array( self::class, 'filter_account_with_ids' ), $response->getAccounts() );
```
