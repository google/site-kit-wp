=== Site Kit by Google - Analytics, Search Console, AdSense, Speed ===

Contributors:      google
Requires at least: 5.2
Tested up to:      6.8
Requires PHP:      7.4
Stable tag:        1.159.0
License:           Apache License 2.0
License URI:       https://www.apache.org/licenses/LICENSE-2.0
Tags:              google, search-console, analytics, adsense, pagespeed-insights

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

== Installation ==

**Note**: Make sure that your website is live. If your website isn't live yet, Site Kit can't show you any data.
However, if you have a staging environment in addition to your production site, Site Kit can display data from your production site in the staging environment. Learn how to use [Site Kit with a staging environment](https://sitekit.withgoogle.com/documentation/using-site-kit/staging/).

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
4. Connect additional Google tools under **Site Kit > Settings**. Learn more about [which tools are right for you](https://sitekit.withgoogle.com/documentation/getting-started/connecting-services/).

== Frequently Asked Questions ==

For more information, visit the [official Site Kit website](https://sitekit.withgoogle.com/documentation/).

= Is Site Kit free? =

The Site Kit plugin is free and open source, and will remain so. Individual Google products included in Site Kit are subject to standard terms and fees (if any) for those products.

= What are the minimum requirements for Site Kit? =

In order to successfully install and use Site Kit, your site must meet the following requirements:

* WordPress version 5.2+
* PHP version 7.4+
* Modern browser – Internet Explorer is not supported
* Is publicly accessible – it isn’t in maintenance mode, accessible only via password, or otherwise blocked
* REST API is available – Site Kit must be able to communicate via REST API with Google services. To ensure that the REST API is available for your site, go to Tools > Site Health.

= Why is my dashboard showing “gathering data” and none of my service data? =

It can take a few days after connecting Site Kit to a Google service for data to begin to display in your dashboard. The “gathering data” message typically appears when you’ve recently set up a Google service (i.e. just created a new Analytics account) and/or your site is new, and data is not yet available for display.

If you are still seeing this message after a few days, feel free to get in touch with us on the [support forum](https://wordpress.org/support/plugin/google-site-kit/).

= Why aren’t any ads appearing on my site after I connected AdSense? =

If you’re new to AdSense when you connect via Site Kit, your new AdSense account and your site will need to be manually reviewed and approved for ads by the AdSense team. Ads will not display until your account and site have been approved. [Check out this guide for more information about the approval process and timeline.](https://support.google.com/adsense/answer/76228)

You can check your approval status in Site Kit by going to **Settings > Connected Services > AdSense** and clicking **Check your site status**. This link will direct you to AdSense. If you see “Ready,” your account and site have been approved and should be displaying ads. If you see “Getting ready…,” your account and site are still under review and your site will not display ads until they have been approved.

If Site Kit has successfully added the AdSense snippet to your site and your account and site have been approved, but your site is still not showing ads, [contact the AdSense Help Center for assistance](https://support.google.com/adsense/#topic=3373519).

You can find more information on how Site Kit works with AdSense in our [Managing AdSense guide](https://sitekit.withgoogle.com/documentation/using-site-kit/managing-adsense/).

= Is Site Kit GDPR compliant? =

When using Site Kit, site owners are responsible for managing notice and consent requirements – including GDPR requirements – as described in [Google’s Terms of Service](https://policies.google.com/terms).

By default, Site Kit does anonymize IP addresses upon activation of the Google Analytics module. This setting can be turned off in **Site Kit > Settings > Analytics > Anonymize IP addresses**.

There are a number of third-party plugins that allow you to block Google Analytics, Tag Manager, or AdSense from capturing data until a visitor to the site consents. Some of these work natively with Site Kit by providing plugin-specific configurations. You can find out more about these by visiting our [GDPR compliance and privacy page](https://sitekit.withgoogle.com/documentation/using-site-kit/gdpr-compliance-and-privacy/).

= Where can I get additional support? =

Please create a new topic on our [WordPress.org support forum](https://wordpress.org/support/plugin/google-site-kit/). Be sure to follow the [support forum guidelines](https://wordpress.org/support/guidelines/) when posting.

== Changelog ==

= 1.159.0 =

**Enhanced**

* Upgrade Partner Ads Experience to version `1.1.8`. See [#11236](https://github.com/google/site-kit-wp/issues/11236).
* Update the Internal Server error notice styles. See [#11201](https://github.com/google/site-kit-wp/issues/11201).
* Update Search Console icon to use the newest one. See [#11178](https://github.com/google/site-kit-wp/issues/11178).
* Update the "No more modules to connect" notice in Settings. See [#11166](https://github.com/google/site-kit-wp/issues/11166).
* Update the notice that appears when Site Kit is refreshed. See [#11164](https://github.com/google/site-kit-wp/issues/11164).
* Update ErrorHandler to use new Error Banner component. See [#11137](https://github.com/google/site-kit-wp/issues/11137).
* Update older notification banners to use new styles. See [#11124](https://github.com/google/site-kit-wp/issues/11124).
* Replace h3 headings with the new Typography component. See [#10944](https://github.com/google/site-kit-wp/issues/10944).
* Update the ProgressBar component to use vertical spacing properties instead of height properties. See [#10894](https://github.com/google/site-kit-wp/issues/10894).
* Add validation to Sign in with Google client ID provisioning names. See [#10844](https://github.com/google/site-kit-wp/issues/10844).
* Reduce usage of the Analytics Admin API's `properties.dataStreams.list` endpoint, replacing it with a lightweight Analytics Data API `properties.runReport` request for checking module access. See [#10708](https://github.com/google/site-kit-wp/issues/10708).
* Update the style of the banners shown when AdSense accounts encounter an issue. See [#10426](https://github.com/google/site-kit-wp/issues/10426).
* Update notice about web data stream availability to be persistent. See [#10165](https://github.com/google/site-kit-wp/issues/10165).
* Refactor Sign in with Google to use common web tag infrastructure. See [#10027](https://github.com/google/site-kit-wp/issues/10027).
* Update Google API client to respect WP external HTTP request controls. See [#3957](https://github.com/google/site-kit-wp/issues/3957).

**Fixed**

* Fix bug that could cause HTML text to appear in notification. See [#11194](https://github.com/google/site-kit-wp/issues/11194).
* Ensure the Consent Mode toggle is enabled immediately upon clicking the "Enable consent mode" CTA in the feature setup banner, and the enabled state is reflected when navigating to the settings screen. See [#11073](https://github.com/google/site-kit-wp/issues/11073).
* Prevent the Module Recovery Banner's **Recover** CTA button from flickering while module recovery is in progress. See [#11055](https://github.com/google/site-kit-wp/issues/11055).
* Update tooltips in the All Traffic Widget to omit percentage if the previous period data is not available. See [#10907](https://github.com/google/site-kit-wp/issues/10907).
* Fix double clicking issue for different CTA buttons. See [#10281](https://github.com/google/site-kit-wp/issues/10281).
* Update the user input app styles to correctly look on mobile devices. See [#10211](https://github.com/google/site-kit-wp/issues/10211).
* Fix the issue when the Enhanced Measurement setting switched back to the enabled state after returning from the OAuth flow. See [#10123](https://github.com/google/site-kit-wp/issues/10123).
* Improve support for Google Translate inside Site Kit plugin content and charts. See [#6532](https://github.com/google/site-kit-wp/issues/6532).

[See changelog for all versions](https://raw.githubusercontent.com/google/site-kit-wp/main/changelog.txt).
