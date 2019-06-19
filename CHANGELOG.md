# Changelog

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/).

## [ 1.0.0-rc.4 ]

### Changed
* Always insert Tag Manager snippet when module is activated.
* Sort popular keywords by impressions in main dashboard. 
* Change link for switching AdSense account while setup.
* Change label in dashboard popular widget to Search Console.
* Update all Search Console label links to deep links.
* Show user profile for new account or non-matching tag flow in AdSense setup flow.
* Show AdSense SEVERE alert message in notification component.
* Setup wizard: add Ad detection, pass query var to Hen House.
* Remove auxiliary files from the release build that are irrelevant for wordpress.org.
* Provide better error messaging for OAuth errors.
* Use deep link on Adsense disapproved and pending status screens.
* Update text copy in module setup wins.
* Change AdSense warning "Removes old AdSense code" message as a notice for better visibility.
* Show better error message when `RateLimitExceeded` occurs.
* Update module list alignment on publisher wins component.
* Change text copy when tag exists and matched property found during Analytics Setup flow.
* Prevent initialization of the plugin when activated network-wide and display warning about current state of support.
* Update text copy for AMP client id optin in Analytics.
* Update Optimize AMP client id dependency to use it from Analytics setting.
* Change tag_partner value to "site_kit" for AdSense ad code.
* Only show admin bar menu for published posts that have Search Console data.

### Fixed
* Fix admin bar stats not shown in post edit screen.
* Fix data accuracy from date range calculation.
* Fix Analytics chart to show correct data based on selected date range.
* Show module status connected in Search Console dashboard screen for consistency.
* Fix for checking existing tag for AdSense in iframe test.
* Fix JavaScript error in Analytics setup flow when tag already exists.
* Make Optimize checks for Analytics and Tag Manager module data more error-proof.
* Fix siteURL value when verification not resolved on `is-site-exist` endpoint.
* Prevent checking for analytics existing tag from `wp_head` twice.
* Display correct message for AdSense settings screen when account is pending status.

### Added
* Add back button after GCP credentials input screen.
* Add unit tests for most of PHP classes.
* Add QUnit tests for all JavaScript helper functions.

### Removed
* Remove Updater Class.
* Remove unused screenshots section from wordpress.org readme.
* Remove TLDExtract dependency library.

## [ 1.0.0-rc.3 ]

### Changed
* Update Analytics setup flow with existing tag detected.
* Ensure all files license to Apache 2.0.
* Change Screen:render() method access to private.
* Add threshold for max user changes in traffic increase win.
* Update AdSense text copy.
* Display module status on publisher win.
* Show CTA when Analytics and AdSense not linked on Site Kit Dashboard.
* Avoid duplicate requests from DashboardWinsAlerts and NotificationCounter.

### Fixed
* Fix AMP compatibility (mostly for Native and Transitional Mode)
* Fix disconnect modal z-index and styling.
* Remove all admin notices from the Site Kit Dashboard.
* Fix notifications possibly being `undefined` in JavaScript.
* Clearly distinguish required scopes from granted scopes.
* Fix detection of which scopes have been granted by the user.
* Fix a bug where scopes would not be removed after deactivating a module.
* Fix a bug where refreshing the access token on login would never work because of still relying on user ID 0.
* Fix a bug where refreshing the access token on login would be attempted even if the user is not authenticated yet.
* Ensure the dashboard alert requesting reauthentication shows as soon as required scopes don't match granted scopes.
* Fix client configuration button is disabled when field is empty.
* Fix Analytics re-fetch account in setup flow.
* Ensure that a failure in the general batch request is caught and forwarded in the REST response.
* Redirect on OAuth failure so that the user does not get stuck in a white screen.

### Added
* Store the current user as owner when setting the project ID.
* Introduce API_Key_Client, outsourcing these pieces from OAuth_Client.

### Removed
* Remove authentication proxy code.
* Remove OAuth_Client abstraction.

## [ 1.0.0-rc.2 ]

### Changed
* Reorganize class files into more logical structure and ensure the file/folder structure matches the respective namespace.
* Leverage composer autoloading for the plugin codebase.
* Move modules JavaScript files into assets/js folder.
* Update AdSense setup flow to show better messaging for each account status.
* Change the connect more modules screen, remove modules grouping and update prioritization.
* Update text copy when connecting more modules.
* Change Analytics setup on setting screen, now display readonly data when the user has no access to Analytics account.
* Change the input for client id and secret to a single textarea.

### Fixed
* Fix setup new container in GTM.
* Fix JavaScript errors during authentication.
* Escape site name before sending user to create GCP. 
* Fix missing context object when instantiating Reset object.

### Added
* Introduce Plugin class as main entry point, to set up all other classes from that single register() method.
* Add URL to Analytics popular posts data table.
* Add Profile class to retrieve user email and photo from the Google People API. 

### Removed
* Remove helpers.php file.
* Remove loader.php file.

## [ 1.0.0-rc.1 ]

### Changed
* Connected services on Settings page are now in an Accordion layout. 
* Refactor module base and module manager classes.
* Migrate all module classes to the new infrastructure.
* Handle single data and batch data requests through one common foundation.
* Improve flexibility of batch data request mechanism.
* Update visual regression test data.
* Update copy text for on-boarding flow and plugin activation.
* Improve handling of insufficient scopes and data permission.
* Update webpack-bundle-analyzer library for security patch.

### Fixed
* Fix target link to Site Kit hen house page.
* Fix data being stored in the cache while error response.

### Added
* Add opt-in tracking checkbox to the setup flow.
* Add beta build option to webpack build process.
* Add details for PSI provides list to complete disconnect module message.

### Removed
* Remove remaining adCodes in the plugin codebase.
* Remove remaining references to "beta", "beta" tags for non beta releases.

## [ 1.0.0-beta.16 ]

### Changed
* Update all material components library.
* Improve AdSense disapproved account status flow.
* Only show activation CTAs to users who can set up modules.

### Fixed
* Fix regression in AdSense setup flow.

### Added
* Add user disconnect link from the Site Kit header menu.
* Additional tracking events for new user flows, app secret and api key entry.

## [ 1.0.0-beta.15 ]

### Changed
* Site owner must input client id and secret during first step of setup.
* Change PageSpeed Insights into a regular module that requires activation. Require and enable API key entry.
* Change license to Apache 2.0.
* Change the module base implementation to get `Google_Client` object.
* Use Screens Class to check when to enqueue the gtag script.
* Initializes Authentication instances and hooks during init.
* Separate splash/authentication/setup parts of the Dashboard into a new DashboardSplash page.
* Only show the new splash page in the menu if it is the only existing page that can be accessed.
* Tweak capabilities so that contributors and authors can only see the splash page (and post-level insights), but not the dashboard or module details.
* Migrate and updated existing REST API routes for more RESTful behavior.
* Use URL without trailing slash for redirect URI.
* Removes the user profile email from the AdSense setup screen.
* Update AdSense text copy when action still required during setup flow.
* Show PSI module in settings.
* Show loading message instead of pulsating boxes on dashboard when PSI loading.

### Added
* Introduces new setup wizard with multiple steps that replaces the previous proxy-based approach.
* Different user role will have different permission and steps to authenticate.
* Add new Splash screen for editor and contributor.
* Introduces tabs on Settings page.
* Introduces Tracking Class.
* Introduce Authentication Class.
* Introduce Updater Class.
* Add new feature to show data from different date range.
* Add new DateRangeSelector component that enables date range selection, and tracks the current selection.
* Add DateRangeSelector to Dashboard, Dashboard Details and Dashboard Module header (replacing label), page header conditionally.
* Add `stringToSlug` helper to convert "Last 28 Days" selection into a usable 'last-28-days' slug.
* Add Data API: Include date range slug with all data requests, and correctly handle caching.
* Add Date Range Selector: adjusts the dates for all queries used on page..
* Add withData HOC: enable a `googlesitekit.moduleDataReset`.
* Introduce new capability for setting up the plugin as it has partly different requirements from the existing capability for managing plugin options.
* Introduce notification on splash page to indicate successful authentication (authentication, not setup).
* Introduce encapsulated REST API infrastructure organized as individual routes.
* New stateful component: APIKeyEditor - enables editing the API key. Default open when no key is present. Shows on dashboard after activation or when clicking "complete configuration"
* Add a new dialog to view Client ID/Secret + API key under Settings->Admin

### Fixed
* Fix AdSense setup flow, when no domain found, use the account-pending-review status.
* Fix incorrect container id saved in Tag Manager.
* Fix issue blank accountId when save Tag Manger in Settings page.
* Fix Admin Bar Backstop reference images.
* Fix Tag Manager `get_batch_request_data` compatibility with ModuleStatics.
* Fix requirements for setup notification in dashboard and migrate it from the Search Console module to the core JS components folder, as it is a crucial pillar and not only related to Search Console.
* Fix module activation error, by use the correct way to send post data with apiFetch.
* Fix rest no route when do post search.
* Fix PHP warning error when do reset from cli.

### Removed
* Remove tracking.php helper file.
* Remove authentication.php helper file.
* Remove updater.php helper file.
* Remove `get_missing_api_key_admin_notice` filter.

## [ 1.0.0-beta.14 ]

### Fixed
* Fix CTA error styling on WP Dashboard.

### Added
* Add Qunit, PHPUnit & BackstopJS visual regression tests on Travis.

## [ 1.0.0-beta.13 ]

### Changed
* Split CSS files into admin, adminbar, and wpdashboard.
* Frontend update: readableNumber to caps, internal links arrow removal, CTA error design update.
* Update AdSense message during setup flow.
* Update AdSense link in Outro component to AdSense account page.

### Added
* AdSense Module, Select, Text Field, and Modal to Storybook.
* Add BackstopJS testing.
* Introduce Admin_Dashboard class to handle site kit wp dashboard component display.
* Add new method get_asset to Assets class to allow other class to get enqueued script.
* Add new method to check if the current screen is Site Kit Screen in Screens class.
* Add generator meta for the Site Kit plugin.
* Introduce Admin_Bar class to handle admin bar component display.
* Add Ad blocker warning to AdSense Dashboard, AdSense deactivation component and AdSense earning widget.

### Fixed
* Fix blank admin bar on the front end by checking valid currentScreen object.
* Fix AdSense header tag not print out for non-logged in users.
* Fix Analytics Tag not print out for non-logged in users.
* Fix Tag Manager Tag not print out for non-logged in users.

### Removed
* Remove dashboard.php helper file.
* Removes all admin_notices and network_admin_notices hooks, and only show Site Kit notices in Site Kit screen only.
* Remove adminbar.php helper file.

## [ 1.0.0-beta.12 ]

### Changed
* Refractor authentication notices to use new notices infrastructure.
* Ensure error object consistency and status code to all modules.
* Register all assets consistently, but only enqueue as necessary.
* Allow to granularly enqueue scripts, stylesheets, the Google fonts definition and rendering SVG icons.
* Make the preview blocks smoother.
* Only use Ad Blocker detection when necessary.

### Added
* Introduce Notices and Notice classes, as common foundation for any admin notices.
* Introduce Activation class for handling plugin activation and related actions.
* Introduce Assets, Asset, Script, and Stylesheet classes, as foundation for asset registration and enqueuing.
* Introduce Screens and Screen classes to consistently handle admin screens, including their addition to the menu, enqueueing their assets and rendering their markup.
* Add build command to package plugin only for WordPress 5.0 or above.
* Add custom `tag_partner` parameter to the inserted AdSense script. 

### Fixed
* Fix check for posts on a new site so that it works in other languages than English.
* Fix inaccurate plugin link in network activation.
* Fix authentication error not being displayed when using Proxy authentication mode.
* Fix AdSense notifications link to open in new tab.
* Fix blank `siteURL` in Site Verification process.
* Fix `api-fetch` dependency error.
* Fix required parameters error in Analytics and Tag Manager module.
* Fix React state update on an unmounted component error.
* Fix Tag Manager settings value to display value correctly.

## [ 1.0.0-beta.11 ]

### Changed
* Improve Ad Blocker warning styling.
* Reduced total JavaScript bundle size by removing babel/polyfill and load it from external.
* Improve AdSense outro layout.
* Refractor reset helper functions to a Uninstallation Class.
* Refractor Cron helper functions to a Cron Class.
* Use `withFilter` Higher Order Component from `wp-components` package.
* Use Search Console property in wp dashboard setup message.

### Added
* Add wp-components package as external packages.
* Add Context Class as part of refractor the context helper functions.

### Fixed
* Fix PHP fatal error when checking Analytics-AdSense connection.
* Fix wrong preview component flash when loading AdSense dashboard.
* Fix generated webpack bundle analyzer output source file.
* Fix error 404 when return no data from post search.
* Fix post title escaped html entities in Admin Bar.

## [ 1.0.0-beta.10 ]

### Changed
* Update the error response for AdSense module for consistency by using WP_Error.
* Setup Analytics CTA on WordPress dashboard now directly go to Analytics setup flow.
* Update AdSense copy.
* Update error response copy.
* WithData Higher Order Component now accepts a `layoutOptions` argument.
* Update the AdSense account link to AdSense dashboard page when the account is found.
* Remove Lodash from JavaScript bundle.

### Added
* Add linter for js in modules folder.
* Add generic error notification component to catch REST API error response.
* Add Ad Blocker detector: warn users of conflicts when activating the AdSense module.  
* Add Copyright and License information to all the files.

### Fixed
* Return empty data instead of error 404 when checking `is-site-exist`.


## [ 1.0.0-beta.9 ]

### Changed
* Implement how components handle zero data and error by passing function to higher order component.
* Show Analytics setup CTA in Admin bar when module is not active.
* Update Storybook with data.
* Update copy for AdSense disapproved account.
* Use of sanitize_callback & validate_callback in REST API endpoint.
* Define HTTP error status for error response in REST API. 
* Allow component to pass layout for zero data component through withData higher order component.

### Added
* Add notification component to handle expired refresh token, add a link for user to reauthenticate their account.
* Add setup button to WordPress dashboard widget for unauthenticated user.
* Add 2 AdSense pending status in AdSense setup flow. 

### Fixed
* Fix mini pie chart percentages for Google Analytics.
* Fix wording in Search Console module dashboard.
* Fix release zip scripts to ensure it has google-site-kit prefix.
* Ensure prepareSecondsForDisplay helper function to always return value.
* Disable settings page and menu for unauthenticated user.
* Fix AdSense initial enableTag option not being saved.
* Fix JS error in data.js module for data cache not exist.
* Fix REST API response data in PHP 5.4.
* Fix z-index autocomplete issue in post search component.

## [ 1.0.0-beta.8 ]

### Changed
* AdSense: Ensure tag inserted into site when the account status is pending.
* Remove sessionStorage when module deactivated.
* Saving unchanged settings now will not throw error.
* Settings: only enable the "Confirm Changes" (save) button when there are changes to save.
* Add UTM tracking to AdSense signup URL.
* Show CTA instead of error, when AdSense and Analytics are not linked.
 
### Fixed
* Fix JS render error when the element id does not exist.
* Ensure 'multiple accounts' state is removed in AdSense module.
* Fix JS warning error because of missing key prop in Notification component.
* Ensure splash screen not shown after user returns from OAuth flow.
* Fix JS error when no data returned from Search Console for new site property.
* Ensure the AdSense module connection status shows correct status during setup flow.

## [ 1.0.0-beta.7 ]

### Changed
* Check existing AdSense tag and Analytics tag using iFrame (in addition to wp_head detection).
* Refractor the `withData` Higher Order Component to detect error and zero data, and properly show the notice component.
* Shorten the setup process after installing the plugin by hiding the marketing splash screen.
* Skip site verification if the account has already been added to the Search Console property by the Site Owner.
* Update AdSense text copy.
* Take user to setup Analytics directly when the setup CTA button clicked.
* Combine AdSense notifications into one notification.
* Update title format in each Site Kit dashboard for consistency.
* Add `site` query string to AdSense create account button.
* Push down the PageSpeed Insight box position.
 
### Added
* Add auto refresh for AdSense during setup flow when the user is waiting for their AdSense account approval.
* Add notification to install Developer Companion plugin when the plugin is installed on a staging or development site.

### Fixed
* Clear session storage when reauthenticating to ensure user will get latest data.
* In AdSense setup process, open the CTA link in new tab.
* Show Analytics error CTA when it's not properly setup.
* Prevent Google Pie Chart label flicker.
* Fix PageSpeed Insight source link arrow.
* Remove cancel button on AdSense setup when the status is connected.
* Fix uninstall script and reset cli command to delete all plugin options and user settings.

## [ 1.0.0-beta.6 ]

### Changed
* Remove AdSense settings on module deactivation.
* Optimize bundle build process in result smaller total file sizes.
* Improve analytics chart data resiliency for the new Analytics account.
* Improve data batch splitting to defer long running requests (eg. pagespeed request).
* Improve AdSense currency localization.
* Improve copy text on the Dashboard.
* Improve AdSense setup process during the pending state.
* Format all the stats number to localized number.
* Improve Analytics setup, start dropdown with placeholder text and ask user to create new account when there is no account yet.

### Added
* Add data for Storybook.
* Add frontend tracking for Admin Bar by loading it dynamically.
* Improve number localization across plugin.

### Removed
* Remove demodata for the demo mode.

### Fixed
* Use `register_uninstall_hook` instead of `uninstall.php` to prevent fatal with PHP 5.2.
* Improve AdSense Alert notification.
* Ensure we delete the `dist/` folder during the release process.
* Fix Analytics accounts dropdown not updated after the data being saved.
* Fix Analytics tag detection.
* Ensure Analytics and AdSense are linked before querying Analytics report for revenue.
* Ensure to clear localStorage when disconnect the account.
* Get AdSense revenue from the current specific domain.

## [ 1.0.0-beta.5 ]

### Changed
* Update copy text for CTA Error title for search console.
* Use Batch request to get data for admin bar components.
* Update copy text for Tag Manager error messages.
* Update Guzzle PHP library to 5.3.3 for PHP 7.3 compatibility
* AdSense setup process, when the domain not found, show pending status.
* Refractor the error notice coming from the Proxy Auth. 
* Improve error handling in Admin bar.

### Added
* Add empty data component, to show when there is no data from Search Console yet. Usually a new site.
* Add tracking events in admin bar.
* Add empty data CTA component used in admin bar.
* Module icon notification.
* Add support to get token timestamp from Proxy.

### Removed
* Removed Search Console crawl error api since it is deprecated.
* AdSense setup process, remove iframe checking, instead we use wp_head detection.

### Fixed
* Ensure Analytic setting is updated after the option updated.
* Fix PHP fatal error when api_key filter not used.
* Fix to allow Optimize validation ID to contain chars and digits.
* Fix Setup notification win to show module name.
* Fix admin bar loading error, and now showing empty data cta when there is no data.
* Fix warning when there is no href for Link component
* Fix PHP Fatal error because the API client not initialized right after user login.
* Fix exception when Analytics options has not changed.
* Fix the site verification error when the site is non-http or non-www

## [ 1.0.0-beta.4 ]

### Changed
* Abstract Oauth Client so it can switch between Proxy Oauth and Direct Oauth.
* Improve text copy throughout the plugin.
* Improve permission system by using custom capabilities and tying into WordPress system.
* Enable up is red down is green for datablock arrow component.
* Change plugin slug to google-site-kit
* Change plugin namespace to Google\Site_Kit
* Update the release script to only include necessary files reduce plugin zip file size.
* Restructure plugin files for PHP 5.2 compatibility and prevent fatal error in PHP 5.2.*.
* Updates text copy, especially in AdSense module.
* Rename GoogleSitekit_Cache class to just Cache since it is already in the namespace.
* Decouple plugin activation/deactivation routines.
* Updates AdSense notice copy.
* Replaces anchor links on splash screen.
* Do not allow module detail view access until authenticated.
* Removes OptIn from setup flow, fixes last module setup step styling.

### Added
* Add PageSpeed Insights Module.
* Add Proxy Oauth Client to implement Sitekit authentication via Proxy.
* Add Analytics tracking for the plugin only when the user optin.
* Improve the second user setup flow screen.

### Removed
* Server side PHP Cache.
* Remove NestedLink Component.
* Removes ‘Change Unknown’ data block text.

### Fixed
* Plugin updater accommodate plugin information API.
* Fix cookie constant being defined too early.
* Fix the connected account widget info.
* Hide settings button for editors.
* Fix the Google Analytics setup error when no GA account found.
* AdSense advance settings link now go to external Google AdSense dashboard.
* Improve styling on WP Dashboard component.
* Ensure goals cta shows correctly.
* Fixed overflow in Analytics acquisition component. 
* Fixes select console error during initial setup.
* Fix styling on activation internal link. 

## [ 1.0.0-beta.3 ]

### Changed
* Store Google credentials (Authentication Token and Refresh Token) in User Meta.
* Improve text copy throughout the plugin.

### Added
* Introduce infrastructure for storing encrypted option and user option.
* Improve security by encrypt credentials data in database.
* Add Analytics header tag detection during setup process.
* Add AdSense header tag detection during setup process, including new text & logic.
* Notification icon in Site Kit menu for alerts and wins.
* Dynamic setup win: show win after each module setup.

### Removed
* Post column support.
* Remove cron support from Analytics and Search Console modules.

### Fixed
* Improve Site Verification process when meta not found
* Improve cli command and the documentation
* Improve Google Analytics setup component and fix some issue in account, property and profile dropdown.
* Improve text link in Analytics component.
* Improve data resieliency.
* Ensure setup flow continues until module setup is complete.
* Don't count "Hello World" post towards published when calculating Win.

## [ 1.0.0-beta.2 ]

### Changed
* Improve handling of 0s or empty data returned from Search console and AdSense. Skip showing elements, show error message, or show CTA to wait for data as appropriate.
* Improve accessibility of the modal component.
* Implement beta 'opt-in' checkbox.
* Improve error handling when saving module settings.
* Add JSON and Optimize ID validation to Optimize settings.
* Wrap all data tables in TableOverflowContainer, improving mobile display.
* Include vendor files in plugin instead of loading from CDN (react, lodash).
* Improve Analytics Dashboard Widget error message.

### Fixed
* Enable editor user role access to Site Kit Dashboard and adminbar.
* Improve Internet Explorer 11 support.
* Address a lodash conflict in WordPress 4.9 and earlier.
* Only show setup complete notice once.

## [ 1.0.0-beta.1 ]
* Initial closed beta release.
