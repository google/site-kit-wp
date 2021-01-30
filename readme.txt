=== Site Kit by Google ===

Contributors:      google
Requires at least: 4.7
Tested up to:      5.6
Requires PHP:      5.6
Stable tag:        1.25.0
License:           Apache License 2.0
License URI:       https://www.apache.org/licenses/LICENSE-2.0
Tags:              google, search-console, analytics, adsense, pagespeed-insights, optimize, tag-manager, site-kit

Site Kit is a one-stop solution for WordPress users to use everything Google has to offer to make them successful on the web.

== Description ==

Site Kit is the official WordPress plugin from Google for insights about how people find and use your site. Site Kit is the one-stop solution to deploy, manage, and get insights from critical Google tools to make the site successful on the web. It provides authoritative, up-to-date insights from multiple Google products directly on the WordPress dashboard for easy access, all for free.

= Bringing the best of Google tools to WordPress =

Site Kit includes powerful features that make using these Google products seamless and flexible:

* Easy-to-understand stats directly on your WordPress dashboard
* Official stats from multiple Google tools, all in one dashboard
* Quick setup for multiple Google tools without having to edit the source code of your site
* Metrics for your entire site and for individual posts
* Easy-to-manage, granular permissions across WordPress and different Google products

= Supported Google tools =

Site Kit shows key metrics and insights from different Google products:

* **Search Console:** Understand how Google Search discovers and displays your pages in Google Search. Track how many people saw your site in Search results, and what query they used to search for your site.
* **Analytics:** Explore how users navigate your site and track goals you've set up for your users to complete.
* **AdSense:** Keep track of how much your site is earning you.
* **PageSpeed Insights:** See how your pages perform compared to other real-world sites. Improve performance with actionable tips from PageSpeed Insights.
* **Tag Manager:** Use Site Kit to easily set up Tag Manager- no code editing required. Then, manage your tags in Tag Manager.
* **Optimize:** Use Site Kit to easily set up Optimize- no code editing required. Then, set up A/B tests in Optimize.

== Installation ==
**Note**: Make sure that your website is live. If your website isn't live yet, Site Kit can't show you any data. 
However, if you have a staging environment in addition to your production site, Site Kit can display data from your production site in the staging environment. Learn how to use [Site Kit with a staging environment] (https://sitekit.withgoogle.com/documentation/using-site-kit-on-a-staging-environment/).

= Installation from within WordPress =

1. Visit **Plugins > Add New**.
2. Search for **Site Kit by Google**.
3. Install and activate the Site Kit by Google plugin.
4. Connect Site Kit to your Google account. If there are multiple WordPress admins, keep in mind that each admin must connect their own Google account in order to access the plugin.


= Manual installation =

1. Upload the entire `google-site-kit` folder to the `/wp-content/plugins/` directory.
2. Visit **Plugins**.
3. Activate the Site Kit by Google plugin.
4. Connect Site Kit to your Google account. If there are multiple WordPress admins, keep in mind that each admin must connect their own Google account in order to access the plugin.

= After activation =

1. Visit the new **Site Kit** menu.
2. Follow the instructions in the setup flow.
3. Go to the main Site Kit dashboard which already displays key metrics from Search Console.
4. Connect additional Google tools under **Site Kit > Settings**. Learn more about [which tools are right for you](https://sitekit.withgoogle.com/documentation/choose-tools/).

== Frequently Asked Questions ==

For more information, visit the [official Site Kit website](https://sitekit.withgoogle.com/documentation/).

= Where should I submit my support request? =

First, check our [troubleshooting guide](https://sitekit.withgoogle.com/documentation/fix-common-issues/). If you're still experiencing issues, use the [wordpress.org support forums](https://wordpress.org/support/plugin/google-site-kit). If you have a technical issue with the plugin where you already have more insight on how to fix it, you can also [open an issue on GitHub instead](https://github.com/google/site-kit-wp/issues).

= Is Site Kit free? =

The Site Kit plugin is free and open source, and will remain so. Individual Google products included in Site Kit are subject to standard terms and fees (if any) for those products.

= What happens if I already use another plugin to integrate one or more Google products? =

We're happy to hear that and you can continue using it if it meets your needs. You can also install Site Kit alongside to gain access to other insights and integrations.

= Will Google offer more tools through Site Kit? =

We plan to expand the plugin’s capabilities and integrations in the future; we’d love to get your feedback on which products and features we should prioritize.

= How can I contribute to the plugin? =

If you have some ideas to improve the plugin or to solve a bug, feel free to raise an issue or submit a pull request in the [GitHub repository for the plugin](https://github.com/google/site-kit-wp). Please stick to the [contributing guidelines](https://github.com/google/site-kit-wp/blob/master/CONTRIBUTING.md). You can also contribute to the plugin by translating it. Simply visit [translate.wordpress.org](https://translate.wordpress.org/projects/wp-plugins/google-site-kit) to get started.

== Changelog ==

= 1.25.0 =

**Added**

* Launch new All Traffic widget in the Site Kit dashboard, which surfaces more detailed information about channels, includes a time-based graph, and surfaces similar metrics for countries and devices the site is accessed from. See [#2429](https://github.com/google/site-kit-wp/issues/2429).

**Enhanced**

* Modify pie chart tooltip behavior for new All Traffic widget so that tooltips are only shown when hovering over a pie slice. See [#2701](https://github.com/google/site-kit-wp/issues/2701).
* Store initial Site Kit version per user for more targeted messaging in the future and introduce `googlesitekit_reauthorize_user` action. See [#2692](https://github.com/google/site-kit-wp/issues/2692).
* Improve user experience of new All Traffic widget for when it is loading and for when there is no relevant data available. See [#2675](https://github.com/google/site-kit-wp/issues/2675).
* Fix layout of new All Traffic widget on mobile viewports to use a single column. See [#2663](https://github.com/google/site-kit-wp/issues/2663).
* Add contextual documentation links to new All Traffic widget to explain special dimension values "(not set)" and "(other)". See [#2642](https://github.com/google/site-kit-wp/issues/2642).
* Modify new All Traffic widget so that the line chart always uses the same color indicated by the currently selected pie slice. See [#2625](https://github.com/google/site-kit-wp/issues/2625).
* Modify font styles in the new All Traffic widget to match font styles used in Search Funnel widget and elsewhere throughout the plugin. See [#2623](https://github.com/google/site-kit-wp/issues/2623).
* Rely on new Search Console "fresh data" feature to display metrics as recent as 1 day ago, improving on the previous offset of 2 days. See [#2522](https://github.com/google/site-kit-wp/issues/2522).
* Remove various old REST datapoints in AdSense, Analytics, and Search Console modules that were only present to access specific settings and unused. See [#2507](https://github.com/google/site-kit-wp/issues/2507).
* Introduce `core/location` JS store, rely on it for redirects, and fix notification about unsatisfied scopes unnecessarily appearing before an OAuth redirect. See [#2497](https://github.com/google/site-kit-wp/issues/2497).
* Get rid of remaining usage of legacy `dateRange` argument in AdSense widgets. See [#2477](https://github.com/google/site-kit-wp/issues/2477).
* Improve JS API caching layer to cache certain error responses if they include a `cacheTTL` extra data property, allowing to avoid excessive Analytics API requests when the AdSense account is not linked. See [#2457](https://github.com/google/site-kit-wp/issues/2457).
* Introduce infrastructure for dynamically controlled feature flags via a `googlesitekit_is_feature_enabled` filter. See [#2452](https://github.com/google/site-kit-wp/issues/2452).
* Implement logic to automatically combine UI for widgets that are in special states, e.g. widgets without sufficient API response data, or widgets that require a specific module to be set up first. See [#2252](https://github.com/google/site-kit-wp/issues/2252).
* Add widget contexts and register widget areas for Site Kit module pages. See [#2062](https://github.com/google/site-kit-wp/issues/2062).

**Fixed**

* Fix All Traffic widget UI bug where pie chart tooltips would flicker when hovering over them. See [#2709](https://github.com/google/site-kit-wp/issues/2709).
* Ensure line chart in All Traffic is correctly aligned with the overall count and the pie chart at the bottom. See [#2708](https://github.com/google/site-kit-wp/issues/2708).
* Fix performance lag across Site Kit screens due to a problem in the `getModules` selector of the `core/modules` store. See [#2691](https://github.com/google/site-kit-wp/issues/2691).
* Fix bug where Tag Manager and Analytics snippet could be inserted twice on AMP pages. See [#2668](https://github.com/google/site-kit-wp/issues/2668).
* Fix bug with All Traffic widget where selected pie slice would no longer remain selected when changing the current date range. See [#2644](https://github.com/google/site-kit-wp/issues/2644).
* Fix graph in All Traffic widget to not cut off axis labels on viewports smaller than desktop. See [#2624](https://github.com/google/site-kit-wp/issues/2624).

= 1.24.0 =

**Added**

* Implement `UserDimensionsPieChart` component for new Analytics All Traffic widget. See [#2425](https://github.com/google/site-kit-wp/issues/2425).
* Implement main tabs UI for the new All Traffic widget. See [#2424](https://github.com/google/site-kit-wp/issues/2424).
* Implement `TotalUserCount` component for new Analytics All Traffic widget. See [#2423](https://github.com/google/site-kit-wp/issues/2423).
* Implement `UserCountGraph` component for new Analytics All Traffic widget. See [#2422](https://github.com/google/site-kit-wp/issues/2422).

**Enhanced**

* Add review and support links in the plugin's list table entry. See [#2516](https://github.com/google/site-kit-wp/issues/2516).
* Rename `icon` argument of `registerWidgetArea` to `Icon` and require it to be a `WPComponent` (e.g. an SVG). See [#2505](https://github.com/google/site-kit-wp/issues/2505).
* Improve UX for modifying user input settings, removing the requirement to click through subsequent questions when only wanting to change a specific response. See [#2499](https://github.com/google/site-kit-wp/issues/2499).
* Implement dynamic source link in the new All Traffic widget. See [#2428](https://github.com/google/site-kit-wp/issues/2428).
* Add interactivity to new All Traffic widget so that selecting a pie chart slice contextually updates the count and graph displayed. See [#2426](https://github.com/google/site-kit-wp/issues/2426).
* Add support for a `dimensionFilters` argument to the Analytics `GET:report` REST datapoint in PHP and the `getReport` selector in JS. See [#2421](https://github.com/google/site-kit-wp/issues/2421).
* Enhance `whenActive` higher-order component to accept a `FallbackComponent` as well as an `IncompleteComponent` prop. See [#2381](https://github.com/google/site-kit-wp/issues/2381).
* Remove legacy publisher win notifications. See [#2285](https://github.com/google/site-kit-wp/issues/2285).
* Add `storeName` argument to `registerModule` action of the `core/modules` store to specify the name of the JS datastore for the module. See [#2271](https://github.com/google/site-kit-wp/issues/2271).
* Move date awareness for Search Console API requests to the client, allowing for more contextual date information to be available. See [#2237](https://github.com/google/site-kit-wp/issues/2237).
* Move date awareness for Analytics API requests to the client, allowing for more contextual date information to be available. See [#2236](https://github.com/google/site-kit-wp/issues/2236).
* Introduce `getGoogleSupportURL` selector to `core/site` store in JS. See [#2221](https://github.com/google/site-kit-wp/issues/2221).
* Add support for an optional `SettingsSetupIncompleteComponent` argument to the `registerModule` action of the `core/modules` store, allowing developers to register a custom UI component for when the module is not fully connected. See [#2080](https://github.com/google/site-kit-wp/issues/2080).
* Update the plugin's admin bar menu to rely on functional hook-based components using the datastore. See [#2076](https://github.com/google/site-kit-wp/issues/2076).
* Update the plugin's WordPress dashboard widget to rely on functional hook-based components using the datastore. See [#2075](https://github.com/google/site-kit-wp/issues/2075).
* Switch `core/user/data/user-input-settings` REST endpoint to use remote authentication service API endpoint. See [#2048](https://github.com/google/site-kit-wp/issues/2048).
* Implement user input block to edit responses under `Site Kit > Settings > Admin Settings`. See [#2041](https://github.com/google/site-kit-wp/issues/2041).
* Introduce reusable infrastructure for rendering tags, relying on new `Tag_Interface` and `Guard_Interface` interfaces as well as `Tag` and `Module_Tag` classes, now being used across all modules. See [#475](https://github.com/google/site-kit-wp/issues/475).

**Fixed**

* Fix AdSense overview graph UI so that the available space for the total numbers expands as necessary. See [#2555](https://github.com/google/site-kit-wp/issues/2555).
* Prevent a remote notifications API request for development sites where the plugin is not using the authentication service. See [#2495](https://github.com/google/site-kit-wp/issues/2495).
* Fix JavaScript error triggered upon resetting the plugin's data. See [#2478](https://github.com/google/site-kit-wp/issues/2478).
* Update all Analytics deep links to use the `getServiceReportURL` selector for correct encoding of parameters and consistent behavior. See [#2405](https://github.com/google/site-kit-wp/issues/2405).
* Fix bug in legacy API layer dealing with errors in a batch response that could result in infinite loading states on module pages. See [#2403](https://github.com/google/site-kit-wp/issues/2403).
* Improve Analytics property matching logic so that users with many Analytics accounts do not run into user quota errors. See [#2218](https://github.com/google/site-kit-wp/issues/2218).
* Introduce `numFmt` function for centralized Site Kit-specific number formatting, localize percentage formatting, and fix various number formatting inconsistencies. See [#2200](https://github.com/google/site-kit-wp/issues/2200).

= 1.23.0 =

**Added**

* Scaffold components for a new version of the Analytics All Traffic widget. See [#2392](https://github.com/google/site-kit-wp/issues/2392).
* Display graph with historic AdSense data on module page, showing earnings, RPM, impressions and CTR over time. See [#1921](https://github.com/google/site-kit-wp/issues/1921).

**Enhanced**

* Introduce `listFormat` function to format entries in a comma-separated list. See [#2486](https://github.com/google/site-kit-wp/issues/2486).
* Rename arguments across various datastore actions requiring a `WPComponent` type to use capitalized names to better indicate a `WPComponent` (and not a `WPElement`) is required. See [#2413](https://github.com/google/site-kit-wp/issues/2413).
* Improve validation of user input submission states. See [#2323](https://github.com/google/site-kit-wp/issues/2323).
* Introduce `ActivateModuleCTA` and `CompleteModuleActivationCTA` components to centrally manage UI for those scenarios. See [#2299](https://github.com/google/site-kit-wp/issues/2299).
* Remove legacy `googlesitekit.moduleHasSetupWizard` JS filter. See [#2291](https://github.com/google/site-kit-wp/issues/2291).
* Remove legacy splash screen and the associated components. See [#2290](https://github.com/google/site-kit-wp/issues/2290).
* Allow registering module icon SVGs via the `core/modules` action `registerModule`. See [#2143](https://github.com/google/site-kit-wp/issues/2143).

**Fixed**

* Fix various low-level technical bugs due to duplicate module initialization by relying on a single reused Webpack runtime across entrypoints. See [#2444](https://github.com/google/site-kit-wp/issues/2444).
* Remove duplicate error message UI on top of module settings panel, since error messages are now displayed within the panel's main content already. See [#2396](https://github.com/google/site-kit-wp/issues/2396).
* Fix component-specific initialization logic of Google charts library to prevent duplicate initialization. See [#2247](https://github.com/google/site-kit-wp/issues/2247).

= 1.22.0 =

**Added**

* Surface WordPress-specific user experience recommendations in the PageSpeed Insights widget. See [#2390](https://github.com/google/site-kit-wp/issues/2390).
* Add support for `checkRequirements` argument to `registerModule` action of `core/modules` store, which allows to block a module from being activated until certain requirements are met. See [#2130](https://github.com/google/site-kit-wp/issues/2130).

**Enhanced**

* Ensure that all URIs on the authentication service are automatically refreshed as necessary when connecting as a user to an already connected site, fixing issues where sites could get stuck after updating their URLs. See [#2383](https://github.com/google/site-kit-wp/issues/2383).
* Move the date picker into the Site Kit header bar and make it sticky so that it is always visible when scrolling. See [#2331](https://github.com/google/site-kit-wp/issues/2331).
* Remove outdated dashboard notification warning vaguely about missing permissions, which is now covered with more specific widget CTAs. See [#2329](https://github.com/google/site-kit-wp/issues/2329).
* Add support for feature flags in PHP and experimentally require user input completion upon setup. See [#2316](https://github.com/google/site-kit-wp/issues/2316).
* Implement success notification displayed after completing the user input flow. See [#2283](https://github.com/google/site-kit-wp/issues/2283).
* Add support for displaying datastore-driven global error notifications in the plugin header. See [#2261](https://github.com/google/site-kit-wp/issues/2261).
* Improve logic to determine whether a Search Console API report response is "empty", via new `isZeroReport` function for Search Console. See [#2244](https://github.com/google/site-kit-wp/issues/2244).
* Improve logic to determine whether an Analytics API report response is "empty", via new `isZeroReport` function for Analytics. See [#2243](https://github.com/google/site-kit-wp/issues/2243).
* Rely on JavaScript date parsing for AdSense widgets. See [#2235](https://github.com/google/site-kit-wp/issues/2235).
* Add `core/modules` actions and selectors for managing module settings panel state. See [#2181](https://github.com/google/site-kit-wp/issues/2181).
* Implement Site Kit dashboard notification for when requesting user input to be completed. See [#2043](https://github.com/google/site-kit-wp/issues/2043).
* Implement exponential backoff to retry Google service API requests a limited amount of time if they fail with temporary errors. See [#1998](https://github.com/google/site-kit-wp/issues/1998).

**Fixed**

* Fix Search Console latest data threshold back to 2 days ago as that is the latest data the API provides. See [#2458](https://github.com/google/site-kit-wp/issues/2458).
* Make e2e tests pass for WordPress 5.6. See [#2455](https://github.com/google/site-kit-wp/issues/2455).
* Fix race condition where widgets could run into an error when their necessary datastore selector had not started resolving yet. See [#2436](https://github.com/google/site-kit-wp/issues/2436).
* Fix various spelling errors throughout the UI of the plugin. See [#2401](https://github.com/google/site-kit-wp/issues/2401).
* Flush browser session storage on plugin updates to prevent stale data from being served against new logic. See [#2334](https://github.com/google/site-kit-wp/issues/2334).
* Ensure that REST API preloaded data is not computed and included outside of Site Kit admin screens. See [#2315](https://github.com/google/site-kit-wp/issues/2315).
* Fix failing PHPUnit tests for compatibility with upcoming WordPress 5.6. See [#2264](https://github.com/google/site-kit-wp/issues/2264).
* Fix broken Analytics frontend deep links on AdSense module page. See [#2228](https://github.com/google/site-kit-wp/issues/2228).

= 1.21.0 =

**Enhanced**

* Include current user's Site Kit capabilities in Site Health report. See [#2314](https://github.com/google/site-kit-wp/issues/2314).
* Mark user input state as completed once user has submitted their information. See [#2310](https://github.com/google/site-kit-wp/issues/2310).
* Finalize copy for new `googlesitekit-user-input` screen. See [#2302](https://github.com/google/site-kit-wp/issues/2302).
* Display informational warning before setup about limited support for WordPress versions before 5.0. See [#2289](https://github.com/google/site-kit-wp/issues/2289).
* Modify Search Console API queries so that they include results up until one day ago. See [#2284](https://github.com/google/site-kit-wp/issues/2284).
* Add support for widgets to have multiple (fallback) widths via `googlesitekit.widgets.registerWidget`, laying out widget grid with as few gaps as possible. See [#2251](https://github.com/google/site-kit-wp/issues/2251).
* Modify widgets registered with `quarter` width to render for half the screen width on mobile viewports. See [#2250](https://github.com/google/site-kit-wp/issues/2250).
* Introduce `ReportError` and `ReportZero` components which should be returned by widgets that are in error state or have no data to display. See [#2246](https://github.com/google/site-kit-wp/issues/2246).
* Add JS utility functions `sumObjectListValue`, `averageObjectListValue`, and enhance capabilities of `extractForSparkline` function. See [#2245](https://github.com/google/site-kit-wp/issues/2245).
* Improve logic to determine whether an AdSense API report response is "empty", via new `isZeroReport` function for AdSense. See [#2242](https://github.com/google/site-kit-wp/issues/2242).
* Simplify adding strings only visible to screen reader users by implementing a `VisuallyHidden` component. See [#2165](https://github.com/google/site-kit-wp/issues/2165).
* Reduce complexity of implementing and registering `settingsEdit` components for a module by centrally handling setting submission. See [#2137](https://github.com/google/site-kit-wp/issues/2137).
* Modify the `createModuleStore` JavaScript function so that every module store has a `canSubmitChanges` selector and a `submitChanges` action. See [#2136](https://github.com/google/site-kit-wp/issues/2136).
* Implement UI design for `googlesitekit-user-input` screen. See [#2040](https://github.com/google/site-kit-wp/issues/2040).
* Simplify module class infrastructure and implement (internal) module registry. See [#1939](https://github.com/google/site-kit-wp/issues/1939).

**Fixed**

* Fix bug where Analytics widgets would fire their API requests even when the module wasn't completely set up, resulting in unnecessary error responses. See [#2358](https://github.com/google/site-kit-wp/issues/2358).
* Fix JavaScript translations that were not appearing to work correctly, given the site uses WordPress >= 5.0, which is required for support of JavaScript translations. See [#2171](https://github.com/google/site-kit-wp/issues/2171).
* Fix bug where a previous error from an action would not be cleared when trying the same action again. See [#2156](https://github.com/google/site-kit-wp/issues/2156).
* Fix a few translation strings that were concatenating date ranges, making them correctly translatable. See [#2146](https://github.com/google/site-kit-wp/issues/2146).
* Fix compatibility issue where `amp-auto-ads` element would not be present in AMP singular content when also using the Yoast SEO plugin. See [#2111](https://github.com/google/site-kit-wp/issues/2111).

= 1.20.0 =

**Added**

* Implement post search widget using the new Widget API. See [#2023](https://github.com/google/site-kit-wp/issues/2023).
* Allow registering a `settingsViewComponent` and `settingsEditComponent` when calling the `registerModule` action on the `core/modules` store. See [#1623](https://github.com/google/site-kit-wp/issues/1623).

**Enhanced**

* Unregister the site from the authentication service when the plugin is deleted. See [#2311](https://github.com/google/site-kit-wp/issues/2311).
* Add selectors `canSubmitChanges` and `isDoingSubmitChanges` and action `submitChanges` to `core/modules` datastore. See [#2182](https://github.com/google/site-kit-wp/issues/2182).
* Add selectors `getModuleDependencyNames` and `getModuleDependantNames` to `core/modules` store. See [#2180](https://github.com/google/site-kit-wp/issues/2180).
* Allow registering a `setupComponent` when calling the `registerModule` action on the `core/modules` store. See [#2074](https://github.com/google/site-kit-wp/issues/2074).
* Implement UI for new splash screen based on authentication service improvements. See [#2046](https://github.com/google/site-kit-wp/issues/2046).
* Detect and store whether each user has already answered the user input questions to customize the plugin behavior. See [#2042](https://github.com/google/site-kit-wp/issues/2042).
* Implement UI components to use in `googlesitekit-user-input` screen. See [#2039](https://github.com/google/site-kit-wp/issues/2039).
* Add Analytics tracking events for API request errors. See [#1999](https://github.com/google/site-kit-wp/issues/1999).

**Fixed**

* Fix bug where errors would be inconsistently keyed and not cleared as expected in certain cases. See [#2210](https://github.com/google/site-kit-wp/issues/2210).
* Fix Search Console deep links to point to correct locations in case of a domain property as well. See [#2110](https://github.com/google/site-kit-wp/issues/2110).
* Fix accessibility issue with links opening in a new tab by annotating them with screen reader text informing about it. See [#2093](https://github.com/google/site-kit-wp/issues/2093).
* Fix several UI loading state issues across module setup flows. See [#1995](https://github.com/google/site-kit-wp/issues/1995).
* Display text field to specify name when creating a new Tag Manager container, and prevent duplicate names which could have resulted in an error before. See [#1817](https://github.com/google/site-kit-wp/issues/1817).
* Remove usage of JavaScript chunk files to fix potential issues with certain server configurations. See [#1391](https://github.com/google/site-kit-wp/issues/1391).

= 1.19.0 =

**Added**

* Introduce `getUserInputSettings` selector and `setUserInputSettings` and `saveUserInputSettings` actions on `core/user` store. See [#2037](https://github.com/google/site-kit-wp/issues/2037).
* Introduce `core/user/data/user-input-settings` REST datapoint. See [#2036](https://github.com/google/site-kit-wp/issues/2036).

**Enhanced**

* Display notice about new Analytics and link to relevant support resource. See [#2219](https://github.com/google/site-kit-wp/issues/2219).
* Make `canSubmitChanges` selectors throughout different module datastores more testable and consistent. See [#2108](https://github.com/google/site-kit-wp/issues/2108).
* Enhance new widget API so that only widget areas that have active widgets are rendered. See [#2021](https://github.com/google/site-kit-wp/issues/2021).
* Provide accurate deep links for all Search Console and Analytics widgets, pointing to the corresponding location in the Google service frontend. See [#1923](https://github.com/google/site-kit-wp/issues/1923).
* Use direct SVG imports instead of an SVG sprite which can cause accessibility and testing issues. See [#1878](https://github.com/google/site-kit-wp/issues/1878).
* Make AdSense module page UI more consistent with other modules, allowing to filter information by date instead of showing at-a-glance information for different date periods. See [#317](https://github.com/google/site-kit-wp/issues/317).

**Fixed**

* Fix bug where some data stores would be registered multiple times in JS. See [#2145](https://github.com/google/site-kit-wp/issues/2145).
* Fix issue where admin bar would not show for URLs with unicode paths. Props kabirbd89. See [#1968](https://github.com/google/site-kit-wp/issues/1968).
* Improve error handling during module setup and editing module settings so that any API errors are displayed. See [#1859](https://github.com/google/site-kit-wp/issues/1859).
* Fix menu positioning bug that would move menu item for WP Engine and Bluehost hosting providers. See [#1541](https://github.com/google/site-kit-wp/issues/1541).

= 1.18.0 =

**Added**

* Introduce several filters to allow blocking rendering or execution of Google service scripts in the frontend, allowing integration with e.g. 3P cookie consent plugins. See [#2087](https://github.com/google/site-kit-wp/issues/2087).
* Introduce API layer for advanced Analytics event tracking configurations from other plugins. See [#1728](https://github.com/google/site-kit-wp/issues/1728).

**Enhanced**

* Introduce `googlesitekit_canonical_home_url` filter, allowing (e.g. multilingual) plugins that contextually alter the home URL to fix potential issues with Site Kit. See [#2131](https://github.com/google/site-kit-wp/issues/2131).
* Remove unused properties in module PHP classes. See [#2050](https://github.com/google/site-kit-wp/issues/2050).
* Scaffold new `googlesitekit-user-input` screen. See [#2038](https://github.com/google/site-kit-wp/issues/2038).
* Expand `Widget` component to correctly align vertically and support optional header and footer component props. See [#2022](https://github.com/google/site-kit-wp/issues/2022).
* Improve authentication service permissions link to check Site Kit permissions first while not exposing the actual URL on the client. See [#1985](https://github.com/google/site-kit-wp/issues/1985).
* Introduce `User_Transients` PHP class for storing user-specific transients. See [#1964](https://github.com/google/site-kit-wp/issues/1964).
* Introduce `getDateRangeDates()` selector to `core/user` datastore to retrieve actual date strings based on the current date range. See [#1925](https://github.com/google/site-kit-wp/issues/1925).
* Display error notification when refreshing an access token failed due to missing Site Kit authentication service requirements. See [#1848](https://github.com/google/site-kit-wp/issues/1848).
* Update the Reset Site Kit dialog message to be more clear. See [#1825](https://github.com/google/site-kit-wp/issues/1825).
* Provide guidance in Analytics setup flow when Tag Manager is already active and its container is configured to use Analytics. See [#1382](https://github.com/google/site-kit-wp/issues/1382).
* Provide guidance in Tag Manager setup flow when container is configured to use Analytics, including checks to ensure an eventual AMP container behaves correctly as well. See [#1381](https://github.com/google/site-kit-wp/issues/1381).
* Remove Analytics module as requirement for Tag Manager module, decoupling them to be individual. See [#1380](https://github.com/google/site-kit-wp/issues/1380).

**Fixed**

* Fix new AdSense Top Earning Pages widget displaying error instead of CTA to link AdSense and Analytics. See [#2098](https://github.com/google/site-kit-wp/issues/2098).
* Fix inconsistent loading state in Search Console Popular Keywords widget, which previously caused content shifting. See [#2013](https://github.com/google/site-kit-wp/issues/2013).
* Show an error message if the URL for the single URL detail view cannot be identified as part of the site. See [#2001](https://github.com/google/site-kit-wp/issues/2001).
* Improve support for URLs containing unicode, mixed case, and bidirectional control characters when requesting and sending data to Search Console. See [#1567](https://github.com/google/site-kit-wp/issues/1567).

= 1.17.0 =

**Enhanced**

* Simplify module registration in JavaScript and only allow one registration call per module. See [#2024](https://github.com/google/site-kit-wp/issues/2024).
* Improve accuracy of AdSense account status detection based on specific errors. See [#1919](https://github.com/google/site-kit-wp/issues/1919).
* Migrate AdSense Top Earning Pages widget to new Widget API. See [#1902](https://github.com/google/site-kit-wp/issues/1902).
* Migrate AdSense Summary widget to new Widget API. See [#1901](https://github.com/google/site-kit-wp/issues/1901).
* Migrate Analytics Popular Pages widget to new Widget API. See [#1900](https://github.com/google/site-kit-wp/issues/1900).
* Migrate Search Console Top Keywords widget to new Widget API. See [#1899](https://github.com/google/site-kit-wp/issues/1899).
* Migrate Analytics Unique Visitors, Bounce Rate, and Goals widgets to new Widget API. See [#1898](https://github.com/google/site-kit-wp/issues/1898).
* Store the site URL that is connected to the Site Kit authentication service and prompt users to reconnect if the site URL has changed, allowing to update the registered configuration and fix future connection issues. See [#1857](https://github.com/google/site-kit-wp/issues/1857).
* Show a button to refresh PageSpeed Insights report data in the widget. Props amirsadeghian. See [#87](https://github.com/google/site-kit-wp/issues/87).

**Fixed**

* Fix initial datastore state being registered incorrectly to ensure consistent initial state. See [#2083](https://github.com/google/site-kit-wp/issues/2083).
* Improve performance of datastores by avoiding unnecessary datastore updates. See [#2052](https://github.com/google/site-kit-wp/issues/2052).
* Fix various translation strings to no longer violate localization best practices. See [#2049](https://github.com/google/site-kit-wp/issues/2049).
* Fix console error when unfocusing and refocusing tab in AdSense setup flow. See [#2033](https://github.com/google/site-kit-wp/issues/2033).
* Fix Search Console deep links for specific keywords in keywords widget to point to the correct location. See [#2019](https://github.com/google/site-kit-wp/issues/2019).
* Fix tooltips for Bounce Rate and Session Duration in Analytics graph to format values correctly. See [#2008](https://github.com/google/site-kit-wp/issues/2008).
* Provide site URL as fallback default value when creating a new Analytics account if site title is empty. See [#1960](https://github.com/google/site-kit-wp/issues/1960).
* Avoid unnecessarily excessive requests to constantly check whether the active Analytics property and AdSense client are connected. See [#1858](https://github.com/google/site-kit-wp/issues/1858).
* Only select Analytics default view for the active property automatically if it still exists. See [#1691](https://github.com/google/site-kit-wp/issues/1691).

= 1.16.0 =

**Enhanced**

* Modify title links in Popular Pages table in Site Kit dashboard and WordPress dashboard widget to point to the details view for the relevant URL. See [#1922](https://github.com/google/site-kit-wp/issues/1922).
* Migrate Search Console Impressions and Clicks widgets to new Widget API. See [#1897](https://github.com/google/site-kit-wp/issues/1897).
* Migrate Analytics All Traffic widget to new Widget API. See [#1896](https://github.com/google/site-kit-wp/issues/1896).
* For API errors about missing Google service permissions, clarify based on module ownership who to contact for more information. See [#1824](https://github.com/google/site-kit-wp/issues/1824).
* Introduce concept of ownership for modules based on who set them up. See [#1743](https://github.com/google/site-kit-wp/issues/1743).

**Fixed**

* Improve entity detection so that single URL details view only works for URLs which do not result in a 404 per WordPress behavior. See [#1980](https://github.com/google/site-kit-wp/issues/1980).
* Fix bug with URL-based entity detection where home page stats in Site Kit URL details view would not show up as expected. See [#1978](https://github.com/google/site-kit-wp/issues/1978).
* Fix support for WordPress configurations using an HTTP proxy with or without authentication required. See [#1976](https://github.com/google/site-kit-wp/issues/1976).
* Provide `permission_callback` to `core/search/data/post-search` datapoint and rely on higher-level `register_rest_route` function from WordPress core. See [#1924](https://github.com/google/site-kit-wp/issues/1924).
* Fix console warning about event tracking timeout being unnecessarily raised. See [#1886](https://github.com/google/site-kit-wp/issues/1886).
* Fix Analytics reporting graph tooltip to match Analytics frontend UI and expose the same information. See [#1836](https://github.com/google/site-kit-wp/issues/1836).
* Update post search input to use a better maintained and more accessible autocomplete library. See [#1761](https://github.com/google/site-kit-wp/issues/1761).

= 1.15.0 =

**Enhanced**

* Introduce more granular error handling, with consistent error behavior in every store and API request errors being automatically stored. See [#1814](https://github.com/google/site-kit-wp/issues/1814).
* Enhance `getReport( options )` selector in `modules/adsense` store to allow for flexibly querying AdSense reports. See [#1776](https://github.com/google/site-kit-wp/issues/1776).
* Add `getReport( options )` selector to `modules/search-console` store for querying Search Console reports. See [#1774](https://github.com/google/site-kit-wp/issues/1774).
* Add copy-to-clipboard functionality and link to WordPress support forums to generic JavaScript error handler. See [#1184](https://github.com/google/site-kit-wp/issues/1184).
* Enable Site Kit admin bar menu and URL details view for any WordPress content beyond single posts, for example category, tag, author, or post type archives. See [#174](https://github.com/google/site-kit-wp/issues/174).

**Fixed**

* Fix opting out of Analytics for logged in users not working correctly for Web Stories. See [#1920](https://github.com/google/site-kit-wp/issues/1920).
* Ensure Search Console data in Site Kit only includes data for the current site even when using a domain property. See [#1917](https://github.com/google/site-kit-wp/issues/1917).
* Fix internal error handling so that invalid usages of API-based selectors result in errors being thrown as expected. See [#1801](https://github.com/google/site-kit-wp/issues/1801).
* Use hashes for all JavaScript asset file names to avoid stale versions from being served on hosts with aggressive caching. See [#1700](https://github.com/google/site-kit-wp/issues/1700).

= 1.14.0 =

**Enhanced**

* Add new action hooks `googlesitekit_analytics_init_tag`, `googlesitekit_analytics_init_tag_amp`, `googlesitekit_adsense_init_tag`, `googlesitekit_adsense_init_tag_amp`, `googlesitekit_tagmanager_init_tag`, `googlesitekit_tagmanager_init_tag_amp` which fire when the respective tag will be printed for the current request, but _before_ any HTML output has been generated. See [#1862](https://github.com/google/site-kit-wp/issues/1862).
* Clarify messaging on initial setup screen for secondary users who need to connect to Site Kit. Props sonjaleix. See [#1714](https://github.com/google/site-kit-wp/issues/1714).
* Detect potential problems with issuing API requests to Google services and AMP prior to setup and inform the user about it. See [#1549](https://github.com/google/site-kit-wp/issues/1549).

**Fixed**

* Migrate away from using `AMP_Theme_Support::get_support_mode()` which will be deprecated in the AMP plugin version 2.0.0. Props maciejmackowiak. See [#1895](https://github.com/google/site-kit-wp/issues/1895).
* Fix bug where certain React code being imported in third-party code could cause JavaScript errors. See [#1888](https://github.com/google/site-kit-wp/issues/1888).
* Link to the Manage sites screen including an `hl` query parameter for a localized experience. See [#1860](https://github.com/google/site-kit-wp/issues/1860).
* Fix bug where the displayed Analytics user count percentage change was slightly off from Analytics service frontend. See [#1681](https://github.com/google/site-kit-wp/issues/1681).
* Fix bug where deep links to the AdSense service frontend could result in blank screens there for users with a single Google account logged in. See [#1652](https://github.com/google/site-kit-wp/issues/1652).
* Consistently enhance deep links to Google services to support users logged into multiple Google accounts in their browser. See [#1456](https://github.com/google/site-kit-wp/issues/1456).
* Fix inconsistency where Analytics numbers displayed for the last 90 days were slightly off from the values in the Analytics frontend. See [#1280](https://github.com/google/site-kit-wp/issues/1280).
* Fix bug where another plugin (e.g. WP User Frontend) could mess up the post detection process within the Site Kit dashboard. See [#1253](https://github.com/google/site-kit-wp/issues/1253).
* Fix bug where state of not having sufficient data for a Site Kit widget would sometimes incorrectly persist when switching the date range. See [#184](https://github.com/google/site-kit-wp/issues/184).

= 1.13.1 =

**Fixed**

* Fix regression where Analytics top content wouldn't be sorted correctly by views. Props gmmedia. See [#1867](https://github.com/google/site-kit-wp/issues/1867).

= 1.13.0 =

**Added**

* Introduce `registerModule` action to `core/modules` store, which allows for JS module registration and will in the future enable registration of module components. See [#1622](https://github.com/google/site-kit-wp/issues/1622).

**Enhanced**

* Add `getReport( options )` selector to `modules/analytics` store for querying Analytics reports. See [#1775](https://github.com/google/site-kit-wp/issues/1775).
* Pass `hl` query parameter to Site Kit service for setup and authentication, for a localized experience. See [#1726](https://github.com/google/site-kit-wp/issues/1726).
* Modify `getURLChannels` selector in `modules/adsense` store to require both `accountID` and `clientID` parameters, and no longer rely on infering AdSense account ID from client ID in general. See [#1709](https://github.com/google/site-kit-wp/issues/1709).
* Implement logic and styling for managing widget areas and widgets in a dynamic grid, respective registered widget widths and aligning them properly. See [#1678](https://github.com/google/site-kit-wp/issues/1678).
* Migrate the existing date range selector component to rely on the centrally managed date range from datastore. See [#1531](https://github.com/google/site-kit-wp/issues/1531).
* Simplify detection of existing tags and combine functionality in the JS store. See [#1328](https://github.com/google/site-kit-wp/issues/1328).
* Migrate PageSpeed Insights widget to use the new Site Kit widgets API. See [#1302](https://github.com/google/site-kit-wp/issues/1302).

**Fixed**

* No longer cache API response errors within batch requests. See [#1800](https://github.com/google/site-kit-wp/issues/1800).
* Fix publisher win notifications regression where they would not be displayed anymore. See [#1781](https://github.com/google/site-kit-wp/issues/1781).
* Fix new JS API layer to prefer `sessionStorage` over `localStorage` for caching. See [#1780](https://github.com/google/site-kit-wp/issues/1780).
* Improve Google profile data lookup to retry periodically if it temporarily fails. See [#1731](https://github.com/google/site-kit-wp/issues/1731).
* Display correct labels for Analytics top acquisition channels by relying on `ga:channelGrouping` dimension. See [#1719](https://github.com/google/site-kit-wp/issues/1719).
* Handle error conditions more gracefully when refreshing access token fails due to e.g. the user having revoked access previously, providing the user with a link to resolve the problem. See [#1646](https://github.com/google/site-kit-wp/issues/1646).
* Fix usage of `apiFetch` with a custom middleware to only rely on preloaded data for initial requests on pageload. See [#1611](https://github.com/google/site-kit-wp/issues/1611).
* Fix notification bubble on Site Kit menu so that it only displays if there are actual notifications available. See [#1540](https://github.com/google/site-kit-wp/issues/1540).
* Fix PHP warning that could occur when retrieving REST API information via help endpoint. Props majemedia. See [#1208](https://github.com/google/site-kit-wp/issues/1208).

= 1.12.0 =

**Added**

* Add `getDateRange()` selector and `setDateRange( slug )` action to the `core/user` store. See [#1529](https://github.com/google/site-kit-wp/issues/1529).

**Enhanced**

* Introduce new `wrapWidget` setting to `core/widgets` store's `registerWidget` selector which adds the wrapping `Widget` component by default. See [#1724](https://github.com/google/site-kit-wp/issues/1724).
* Deprecate `Module::get_datapoint_services()` PHP method in favor of `Module::get_datapoint_definitions()` for more flexibility in annotating API datapoints. See [#1609](https://github.com/google/site-kit-wp/issues/1609).
* Only require the `https://www.googleapis.com/auth/tagmanager.readonly` scope by default for Tag Manager, and request write scopes only as needed for a specific action. See [#1608](https://github.com/google/site-kit-wp/issues/1608).
* Redirect users to the setup screen when trying to access the Site Kit dashboard with insufficient permissions. See [#1526](https://github.com/google/site-kit-wp/issues/1526).
* Implement widget areas using new Site Kit widgets API. See [#1392](https://github.com/google/site-kit-wp/issues/1392).
* Significantly improve stability and maintainability of Tag Manager module setup and settings. See [#1386](https://github.com/google/site-kit-wp/issues/1386).
* Update the majority of 3P dependencies to their latest versions. See [#1356](https://github.com/google/site-kit-wp/issues/1356).

**Fixed**

* Require `accountID` to be passed to `getProfiles` selector in `modules/analytics` store, in order to supported moved Analytics properties. See [#1707](https://github.com/google/site-kit-wp/issues/1707).
* Fix bug where placing an invalid Analytics tag through another plugin could cause the Site Kit Analytics setup UI to break. See [#1651](https://github.com/google/site-kit-wp/issues/1651).
* Fix bug where users with full Analytics access would see error message about lack of permissions, due to the property having been moved. See [#1548](https://github.com/google/site-kit-wp/issues/1548).

= 1.11.1 =

**Fixed**

* Fix bug where users attempting to create a new Analytics view during module setup would be blocked from proceeding. See [#1754](https://github.com/google/site-kit-wp/issues/1754).

= 1.11.0 =

**Added**

* Introduce base components for upcoming Site Kit Widgets API. See [#1300](https://github.com/google/site-kit-wp/issues/1300).

**Enhanced**

* Rename `wp google-site-kit auth revoke` to `wp google-site-kit auth disconnect` and adjust internal CLI commands infrastructure. See [#1677](https://github.com/google/site-kit-wp/issues/1677).
* Significantly improve stability and maintainability of Optimize module setup and settings, and fix bug where editing Optimize settings with AMP active could cause an error due to the `ampExperimentJSON` module setting not being stored as JSON string. See [#1621](https://github.com/google/site-kit-wp/issues/1621).
* Add `hasScope( scope )` selector to `core/user` store, which allows checking whether the user has explicitly granted access to the respective scope. See [#1610](https://github.com/google/site-kit-wp/issues/1610).
* Introduce `modules/tagmanager` datastore to enable JS-based access to Tag Manager data. See [#1385](https://github.com/google/site-kit-wp/issues/1385).
* Allow specifying Analytics view name when creating a new one, and display a deep link to modify view settings in Analytics module settings. See [#716](https://github.com/google/site-kit-wp/issues/716).

**Fixed**

* Fix admin tracking regression where snippet would not be loaded on the page. See [#1717](https://github.com/google/site-kit-wp/issues/1717).
* Ensure ad blocker detection is active throughout the entire AdSense module setup. See [#1666](https://github.com/google/site-kit-wp/issues/1666).
* Fix redirect to Google Analytics terms of service occasionally failing due to unnecessary extra redirect. See [#1632](https://github.com/google/site-kit-wp/issues/1632).
* Fix bug `Cannot read property 'destroy' of undefined` from AMP experiment JSON field in Optimize module. See [#1605](https://github.com/google/site-kit-wp/issues/1605).

= 1.10.0 =

[Learn more about the new feature in this release](https://sitekit.withgoogle.com/news/understand-how-visitors-experience-your-pages-core-web-vitals-now-available-in-site-kit/)

**Added**

* Implement new version of PageSpeed Insights widget that focuses on core web vitals. See [#1636](https://github.com/google/site-kit-wp/issues/1636).
* Introduce `modules/optimize` JS datastore for Optimize module. See [#1620](https://github.com/google/site-kit-wp/issues/1620).

**Enhanced**

* Detect current URL and related data when on the Site Kit screen for single URL details. See [#1653](https://github.com/google/site-kit-wp/issues/1653).
* Implement tabbed UI for new web vitals widget separating between mobile and desktop as well as lab and field data. See [#1649](https://github.com/google/site-kit-wp/issues/1649).
* Only load Site Kit-specific Analytics script on Site Kit admin screens. See [#1648](https://github.com/google/site-kit-wp/issues/1648).
* Pass `user_roles` query parameter during setup. See [#1639](https://github.com/google/site-kit-wp/issues/1639).
* Simplify module datastore creation by including `commonStore` in the store returned `googlesitekit.modules.createModuleStore`. See [#1607](https://github.com/google/site-kit-wp/issues/1607).
* Add selectors to get module-specific admin screen URLs to every module datastore. See [#1559](https://github.com/google/site-kit-wp/issues/1559).
* Fix accessibility issues in Site Kit settings due to semantically incorrect tag usage. See [#1557](https://github.com/google/site-kit-wp/issues/1557).
* Add `getReport` selector to `modules/pagespeed-insights` datastore to get UX reports. See [#1426](https://github.com/google/site-kit-wp/issues/1426).
* Implement meta programming approach for API-based datastore selectors and actions to reduce boilerplate. See [#1288](https://github.com/google/site-kit-wp/issues/1288).
* Include anchor link in success notification after setting up PageSpeed Insights module. See [#532](https://github.com/google/site-kit-wp/issues/532).

**Fixed**

* Reduce bundle size of Analytics and Optimize module JS assets. See [#1661](https://github.com/google/site-kit-wp/issues/1661).
* Do not run Site Kit assets logic when not applicable for the current user, avoiding unnecessary checks e.g. on the login screen. See [#1650](https://github.com/google/site-kit-wp/issues/1650).
* Fix incompatibility with WooCommerce due to Webpack conflict. See [#1637](https://github.com/google/site-kit-wp/issues/1637).
* Fix bug with event firing when activating or deactivating a module. See [#1629](https://github.com/google/site-kit-wp/issues/1629).
* Enhance functionality of new `core/modules` store so that module activation/deactivation results in authentication data to be refreshed. See [#1507](https://github.com/google/site-kit-wp/issues/1507).
* Fix ad blocker detection failing for popular AdBlock browser extension. See [#1491](https://github.com/google/site-kit-wp/issues/1491).
* Ensure dashboard search form can only be submitted with valid content. See [#1434](https://github.com/google/site-kit-wp/issues/1434).
* Fix Analytics data displayed for Users being partially incorrect due to incorrect date parsing. See [#1394](https://github.com/google/site-kit-wp/issues/1394).
* Fix table content overflow issues in narrow viewports. Props AlexandreOrlowski. See [#1376](https://github.com/google/site-kit-wp/issues/1376).

= 1.9.0 =

**Added**

* Introduce `modules/pagespeed-insights` datastore in JS. See [#1500](https://github.com/google/site-kit-wp/issues/1500).
* Introduce `modules/search-console` datastore in JS. See [#1498](https://github.com/google/site-kit-wp/issues/1498).
* Implement Site Kit widgets API datastore wrapper on `googlesitekit.widgets`. See [#1301](https://github.com/google/site-kit-wp/issues/1301).
* Introduce `core/widgets` datastore for Site Kit widget registrations. See [#1298](https://github.com/google/site-kit-wp/issues/1298).
* Integrate with the Analytics Provisioning API to enable creation of Analytics accounts directly from the plugin. See [#1271](https://github.com/google/site-kit-wp/issues/1271).
* Introduce `modules/adsense` JavaScript datastore with core functionality for the AdSense module. See [#1247](https://github.com/google/site-kit-wp/issues/1247).
* Add `create-account-ticket` datapoint for `Analytics` module that creates a new Analytics account ticket using the Provisioning API. See [#1212](https://github.com/google/site-kit-wp/issues/1212).
* Add notifications functionality to `core/user` store. See [#1177](https://github.com/google/site-kit-wp/issues/1177).
* Introduce `core/user` datastore for managing user-specific data in JS. See [#1175](https://github.com/google/site-kit-wp/issues/1175).

**Enhanced**

* Only request readonly OAuth scopes for each module by default, and prompt for additional scopes when needed for a specific action. See [#1566](https://github.com/google/site-kit-wp/issues/1566).
* Wrap all JavaScript apps into `Root` component with essential providers, error handlers etc. See [#1530](https://github.com/google/site-kit-wp/issues/1530).
* Introduce `core/forms` datastore to manage form state. See [#1510](https://github.com/google/site-kit-wp/issues/1510).
* Render `amp-analytics` snippet for Web Stories. See [#1506](https://github.com/google/site-kit-wp/issues/1506).
* Migrate PageSpeed Insights settings to using the datastore. See [#1501](https://github.com/google/site-kit-wp/issues/1501).
* Display actual Search Console property used in settings, and migrate to using the datastore. See [#1499](https://github.com/google/site-kit-wp/issues/1499).
* Rename Analytics profiles to views consistently. See [#1486](https://github.com/google/site-kit-wp/issues/1486).
* Improve AdSense account status and site status detection logic to be more error-proof. See [#1332](https://github.com/google/site-kit-wp/issues/1332).
* Add user profile information and verification state to `core/user` datastore. See [#1176](https://github.com/google/site-kit-wp/issues/1176).
* Significantly improve stability and maintainability of AdSense module setup and settings. See [#1014](https://github.com/google/site-kit-wp/issues/1014).
* Clarify message for when user needs to reauthenticate to grant required scopes. See [#189](https://github.com/google/site-kit-wp/issues/189).

**Fixed**

* Ensure all module caches are cleared when modifying Analytics settings. See [#1593](https://github.com/google/site-kit-wp/issues/1593).
* Fix bugs where CTAs to link Analytics to AdSense would never show. See [#1545](https://github.com/google/site-kit-wp/issues/1545).
* Fix AdSense report URL to not include user-specific affix. See [#1516](https://github.com/google/site-kit-wp/issues/1516).
* Fix Search Console deep links to use the correct property identifier. See [#1497](https://github.com/google/site-kit-wp/issues/1497).
* Fix bug where having a graylisted AdSense account would prevent the AdSense code from being placed. See [#1494](https://github.com/google/site-kit-wp/issues/1494).

= 1.8.1 =

**This release includes security fixes. An update is strongly recommended.**

**Enhanced**

* Check for users that verified through Site Kit without being authorized to do so, and disconnect them from Site Kit. See [#1573](https://github.com/google/site-kit-wp/issues/1573).
* Provide `application_name` query parameter to authentication service. See [#1571](https://github.com/google/site-kit-wp/issues/1571).

= 1.8.0 =

**This release includes security fixes. An update is strongly recommended.**

**Added**

* Introduce standalone UI mode for plugin admin screens. Props EvanHerman. See [#1281](https://github.com/google/site-kit-wp/issues/1281).
* Introduce `modules/analytics` datastore for managing Analytics state in JS. See [#1224](https://github.com/google/site-kit-wp/issues/1224).
* Introduce `core/modules` datastore for managing module information and activation state. See [#1179](https://github.com/google/site-kit-wp/issues/1179).

**Enhanced**

* Preload REST API datapoints for `core/site` and `core/user` datastores to avoid firing these extra requests. See [#1478](https://github.com/google/site-kit-wp/issues/1478).
* Add support for new Optimize container IDs starting in `OPT-`. See [#1471](https://github.com/google/site-kit-wp/issues/1471).
* Improve alignment of dialog buttons. See [#1436](https://github.com/google/site-kit-wp/issues/1436).
* Rely on the default profile specified in an Analytics property for the profile to pre-select in the dropdown in Analytics setup/settings. See [#1404](https://github.com/google/site-kit-wp/issues/1404).
* Remove periods from single sentences in settings panel lists. See [#1401](https://github.com/google/site-kit-wp/issues/1401).
* Add `googlesitekit.data.combineStores` utility function to combine multiple datastore objects. See [#1400](https://github.com/google/site-kit-wp/issues/1400).
* Significantly improve stability and maintainability of Analytics module setup and settings. See [#1101](https://github.com/google/site-kit-wp/issues/1101).
* Update Analytics control for whether to place snippet to use a toggle instead of radio buttons for consistency. See [#1048](https://github.com/google/site-kit-wp/issues/1048).

**Fixed**

* Fix bug where Analytics would never request AdSense metrics even with a successful AdSense connection. See [#1524](https://github.com/google/site-kit-wp/issues/1524).
* Fix bug where `amp-auto-ads` snippet would not always be printed if the theme didn't support the `wp_body_open` action. See [#1495](https://github.com/google/site-kit-wp/issues/1495).
* Do not request remote notifications if the site is not connected to the remote. See [#1479](https://github.com/google/site-kit-wp/issues/1479).
* Update registered site name on authentication service when it is updated in WordPress. See [#1397](https://github.com/google/site-kit-wp/issues/1397).
* Display only paths instead of full URLs in Analytics tables for better visibility and consistency with Analytics frontend. See [#1116](https://github.com/google/site-kit-wp/issues/1116).
* Add missing translator comments to ease plugin localization for contributors. See [#820](https://github.com/google/site-kit-wp/issues/820).

= 1.7.1 =

**Added**

* Add notifications functionality to `core/site` datastore. See [#1174](https://github.com/google/site-kit-wp/issues/1174).

**Enhanced**

* Add `rollbackSettings` action to settings datastores and refine overall datastore infrastructure. See [#1375](https://github.com/google/site-kit-wp/issues/1375).
* Expand AdSense settings panel to expose more helpful information. See [#585](https://github.com/google/site-kit-wp/issues/585).

**Fixed**

* Fix bug where similar batch request to the API could occur multiple times. See [#1406](https://github.com/google/site-kit-wp/issues/1406).
* Fix bug where single post stats would display the unique visitors from Search for the overall site instead of only that post. Props phamquangbaoplus. See [#1371](https://github.com/google/site-kit-wp/issues/1371).
* Fix Analytics incorrectly triggering re-authentication notice when the user does not have any accounts. See [#1368](https://github.com/google/site-kit-wp/issues/1368).
* Fix JS datastore actions to never have an associated control and reducer at the same time. See [#1361](https://github.com/google/site-kit-wp/issues/1361).
* Place Tag Manager snippet for non-JavaScript support after opening `body` tag as commonly expected. Props ShahAaron. See [#1308](https://github.com/google/site-kit-wp/issues/1308).
* Fix layout issue in Tag Manager settings panel when no container is selected. See [#1296](https://github.com/google/site-kit-wp/issues/1296).
* Fix issue related to added `_gl` query parameter from AMP linker. Props ShahAaron. See [#1275](https://github.com/google/site-kit-wp/issues/1275).

= 1.7.0 =

**Enhanced**

* Allow modules to register and enqueue their own assets by implementing a `Module_With_Assets` interface. See [#1319](https://github.com/google/site-kit-wp/issues/1319).
* Decouple datastores from global registry by using `createRegistryControl` and `createRegistrySelector`. See [#1287](https://github.com/google/site-kit-wp/issues/1287).
* Update datastore resolvers to only issue API requests when lacking data. See [#1286](https://github.com/google/site-kit-wp/issues/1286).
* Add preloading middleware for REST API data and preload module settings routes on pageload. See [#1246](https://github.com/google/site-kit-wp/issues/1246).
* Add more granular selectors to the `core/site` datastore. See [#1173](https://github.com/google/site-kit-wp/issues/1173).
* Add several additional selectors for commonly used site data to the `core/site` datastore. See [#1000](https://github.com/google/site-kit-wp/issues/1000).

**Fixed**

* Fix bug where plugins modifying the site address during frontend requests would prevent the setup flow from being completed. See [#1357](https://github.com/google/site-kit-wp/issues/1357).
* Fix bug where `googlesitekit.api.set` would not pass through request data correctly to the API endpoints. See [#1346](https://github.com/google/site-kit-wp/issues/1346).
* Fix bug where using a WordPress locale with a third segment (e.g. formal variant) would cause JavaScript errors on some screens. See [#1309](https://github.com/google/site-kit-wp/issues/1309).
* Do not revoke token remotely when token is deleted, unless explicitly requested via disconnect. See [#1305](https://github.com/google/site-kit-wp/issues/1305).
* Fix unicode domains being displayed in punycode version in disconnect feedback message. See [#1297](https://github.com/google/site-kit-wp/issues/1297).
* Fix bug where certain numbers were rounded differently from how the respective Google service rounds them. See [#1279](https://github.com/google/site-kit-wp/issues/1279).
* Optimize JavaScript dependency loading, decreasing the chance of conflicts and reducing the plugin size. See [#1222](https://github.com/google/site-kit-wp/issues/1222).
* Ensure the total user count in the Analytics module matches the numbers displayed in the Google Analytics frontend. See [#1202](https://github.com/google/site-kit-wp/issues/1202).

= 1.6.0 =

**Added**

* Add support for reading and editing settings to datastores created via `googlesitekit.modules.createModuleStore`. See [#1249](https://github.com/google/site-kit-wp/issues/1249).
* Introduce `googlesitekit-modules` asset with `createModuleStore` function to create a base datastore for a Site Kit module. See [#1063](https://github.com/google/site-kit-wp/issues/1063).

**Enhanced**

* Ensure module settings are consistently passed from PHP to JavaScript, and fix some minor logic issues in the consuming JavaScript code. See [#1245](https://github.com/google/site-kit-wp/issues/1245).
* Automatically include a REST route to read and edit settings for every module that supports them. See [#1244](https://github.com/google/site-kit-wp/issues/1244).

**Fixed**

* Fix issue where users would get stuck on setup screen after seemingly successful completion of the setup flow on the authentication service. See [#1266](https://github.com/google/site-kit-wp/issues/1266).
* Provide clear error message informing the user when they did not grant the necessary permissions, instead of a generic `access_denied` error code. See [#1192](https://github.com/google/site-kit-wp/issues/1192).
* Fix JavaScript errors in AdSense screens that was a result of `Intl.NumberFormat.formatToParts` not being supported in Safari. See [#1107](https://github.com/google/site-kit-wp/issues/1107).
* Fix JavaScript error `e.replace is not a function` in AdSense screens related to formatting numbers. See [#1092](https://github.com/google/site-kit-wp/issues/1092).
* Fix problems around comparing domains with unicode characters that could result in blocking the plugin setup. See [#794](https://github.com/google/site-kit-wp/issues/794).

= 1.5.1 =

**Fixed**

* Ensure tracking opt-out mechanism works consistently between both Analytics and Tag Manager in AMP, and fix regression with Site Kit admin bar menu no longer expanding on AMP pages. See [#1251](https://github.com/google/site-kit-wp/issues/1251).

= 1.5.0 =

**Added**

* Expose `googlesitekit.data` registry and register initial `core/site` store on it. See [#999](https://github.com/google/site-kit-wp/issues/999).
* Add user-facing warnings to Site Kit areas when JavaScript is disabled. Props Shavindra. See [#177](https://github.com/google/site-kit-wp/issues/177).

**Enhanced**

* Standardize several REST API route names for consistency with JavaScript API. See [#1178](https://github.com/google/site-kit-wp/issues/1178).
* Fix various plugin setup issues related to inconsistent URLs by automatically updating registered URIs on the authentication service. See [#1034](https://github.com/google/site-kit-wp/issues/1034).
* Improve asset handling in PHP by introducing dedicated data-only scripts, to use as dependencies. See [#1004](https://github.com/google/site-kit-wp/issues/1004).
* Respect Analytics tracking exclusion of logged-in WordPress users also if Tag Manager is used. See [#944](https://github.com/google/site-kit-wp/issues/944).
* Integrate with WordPress Site Health feature to provide contextual Site Kit information for support and troubleshooting. See [#169](https://github.com/google/site-kit-wp/issues/169).

**Changed**

* Display helpful link in previously empty PageSpeed Insights settings area. See [#1129](https://github.com/google/site-kit-wp/issues/1129).
* Use latest product icon for the Optimize module. See [#969](https://github.com/google/site-kit-wp/issues/969).

**Fixed**

* Ensure date range selectors functionality is decoupled from localizable strings. See [#1183](https://github.com/google/site-kit-wp/issues/1183).
* Fix bugs where some untranslated strings would show despite being translated, caused by too early usage of these strings in JavaScript. See [#1163](https://github.com/google/site-kit-wp/issues/1163).
* Replace outdated AMP client ID mechanism for tracking AMP traffic with recommended AMP linker approach, and enable it by default. See [#1160](https://github.com/google/site-kit-wp/issues/1160).
* Fix compatibility error where `google.charts.load` was not called before `google.charts.setOnLoadCallback`. See [#1155](https://github.com/google/site-kit-wp/issues/1155).
* Do not show empty data table in Analytics module screen when there is no data to display. See [#464](https://github.com/google/site-kit-wp/issues/464).

= 1.4.0 =

**Enhanced**

* Introduce basic notifications system for information displayed in the Site Kit dashboard. See [#1110](https://github.com/google/site-kit-wp/issues/1110).
* Register all of the plugin's user options in WordPress via `register_meta()`. See [#1029](https://github.com/google/site-kit-wp/issues/1029).
* Improve JS error handling consistently across individual React apps and allow for better contextualization. See [#943](https://github.com/google/site-kit-wp/issues/943).
* Display information about lack of data instead of displaying empty top search queries box. Props Shavindra. See [#314](https://github.com/google/site-kit-wp/issues/314).
* Ensure admin bar displays when at least Search Console or Analytics have stats for the current URL. See [#167](https://github.com/google/site-kit-wp/issues/167).

**Fixed**

* Fix minor bug causing potentially incorrect token expiry to be recorded. See [#1158](https://github.com/google/site-kit-wp/issues/1158).
* Fix AMP violations when user is logged in and Site Kit admin bar menu is active. See [#1142](https://github.com/google/site-kit-wp/issues/1142).
* Fix incompatibility issue with Jetpack by resolving bug where the bundled `lodash` was causing a conflict. See [#1141](https://github.com/google/site-kit-wp/issues/1141).
* Fix double-rendered HTML markup on Site Kit dashboard screen. See [#1140](https://github.com/google/site-kit-wp/issues/1140).
* Fix misleading sparkline color for metrics that should use the inverted color, such as bounce rate. See [#1128](https://github.com/google/site-kit-wp/issues/1128).
* Work around [bug in ModSecurity](https://github.com/SpiderLabs/owasp-modsecurity-crs/issues/1451) by relying on only providing granted OAuth scopes in token API response. See [#1113](https://github.com/google/site-kit-wp/issues/1113).
* Make JS and CSS asset names consistent. Props Shavindra. See [#1040](https://github.com/google/site-kit-wp/issues/1040).
* Properly support paired AMP in Tag Manager module by allowing to select two different containers, one for `web` context and the other for `amp` context. Props kmwilkerson. See [#413](https://github.com/google/site-kit-wp/issues/413).
* Fix accessibility issues in dialog component with potentially duplicate IDs and invalid ARIA attributes. See [#345](https://github.com/google/site-kit-wp/issues/345).
* Fix issue where disconnecting a user from a site would disconnect that user from all their sites.

= 1.3.1 =

**Fixed**

* Ensure `opcache_reset()` exists before calling it. See [#1136](https://github.com/google/site-kit-wp/issues/1136).

= 1.3.0 =

**Added**

* Introduce `googlesitekit.data` registry for JS datastores. See [#997](https://github.com/google/site-kit-wp/issues/997).

**Enhanced**

* No longer delete plugin data when uninstalling and instead rely on the more explicit reset functionality. See [#1069](https://github.com/google/site-kit-wp/issues/1069).
* Remove legacy migrations that were only relevant to pre-1.0.0 users. See [#1062](https://github.com/google/site-kit-wp/issues/1062).
* Migrate stray module settings into object-like option for consistency and future scalability. See [#1030](https://github.com/google/site-kit-wp/issues/1030).
* Introduce `core/site/data/connection` REST API route for retrieving site connection info. See [#998](https://github.com/google/site-kit-wp/issues/998).
* Fully rely on Webpack for third-party dependencies and decouple from WordPress-shipped assets for more stability across all versions. See [#993](https://github.com/google/site-kit-wp/issues/993).
* Inform the site owner about potential issues with their site that will likely cause problems when setting up the plugin. See [#933](https://github.com/google/site-kit-wp/issues/933).
* Make opting in to tracking specific per user instead of per site. See [#913](https://github.com/google/site-kit-wp/issues/913).
* Bump minimum required PHP version to 5.6, rely on up-to-date linting tools and fix various PHPCS issues. See [#547](https://github.com/google/site-kit-wp/issues/547).
* Move REST route definitions into more applicable classes that handle the respective functionality. See [#166](https://github.com/google/site-kit-wp/issues/166).

**Fixed**

* Allow users with existing Tag Manager accounts to create additional accounts during module setup. See [#1080](https://github.com/google/site-kit-wp/issues/1080).
* Fix partly outdated PHP files being served due to OpCache issues [currently not addressed by WordPress core](https://core.trac.wordpress.org/ticket/36455). See [#1066](https://github.com/google/site-kit-wp/issues/1066).
* Prevent unexpected PageSpeed Insights API responses from breaking the dashboard. See [#1061](https://github.com/google/site-kit-wp/issues/1061).
* Standardize GA tracking snippets and inconsistent data passed in events by introducing a proper tracking API in JavaScript. See [#1055](https://github.com/google/site-kit-wp/issues/1055).
* Fix several temporary blank screen errors by loading script dependencies more reliably via Webpack. See [#1054](https://github.com/google/site-kit-wp/issues/1054).
* Ensure that the Tag Manager snippet rendered is always compatible with the current context (AMP vs non-AMP). See [#1036](https://github.com/google/site-kit-wp/issues/1036).
* Do not render `amp-auto-ads` element in AMP stories because it is invalid in that context. See [#979](https://github.com/google/site-kit-wp/issues/979).
* Ensure that Google Charts JS library is loaded as expected even when a `window.google` global already exists because of another library. See [#939](https://github.com/google/site-kit-wp/issues/939).
* Do not refetch PageSpeed Insights data when the date range selector is changed, as its data its date-agnostic. See [#890](https://github.com/google/site-kit-wp/issues/890).
* Fix incorrect change arrow direction and color on "inverted" properties like bounce rate. Props WebFactoryLtd. See [#481](https://github.com/google/site-kit-wp/issues/481).
* Add missing support for Search Console domain properties and rely on the correct property when requesting Search Console data. Props IgorCode. See [#325](https://github.com/google/site-kit-wp/issues/325).

= 1.2.0 =

**Added**

* Introduce new `googlesitekit.api` layer for accessing Site Kit datapoints with reliable caching. See [#953](https://github.com/google/site-kit-wp/issues/953).
* Detect already existing Tag Manager snippets from other sources and inform about them in the setup flow. See [#433](https://github.com/google/site-kit-wp/issues/433).

**Enhanced**

* Introduce Site Kit-specific `Google_Client` implementation and use that throughout the codebase. See [#1003](https://github.com/google/site-kit-wp/issues/1003).
* Reduce maintenance by implementing dynamic activation notice in React. See [#991](https://github.com/google/site-kit-wp/issues/991).
* Include platform and plugin version information in API client requests. See [#989](https://github.com/google/site-kit-wp/issues/989).
* Ensure that all module settings are properly registered in WordPress for consistent behavior. See [#859](https://github.com/google/site-kit-wp/issues/859).
* Allow users to rely on `WP_PROXY_*` constants to use an HTTP proxy for requests issued by `Google_Client`. See [#661](https://github.com/google/site-kit-wp/issues/661).
* Allow users that have existing Google Analytics account to create a new account in module setup and settings. See [#198](https://github.com/google/site-kit-wp/issues/198).
* Remove very limited debug bar integration for now. See [#178](https://github.com/google/site-kit-wp/issues/178).

**Fixed**

* Fix bug and potential JavaScript error where user was able to select Analytics property before selecting an account. See [#1039](https://github.com/google/site-kit-wp/issues/1039).
* Optimize initialization of the Google API client and minimize JavaScript assets and inline data being loaded in regular requests. See [#980](https://github.com/google/site-kit-wp/issues/980).
* Fix Search Console average position graph to show the smallest value on top of the Y axis. Props connorhsm. See [#874](https://github.com/google/site-kit-wp/issues/874).
* Display warnings about insufficient scopes across all Site Kit screens instead of only the dashboard, since they are just as relevant during setup. See [#729](https://github.com/google/site-kit-wp/issues/729).
* Ensure that PageSpeed Insights module can be deactivated again once activated. See [#682](https://github.com/google/site-kit-wp/issues/682).

= 1.1.4 =

**Enhanced**

* Improve compatibility with WordPress VIP environment. Props moraleida. See [#901](https://github.com/google/site-kit-wp/issues/901).
* Update wording on setup screen for secondary users to clarify they need to connect their account, but not set up the plugin. See [#881](https://github.com/google/site-kit-wp/issues/881).
* Use OAuth `login_hint` parameter to indicate that the user should use the same Google account across all modules. See [#867](https://github.com/google/site-kit-wp/issues/867).
* Anonymize IP addresses by default in Google Analytics snippet, and grant the user control to modify with a new setting. Props gx10. See [#18](https://github.com/google/site-kit-wp/issues/18).

**Fixed**

* Fix compatibility issues with older versions of the AMP plugin. See [#975](https://github.com/google/site-kit-wp/issues/975).
* Ensure that only options and user options starting with `googlesitekit_` (including underscore) are deleted on reset or disconnect. See [#968](https://github.com/google/site-kit-wp/issues/968).
* Optimize disconnecting users by only running a single database query. See [#960](https://github.com/google/site-kit-wp/issues/960).
* Ensure Site Kit admin bar content is styled independently from the current theme. See [#888](https://github.com/google/site-kit-wp/issues/888).
* Fix bug in Analytics module setup where the user would not be informed about an existing tag before selecting a property. See [#803](https://github.com/google/site-kit-wp/issues/803).
* Fix bug where admin bar stats would not display under certain circumstances when editing a post in the backend. See [#521](https://github.com/google/site-kit-wp/issues/521).
* Display impressions before clicks in admin bar as that is the commonly expected order. See [#297](https://github.com/google/site-kit-wp/issues/297).

= 1.1.3 =

**Fixed**

* Fix critical AdSense issue where users were not able to place the snippet and would end up on a blank screen under certain conditions. See [#891](https://github.com/google/site-kit-wp/issues/891).

= 1.1.2 =

**Enhanced**

* Introduce new mechanism for a site to receive its credentials from the authentication service, replacing the previous mechanism using the REST API that was error-prone on certain environments. See [#905](https://github.com/google/site-kit-wp/issues/905).

**Fixed**

* Remove unnecessary logic to refresh an access token on login, since the Google API client already accounts for that. See [#903](https://github.com/google/site-kit-wp/issues/903).
* Fix too long request URLs for Google API batch requests to use `POST` instead, as the query length was problematic on certain environments. Props sksaju. See [#779](https://github.com/google/site-kit-wp/issues/779).
* Fix bug resulting in blank plugin dashboard screen under certain circumstances. Props ThomasTr. See [#767](https://github.com/google/site-kit-wp/issues/767).
* Ensure that opting in or out of tracking takes effect immediately. See [#727](https://github.com/google/site-kit-wp/issues/727).
* Fix spacing issue in Search Console step for local development setup. See [#637](https://github.com/google/site-kit-wp/issues/637).
* Fix display of the disconnect modal which could potentially appear below the "section locked" indicator in the plugin settings UI. See [#636](https://github.com/google/site-kit-wp/issues/636).

= 1.1.1 =

**Fixed**

* Fix reset and uninstall data removal by optimizing database queries. See [#809](https://github.com/google/site-kit-wp/issues/809).

= 1.1.0 =

**Enhanced**

* Update usage of G icon in admin menu, dashboard widget and screen options to align better with WordPress admin UI. See [#877](https://github.com/google/site-kit-wp/issues/877).
* Add support for site verification via file as primary method while keeping site verification via meta tag as fallback, resolving potential site verification failures. See [#836](https://github.com/google/site-kit-wp/issues/836).
* Move checkbox above submit button in setup screen and banner for better accessibility. See [#788](https://github.com/google/site-kit-wp/issues/788).
* Use more secure nonce generation mechanism for the authentication service. See [#756](https://github.com/google/site-kit-wp/issues/756).
* Show PageSpeed Insights performance stats for every individual URL in its details view, accessible from Site Kit dashboard and admin bar. See [#654](https://github.com/google/site-kit-wp/issues/654).
* Display Tag Manager container names instead of IDs in dropdowns for more user-friendly selection. See [#591](https://github.com/google/site-kit-wp/issues/591).
* Remove redundant notification title for AdSense notifications. Props OisinOConnor. See [#586](https://github.com/google/site-kit-wp/issues/586).
* Always use root domain for AdSense site because subdomains are typically not supported. Props OisinOConnor. See [#578](https://github.com/google/site-kit-wp/issues/578).
* Add support for displaying the full Site Kit admin bar menu with stats also for AMP requests, by leveraging AMP's dev mode feature. See [#438](https://github.com/google/site-kit-wp/issues/438).
* Simplify AdSense account status detection as a base for easier future enhancements and fixes. See [#427](https://github.com/google/site-kit-wp/issues/427).
* Add a checkbox to allow disabling Analytics tracking for logged-in users, and introduce a filter to adjust the behavior programmatically. Props Paras16699. See [#88](https://github.com/google/site-kit-wp/issues/88).

**Fixed**

* Ensure that a newly created Tag Manager container is properly saved so that the module setup is completed. See [#821](https://github.com/google/site-kit-wp/issues/821).
* Improve detection of existing AdSense snippets to cover more variants of snippets. See [#798](https://github.com/google/site-kit-wp/issues/798).
* Only display the Reset button on the setup screen if there actually is something to reset, and provide a feedback notice. See [#758](https://github.com/google/site-kit-wp/issues/758).
* Update incorrect message in development setup flow referring to site verification instead of Search Console. Props AVGP. See [#600](https://github.com/google/site-kit-wp/issues/600).
* Only show Tag Manager containers that are relevant to the site's mode, and accordingly support AMP-first by only exposing AMP containers. See [#470](https://github.com/google/site-kit-wp/issues/470).

= 1.0.4 =

**Fixed**

* Fix critical bug causing unnecessary requests to Google People API although no user is logged-in. See [#854](https://github.com/google/site-kit-wp/issues/854).

= 1.0.3 =

**Fixed**

* Fix critical issue where an invalid refresh token would not revoke the current token, resulting in recurring requests with further attempts. See [#831](https://github.com/google/site-kit-wp/issues/831).
* Fix REST request sending credentials potentially being blocked due to user agent.

= 1.0.2 =

**Enhanced**

* Introduce Jest for JS unit tests, migrate existing tests, and improve various related infrastructure components. See [#524](https://github.com/google/site-kit-wp/issues/524).

**Fixed**

* Do not disconnect user when refreshing an access token randomly fails, and ensure the user sees an error message about any errors during the process. See [#818](https://github.com/google/site-kit-wp/issues/818).
* Fix error that could occur when setting up a new Analytics profile from the module setup. See [#816](https://github.com/google/site-kit-wp/issues/816).
* Fix bug where the site verification nonce was not sent to the authentication service. See [#797](https://github.com/google/site-kit-wp/issues/797).
* Fix false positive when detecting existing Analytics tags, which previously blocked users from completing the module setup. See [#793](https://github.com/google/site-kit-wp/issues/793).
* Ensure that `google-site-kit` translation strings in JavaScript files are maintained after minification so that they can be translated on wordpress.org. See [#782](https://github.com/google/site-kit-wp/issues/782).
* Improve various translation strings by removing trailing spaces, adding a context, fixing capitalization, and more. Props pedro-mendonca. See [#769](https://github.com/google/site-kit-wp/issues/769).
* Remove irrelevant translation strings from codebase by eliminating `@wordpress/components` dependency. See [#759](https://github.com/google/site-kit-wp/issues/759).
* Improve detection of existing Analytics snippet by covering a further variant that is used e.g. by the Analytify plugin. Props ernee. See [#744](https://github.com/google/site-kit-wp/issues/744).
* Improve UX and fix performance issues with excessive re-rendering in the module settings screen. See [#742](https://github.com/google/site-kit-wp/issues/742).
* Fix style issues in various data tables which previously would break out of their parent containers on certain device widths. See [#480](https://github.com/google/site-kit-wp/issues/480).
* Fix `Unknown error (code: checking requirements failed).` by resolving quota issues on the authentication service.
* Improve stability of REST API request issued by the authentication service when setting up a new site.
* Fix `Method not allowed` error on the authentication service.

= 1.0.1 =

**Fixed**

* Ensure verification tokens and other plugin user data correctly get cleared when resetting the plugin before the user has authenticated. See [#771](https://github.com/google/site-kit-wp/issues/771).
* Fix bug where the verification tag sent from the service to the plugin would result in a 404 response, preventing the verification from being completed. Props theeducatedbarfly. See [#765](https://github.com/google/site-kit-wp/issues/765).
* Improve compatibility with sites that have a `http://` website address stored as `home_url`, but actually require HTTPS. Props drcrow. See [#760](https://github.com/google/site-kit-wp/issues/760).

= 1.0.0 =

**Enhanced**

* Display a reset button alongside the setup button so that the plugin can also be reset before completing the initial flow. See [#753](https://github.com/google/site-kit-wp/issues/753).
* Remove custom updater to instead fully rely on wordpress.org. See [#644](https://github.com/google/site-kit-wp/issues/644).

**Fixed**

* Correctly disconnect the user when revoking access from the proxy, and update the wording accordingly. See [#724](https://github.com/google/site-kit-wp/issues/724).
* Show error message in PageSpeed Insights widget when API response incorrectly comes back with a score of 0. See [#723](https://github.com/google/site-kit-wp/issues/723).
