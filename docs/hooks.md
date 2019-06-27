## Hooks in Site Kit

### PHP hooks

#### Filters

##### googlesitekit_auth_scopes
```
/**
 * Allow plugins/modules to add extended scope to the authentication.
 * See all Google oauth scopes here: https://developers.google.com/identity/protocols/googlescopes
 *
 * @since 1.0.0
 *
 * @param array $extended_scopes Array of extended scopes.
 */
return apply_filters( 'googlesitekit_auth_scopes', $modules );
```

###### googlesitekit_setup_data
```
/**
 * Filter the setup data, we need this during the dashboard page load.
 *
 * Get the setup data from the options table.
 *
 * @param array $data Authentication Data.
 */
'setup'          => apply_filters( 'googlesitekit_setup_data', array() ),
```

###### googlesitekit_custom_columns
```
/**
 * Filters the array of custom columns for googlesitekit.
 *
 * @since 1.0.0
 *
 * @param array $custom_columns Array of custom columns.
 */
$googlesitekit_custom_columns = apply_filters( 'googlesitekit_custom_columns', array( 'google-site-kit' => __( 'Site Kit', 'google-site-kit' ) ) );
```

###### googlesitekit_site_url
```
/**
 * Filters the site_url of this current site. Used when we want to override the current site url.
 * Example use: use the production url but from preprod or staging
 *
 * @since 1.0.0
 *
 * @param string $site_url WordPress "site url" returned from the home_url function.
 */
$site_url = apply_filters( 'googlesitekit_site_url', home_url() );
```

##### googlesitekit_adsense_account_id
```
/**
 * Filters the adsense account_id. Used when we want to override the adsense account id.
 *
 * @since 1.0.0
 *
 * @param string $account_id adsense account id.
 */
$account_id        = apply_filters( 'googlesitekit_adsense_account_id', $settings['account_id'] );
```

##### googlesitekit_analytics_view_id
```
/**
 * Filters the analytics view_id. Used when we want to override the analytics view id.
 *
 * @since 1.0.0
 *
 * @param string $view_id adsense view id.
 */
self::$view_id = apply_filters( 'googlesitekit_analytics_view_id', $view_id );
```

##### googlesitekit_analytics_internal_web_property_id
```
/**
 * Filters the analytics internal_web_property_id. Used when we want to override the internal web property id.
 *
 * @since 1.0.0
 *
 * @param string $internal_web_property_id analytics internal web property id.
 */
self::$internal_web_property_id = apply_filters( 'googlesitekit_analytics_internal_web_property_id', $internal_web_property_id );
```

##### googlesitekit_analytics_property_id
```
/**
 * Filters the analytics property_id.
 *
 * @since 1.0.0
 *
 * @param string $property_id analytics property id.
 */
self::$property_id = apply_filters( 'googlesitekit_analytics_property_id', $property_id );
```

##### googlesitekit_analytics_account_id
```
/**
 * Filters the analytics account id. Used when we want to override the account id.
 *
 * @since 1.0.0
 *
 * @param string $account_id analytics account id.
 */
self::$account_id = apply_filters( 'googlesitekit_analytics_account_id', $account_id );
```

##### googlesitekit_optimize_id
```
/**
 * Filters the optimize optimize_id. Used when we want to override the optimize id.
 *
 * @since 1.0.0
 *
 * @param string $optimize_id Optimize account id.
 */
$optimize_id = apply_filters( 'googlesitekit_optimize_id', $optimize_id );
```

##### googlesitekit_cron_daily_requests
```
/**
 * Filters the array list of request params to be sent to rest api as batch request.
 *
 * @since 1.0.0
 *
 * @param array $request Array of request params. Request are
 *                       keyed with 'dataObject', 'identifier', 'datapoint'.
 */
apply_filters( 'googlesitekit_cron_daily_requests', array() );
```

##### googlesitekit_cron_hourly_requests
```
/**
 * Filters the array list of request params to be sent to rest api as batch request.
 *
 * @since 1.0.0
 *
 * @param array $request Array of request params. Request are
 *                       keyed with 'dataObject', 'identifier', 'datapoint'.
 */
apply_filters( 'googlesitekit_cron_hourly_requests', array() );
```

##### googlesitekit_notifications
```
/**
 * Filters the dashboard notifications. Used when we want to show notifications.
 *
 * @since 1.0.0
 *
 * @param array  $notifications Array of notifications data.
 * @param string $context       Notification context.
 */
$output = apply_filters( 'googlesitekit_notifications', array(), $context );
```

##### googlesitekit_gtag_opt
```
/**
 * Filters the gtag config options.
 *
 * @since 1.0.0
 *
 * @param array $gtag_opt gtag config options.
 *
 * @see: https://developers.google.com/gtagjs/devguide/configure
 */
$gtag_opt = apply_filters( 'googlesitekit_gtag_opt', array() );
```

#### Actions

###### googlesitekit_adminbar_modules_before
```
/**
 * Display server rendered content before JS-based adminbar modules.
 *
 * @since 1.0.0
*/
do_action( 'googlesitekit_adminbar_modules_before' );
```

###### googlesitekit_adminbar_modules_after
```
/**
 * Display server rendered content after JS-based adminbar modules.
 *
 * @since 1.0.0
*/
do_action( 'googlesitekit_adminbar_modules_after' );
```

###### googlesitekit_metabox_modules_before
```
/**
 * Display server rendered content before JS-based metabox modules.
 *
 * @since 1.0.0
*/
do_action( 'googlesitekit_metabox_modules_before' );
```

###### googlesitekit_metabox_modules_after
```
/**
 * Display server rendered content after JS-based metabox modules.
 *
 * @since 1.0.0
*/
do_action( 'googlesitekit_metabox_modules_after' );
```

###### googlesitekit_deactivation
```
/**
 * Run action when deactivate this plugin.
 * 1. Revoke token
 * 2. Delete refresh token from the option table
 * 3. Delete caches in transients
 * 4. Delete each modules options
 *
 * @since 1.0.0
 */
do_action( 'googlesitekit_deactivation' );
```

###### googlesitekit_above_dashboard_app
```
/**
 * Action run before the Dashboard App wrapper is rendered.
 *
 * @since 1.0.0
 */
do_action( 'googlesitekit_above_dashboard_app' );
```

###### googlesitekit_above_dashboard_details_app
```
/**
 * Action run before the Dashboard Details App wrapper is rendered.
 *
 * @since 1.0.0
 */
do_action( 'googlesitekit_above_dashboard_details_app' );
```

### JavaScript Hooks

#### Filters

##### googlesitekit.winCallbacks
```
/**
 * Filter the publisher wins callback functions that return data for the win notification.
 *
 * @param object winCallbacks The current list of available callback functions.
 */
const wincallbacks = hooks.applyFilters( 'googlesitekit.winCallbacks', {} );

// Example: where publisherWinCallbacks is imported containing a list of functions to run.
addFilter( 'googlesitekit.winCallbacks',
		'googlesitekit.publisherwinCallbacks',
		( callbacks ) => {
			return { ...callbacks, ...publisherWinCallbacks };
		} );
```

##### googlesitekit.WinsNotificationsRequest
```
/**
 * Filter the publisher wins list that need to be requested.
 * identifier  Required
 * storageType Optional, defaults to session storage.
 * withData    Optional

 * @param array wins The current list of wins to include in the request.
 */
hooks.applyFilters( 'googlesitekit.WinsNotificationsRequest', [] );

// Example:
addFilter( 'googlesitekit.WinsNotificationsRequest',
		'googlesitekit.PublisherWinsNotification',
		addPageviewIncreaseNotification );
		( wins ) => {
			const data =  {
				identifier: 'publishing-win',
				storageType: 'localStorage',
				withData: {
					dataObject: 'modules',
					identifier: 'search-console',
					datapoint: 'sc-site-analytics-new-site',
					priority: 1,
					maxAge: getTimeInSeconds( 'day' ),
					context: 'Dashboard',
				}
			};
			wins.push( data );
			return wins;
		}, 1 );
```

##### googlesitekit.ModulesNotificationsRequest
```
/**
 * Filter the modules notifications/alerts list that need to be requested.
 * identifier  Required

 * @param array modules The current list of wins to include in the request.
 */
hooks.applyFilters( 'googlesitekit.ModulesNotificationsRequest', [] );

// Example:
addFilter( 'googlesitekit.ModulesNotificationsRequest',
		'googlesitekit.AdSenseNotifications', ( modules ) => {
			modules.push( {
				identifier: 'adsense',
			} );
			return modules;
		} );
```

##### googlesitekit.TotalNotifications
```
/**
 * Filter the total number of notifications/alerts that renders in the dashboard/adminbar icon.
 *
 * @param int total Total notifications to show in the dashboard.
 */
hooks.applyFilters( 'googlesitekit.TotalNotifications', total );
```

##### googlesitekit.autoRefreshModules
```
/**
 * Filter the modules that need to optin for auto refresh status after a certain time.
 *
 * @param array modules List of modules to optin to auto refresh.
 *                      Modules are keyed with:
 *                      'identifier' The module slug.
 *                      'toRefresh'  Funciton returns true or false if status update needs refreshing, default true.
 *                      'idleTime'   Time in seconds to wait before module refreshes status, default 15.
 */
hooks.applyFilters( 'googlesitekit.autoRefreshModules', [] );

// Example:
addFilter( 'googlesitekit.autoRefreshModules',
	'googlesitekit.AdSenseAutoRefresh', ( modules ) => {
		modules.push( {
			identifier: 'adsense',
			idleTime: 15,
			toRefresh: () => {
				const status = googlesitekit.modules.adsense.settings.account_status;
				if ( -1 < status.indexOf( 'account-connected' ) ) {
						return false;
					}
					return true;
				},
			} );
			return modules;
	} );
```

##### googlesitekit.Connected-{moduleSlug}
```
/**
 * Filters module to show as connected or not connected in the settings UI.
 * Showing as connected defaults to the setupComplete value.
 */
hooks.applyFilters( `googlesitekit.Connected-${slug}`, setupComplete );
```

##### googlesitekit.SetupModuleShowLink
```
/**
 * Filter whether module setup link should display or not.
 *
 * @param boolean showLink  True if link should display.
 * @param string  slug      The module slug.
 */
hooks.applyFilters( 'googlesitekit.SetupModuleShowLink', showLink, slug );
```

#### Actions

##### googlesitekit.moduleLoaded
```
/**
 * Action triggered when the an App is loaded, context is one of 'Settings', 'Dashboard', 'Single' (Module), 'Metabox' (post screen) or 'Column'.
 */
hooks.doAction( 'googlesitekit.moduleLoaded', context );
```

##### googlesitekit.moduleDataReset
```
/**
 * Action triggered to reset loaded data, before triggering a data refresh.
 */
hooks.doAction( 'googlesitekit.moduleDataReset' );
```

#####  googlesitekit.customColumnLoaded_{columnSlug}
```
/**
 * Action triggered when the each custom column has loaded.
 *
 * @param HTMLElement element The HTML element when this component inserted to.
 * @param int postId The current post id.
 * @param string columnSlug The current column.
 * @param string permalink The current post permalink.
 */
hooks.doAction( 'googlesitekit.customColumnLoaded_' + columnSlug, element, postId, columnSlug, permalink );

// Example:
hooks.addAction( 'googlesitekit.customColumnLoaded_googlesitekit', 'google-site-kit',
	function( element, postId, columnSlug, permalink ) {
		var component = document.createElement( 'div' );
		component.className = 'googlesitekit-column-googlesitekit';
		component.id = 'googlesitekit-column-googlesitekit-'+ postId;

		element.appendChild( component );
		ReactDom.render( <GoogleSitekitColumns key={ postId } postid={ postId } permalink={ permalink } columnslug={ columnSlug } />, component );
	} );
```

#### googlesitekit.moduleDashboardDataRequest
```
	const requestedModuleData = this.hooks.applyFilters( 'googlesitekit.module' + context + 'DataRequest', [] );

	// Example
	hooks.addFilter(
		'googlesitekit.moduleDashboardDataRequest',
		'googlesitekit.MyPlugin',
		function( moduleData ) {
			moduleData.push( {
				dataObject: 'modules',        // The type of data to retrieve. One of 'modules' or 'settings'.
				identifier: 'my-module',      // The data item identifier, for example the module name.
				datapoint: 'score',           // The datapoint to retrieve.
				datapointID: 1,               // The ID of the data object to retrieve (empty for global data).
				callback: handleRecieveScore, // The function that is called when the data resolution completes.
				priority: 1                   // The priority for this data call.
			}
	);
```

##### googlesitekit.adminbarLoaded
```
/**
 * Action triggered when the adminbar modules is loaded.
*/
hooks.doAction('googlesitekit.adminbarLoaded');
```


#### googlesitekit.moduleMetaboxDataRequest
```
	const requestedModuleData = this.hooks.applyFilters( 'googlesitekit.module' + context + 'DataRequest', [] );

	// Example
	hooks.addFilter(
		'googlesitekit.moduleMetaboxDataRequest',
		'googlesitekit.MyPlugin',
		function( moduleData ) {
			moduleData.push( {
				dataObject: 'modules',        // The type of data to retrieve. One of 'modules' or 'settings'.
				identifier: 'my-module',      // The data item identifier, for example the module name.
				datapoint: 'score',           // The datapoint to retrieve.
				datapointID: 1,               // The ID of the data object to retrieve (empty for global data).
				callback: handleRecieveScore, // The function that is called when the data resolution completes.
				priority: 1                   // The priority for this data call.
			}
	);
```
#### googlesitekit_oauth_secret
```
/**
	 * Site Kit oAuth Secret is a string of the JSON for the Google Cloud Platform web application used for Site Kit
	 * that will be associated with this account. This is meant to be a temporary way to specify the client secret
	 * until the authentication proxy has been completed. This filter can be specified from a separate theme or plugin.
	 *
	 * To retrieve the JSON secret, use the following instructions:
	 * - Go to the Google Cloud Platform Console and create a new project or use an existing one at https://console.cloud.google.com/
	 * - In the APIs & Services section, enable the APIs that are used within Site Kit (Search Console, Analytics, Marketing Platform, etc)
	 * - Under 'credentials' either create new oAuth Client ID credentials or use an existing set of credentials
	 * - Set the authorized redirect URIs to be the URL to the oAuth callback for Site Kit, eg. https://<domainname>?oauth2callback=1 (this must be public)
	 * - Click the 'Download JSON' button to download the JSON file that can be copied and pasted into the filter as a string
	 * - Add filter in separate theme or plugin
	 */

apply_filters( 'googlesitekit_oauth_secret', '' );
```

#### googlesitekit_api_key

```
/**
 * Site Kit API key is a string of alphanumeric characters for the Google Cloud Platform web application used for Site Kit
 * that will be associated with this account. This is meant to be a temporary way to specify the client secret. Eventually
 * a centrally provided API key will be distributed as part of the plugin.
 */
apply_filters( 'googlesitekit_api_key', '' );
```

##### googlesitekit_screen_ids
```
/**
 * Filters the array of Site Kit screens specific to admin screens.
 *
 * @since 1.0.0
 *
 * @param array $screens Array of screen ids.
 */
$screens = apply_filters( 'googlesitekit_screen_ids', $screens );
```

###### googlesitekit.dateRange
```
/**
* Filter the date range used for queries.
*
* @param String The selected date range. Default 'Last 28 days'.
*/
const currentDateRange = applyFilters( 'googlesitekit.dateRange', __( 'Last 28 days', 'google-site-kit' ) );
```

##### googlesitekit.showDateRangeSelector-{moduleSlug}
/**
	* Filter whether to show a date range selector.
	*
	* Modules can opt into the date range selection feature by returning true.
	*/
const showDateRangeSelector = applyFilters( `googlesitekit.showDateRangeSelector-${ moduleSlug }`, false );