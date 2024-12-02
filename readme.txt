=== Site Kit by Google - Analytics, Search Console, AdSense, Speed ===

Contributors:      google
Requires at least: 5.2
Tested up to:      6.7
Requires PHP:      7.4
Stable tag:        1.141.0
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

= 1.141.0 =

**Added**

* Add Sign in with Google to WooCommerce login page. See [#9340](https://github.com/google/site-kit-wp/issues/9340).

**Enhanced**

* Update Sign in with Google descriptions in Site Health. See [#9680](https://github.com/google/site-kit-wp/issues/9680).
* Update the Sign in with Google login to use the popup approach. See [#9677](https://github.com/google/site-kit-wp/issues/9677).
* Integrate the First-party mode proxy script that will allow Analytics events to be tracked via requests made from the browser to the user's site rather than directly to Google's servers. See [#9665](https://github.com/google/site-kit-wp/issues/9665).
* Add info to the "One-tap" option in Sign in with Google settings. See [#9643](https://github.com/google/site-kit-wp/issues/9643).
* Do not show "Maybe later" in Key Metrics Admin Settings callout banner. See [#9636](https://github.com/google/site-kit-wp/issues/9636).
* Implement the `fetchGetFPMServerRequirementStatus()` Redux action used to retrieve the FPM server requirement status. See [#9634](https://github.com/google/site-kit-wp/issues/9634).
* Add an `fpm-server-requirement-status` API endpoint to verify First-Party Mode readiness by performing FPFE health checks and verifying direct PHP script access. See [#9632](https://github.com/google/site-kit-wp/issues/9632).
* Add a partial datastore for First-Party Mode in the `core/site` datastore to manage its settings. See [#9628](https://github.com/google/site-kit-wp/issues/9628).
* Add REST endpoints for First-Party Mode module settings. See [#9625](https://github.com/google/site-kit-wp/issues/9625).
* Update "Get your Client ID" link in Sign in with Google setup. See [#9621](https://github.com/google/site-kit-wp/issues/9621).
* Ensure tailored metrics override previous metrics when switching from manually-selected metrics. See [#9613](https://github.com/google/site-kit-wp/issues/9613).
* Improve the accuracy of the mechanism that scrolls the user to a widget area. See [#9603](https://github.com/google/site-kit-wp/issues/9603).
* Improve visitor groups selection panel to prevent a console warning. See [#9602](https://github.com/google/site-kit-wp/issues/9602).
* Add an external icon to external links in the audience selection panel and placeholder tile. See [#9598](https://github.com/google/site-kit-wp/issues/9598).
* Remove visitor groups setup success notifications when the user chooses not to display visitor groups in dashboard. See [#9596](https://github.com/google/site-kit-wp/issues/9596).
* Introduce grouping of notification queues. See [#9568](https://github.com/google/site-kit-wp/issues/9568).
* Add notice for users who used a legacy answer in Key Metrics settings. See [#9518](https://github.com/google/site-kit-wp/issues/9518).
* Split the "Sell products or services" answer in the User Input app. See [#9489](https://github.com/google/site-kit-wp/issues/9489).
* Persist selection group in Key Metrics selection panel. See [#9385](https://github.com/google/site-kit-wp/issues/9385).
* Add support for disconnecting associated Google account for sign in from WordPress user edit screen. See [#9380](https://github.com/google/site-kit-wp/issues/9380).
* Implement new subtle notification banner in KMW dashboard area. See [#9371](https://github.com/google/site-kit-wp/issues/9371).
* Move on-demand onboarding state synchronization to the server side, avoiding the need to reload the full list of publications. See [#9363](https://github.com/google/site-kit-wp/issues/9363).
* Improve selection panels so that they perform actions only when in view. See [#9312](https://github.com/google/site-kit-wp/issues/9312).
* Improve Reader Revenue Manager publication onboarding state synchronization. See [#9149](https://github.com/google/site-kit-wp/issues/9149).
* Add Key Metrics info to Site Health report. See [#9112](https://github.com/google/site-kit-wp/issues/9112).

**Changed**

* Implement settings view for Sign in with Google. See [#9477](https://github.com/google/site-kit-wp/issues/9477).
* Implement Sign in with Google token response login handling. See [#9339](https://github.com/google/site-kit-wp/issues/9339).

**Fixed**

* Fix a bug that caused a custom dimension to not be created while setting up visitor groups. See [#9597](https://github.com/google/site-kit-wp/issues/9597).

[See changelog for all versions](https://raw.githubusercontent.com/google/site-kit-wp/main/changelog.txt).
