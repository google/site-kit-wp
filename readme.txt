=== Site Kit by Google - Analytics, Search Console, AdSense, Speed ===

Contributors:      google
Requires at least: 5.2
Tested up to:      6.8
Requires PHP:      7.4
Stable tag:        1.150.0
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

= 1.150.0 =

**Enhanced**

* Fix bug that could cause an error when Analytics module is not connected. See [#10564](https://github.com/google/site-kit-wp/issues/10564).
* Improve CTA label in Reader Revenue Manager setup flow. See [#10500](https://github.com/google/site-kit-wp/issues/10500).
* Update PAX SDK package. See [#10493](https://github.com/google/site-kit-wp/issues/10493).
* Improve Reader Revenue Manager debug information visibility in Site Health. See [#10478](https://github.com/google/site-kit-wp/issues/10478).
* Update the "See full details in Ads" link to lead to the campaign deeplink URL. See [#10437](https://github.com/google/site-kit-wp/issues/10437).
* Remove the progress bar on the setup screen when PAX setup is initiated. See [#10427](https://github.com/google/site-kit-wp/issues/10427).
* Persist Ads reminder notification when Google for Woo plugin is installed. See [#10419](https://github.com/google/site-kit-wp/issues/10419).
* Improve Reader Revenue Manager blocks in the WordPress editor for non-Site Kit users. See [#10400](https://github.com/google/site-kit-wp/issues/10400).
* Add GA event tracking for user interaction with the Reader Revenue Manager settings edit screen. See [#10332](https://github.com/google/site-kit-wp/issues/10332).
* Add opt-in GA event tracking for user interaction with the Reader Revenue Manager module setup success notification. See [#10329](https://github.com/google/site-kit-wp/issues/10329).
* Ensure metrics' scroll bar is visible on mobile screens. See [#10163](https://github.com/google/site-kit-wp/issues/10163).
* Merge the `rrmModuleV2` feature flag with the `rrmModule` flag in preparation for the launch of RRM V2. See [#10071](https://github.com/google/site-kit-wp/issues/10071).
* Fix a bug that occurs when setting up Site Kit and clicking on the **Next** button in the final service setup stage multiple times. See [#10037](https://github.com/google/site-kit-wp/issues/10037).
* Prevent multiple admin menu tooltips from appearing at once. See [#10003](https://github.com/google/site-kit-wp/issues/10003).
* Update the module connection notifications to use our new notification infrastructure. See [#9297](https://github.com/google/site-kit-wp/issues/9297).
* Update Enhanced Measurement banner to use new notifications infrastructure. See [#9293](https://github.com/google/site-kit-wp/issues/9293).

**Fixed**

* Fix issue that could cause surveys with multiple-choice answers to skip questions. See [#10581](https://github.com/google/site-kit-wp/issues/10581).
* Ensure that changes to a selected publication's available product IDs are reflected in the Reader Revenue Manager settings screen without needing to wait for the publication to be synchronized. See [#10482](https://github.com/google/site-kit-wp/issues/10482).
* Fix link to Publisher Center in the Reader Revenue Manager publication approved overlay notification. See [#10480](https://github.com/google/site-kit-wp/issues/10480).
* Fix styling of Reader Revenue Manager buttons in the pattern view of the WordPress Block Editor. See [#10479](https://github.com/google/site-kit-wp/issues/10479).
* Update the divider underneath the Reader Revenue Manager Product ID dropdown in the settings screen to align with the design. See [#10477](https://github.com/google/site-kit-wp/issues/10477).
* Fix the incorrect behavior of the "Account Linked" notification of the Ads module. See [#10463](https://github.com/google/site-kit-wp/issues/10463).
* Update the `Using the WooCommerce plugin` modal not to dismiss itself when it is closed by clicking outside of the dialog. See [#10414](https://github.com/google/site-kit-wp/issues/10414).
* Update the Ads setup banner to disable the CTA button if adblocker is detected. See [#10326](https://github.com/google/site-kit-wp/issues/10326).
* Prevent duplicate GA4 settings update requests by limiting Google tag syncs to once per hour. See [#10284](https://github.com/google/site-kit-wp/issues/10284).
* Fix duplicate Google tag settings request issue. See [#10283](https://github.com/google/site-kit-wp/issues/10283).
* Fix Ninja Forms script loading issue when the enhanced conversion tracking is enabled. See [#9381](https://github.com/google/site-kit-wp/issues/9381).

[See changelog for all versions](https://raw.githubusercontent.com/google/site-kit-wp/main/changelog.txt).
