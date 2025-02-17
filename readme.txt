=== Site Kit by Google - Analytics, Search Console, AdSense, Speed ===

Contributors:      google
Requires at least: 5.2
Tested up to:      6.7
Requires PHP:      7.4
Stable tag:        1.146.0
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

= 1.146.0 =

**Enhanced**

* Add warning to users when Sign in with Google One-tap appears site-wide without open user registrations. See [#10079](https://github.com/google/site-kit-wp/issues/10079).
* Update the Reader Revenue Manager settings view screen to include new settings introduced in Phase 2. See [#10067](https://github.com/google/site-kit-wp/issues/10067).
* Add a reusable chip multi-select component. See [#10064](https://github.com/google/site-kit-wp/issues/10064).
* Update the Reader Revenue Manager setup CTA banner copy to highlight paywall support when the feature flag is enabled. See [#10063](https://github.com/google/site-kit-wp/issues/10063).
* Add mechanism to clear term meta on Site Kit reset. See [#10061](https://github.com/google/site-kit-wp/issues/10061).
* Add mechanism to store term-level Reader Revenue Manager settings. See [#9956](https://github.com/google/site-kit-wp/issues/9956).
* Add mechanism to synchronize Reader Revenue Manager publication information. See [#9954](https://github.com/google/site-kit-wp/issues/9954).
* Add mechanism to reset publication-specific information when the publication is changed. See [#9953](https://github.com/google/site-kit-wp/issues/9953).
* Update Reader Revenue Manager publication selection to populate new settings. See [#9952](https://github.com/google/site-kit-wp/issues/9952).
* Add infrastructure to interface with WordPress term metadata. See [#9949](https://github.com/google/site-kit-wp/issues/9949).
* Improve the styling of the Sign in with Google button on WooCommerce login forms. See [#9932](https://github.com/google/site-kit-wp/issues/9932).
* Update Ads settings view screen to display items in the correct order. See [#9908](https://github.com/google/site-kit-wp/issues/9908).
* Update the First-party mode status in Site Health to use "Enabled" or "Disabled" instead of "Yes" or "No" and update the label from "First-party mode: Enabled" to "First-party mode". See [#9904](https://github.com/google/site-kit-wp/issues/9904).
* Refactor consent mode setup CTA to use new infrastructure. See [#9887](https://github.com/google/site-kit-wp/issues/9887).
* Update the Audience Segmentation Setup CTA so it does not appear alongside other CTAs. See [#9886](https://github.com/google/site-kit-wp/issues/9886).
* Update visitor group card to prevent including `(not set)` in cities with the most visitors. See [#9604](https://github.com/google/site-kit-wp/issues/9604).

**Changed**

* Ensure user is redirected back to original page when using Sign in with Google. See [#10015](https://github.com/google/site-kit-wp/issues/10015).

**Fixed**

* Improve reliability of Sign in with Google rendering on WooCommerce account pages. See [#10120](https://github.com/google/site-kit-wp/issues/10120).
* Fix bug that could cause CTA to add new metrics to Analytics. See [#10044](https://github.com/google/site-kit-wp/issues/10044).
* Fix bug that caused the "Top traffic source driving leads" metric to show no data in the "90 days" view. See [#10043](https://github.com/google/site-kit-wp/issues/10043).
* Fix bug that could cause metrics not to update properly if answers were changed several times before saving changes. See [#10034](https://github.com/google/site-kit-wp/issues/10034).
* Ensure suggested metrics include new events. See [#10033](https://github.com/google/site-kit-wp/issues/10033).
* Fix user registration notification dismissal issue on the Sign in with Google settings screen. See [#9933](https://github.com/google/site-kit-wp/issues/9933).
* Fix key metrics setup CTA layout at 960px. See [#9911](https://github.com/google/site-kit-wp/issues/9911).

[See changelog for all versions](https://raw.githubusercontent.com/google/site-kit-wp/main/changelog.txt).
