### Getting started
Install the project dependencies:
 * npm install
 * composer install

### Building the Project
Production build
 - npm run build
Development build
 - npm run dev
Watch Build - development build that watches for changes
 - npm run watch

PHPCS - PHP Code Sniffer scans all PHP
- gulp phpcs

### Verifying your site for local development

The plugin requires a connection to a domain that is verified in search console. Go thru the normal process to verify your site in search console if you have not already.


### Using data from a test domain.

Add the following code to filter requests to use specific data instead of configured data.

For example, lets say we are testing with the domain `mydomain.com`.

* Set up your local test environment to resolve locally as `mydomain.com`.


```php
define( 'GK_DOMAIN', 'https://testdomain.com' );

// Filter the domain used for all requests.
add_filter( 'googlesitekit_site_url', function() { return GK_DOMAIN; } );

// Filter the view ID used when making requests to the Analytics API.
add_filter( 'googlesitekit_analytics_view_id', function() { return [VIEW_ID]; } );

// Filter the internal web property ID used when deep linking to Analytics.
add_filter( 'googlesitekit_analytics_internal_web_property_id', function() { return [INTERNAL_WEB_PROPERTY_ID]; } );

// Filter the data that is used to construct a request.
add_filter( 'googlesitekit_pre_request', function( $request ) {
	if ( ! $request->permaLink ) {
		return $request;
	}
	$request->permaLink = str_replace( untrailingslashit( home_url() ), GK_DOMAIN, $request->permaLink );
	return $request;
} );
```
