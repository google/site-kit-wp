=== Site Kit by Google - Analytics, Search Console, AdSense, Speed ===

Contributors:      google
Requires at least: 5.2
Tested up to:      7.1
Requires PHP:      7.4
Stable tag:        1.193.0
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
* **Sign in with Google:** Allows visitors to sign up and log in to your site with their existing Google account.
* **Reader Revenue Manager:** Helps you grow, retain, and engage your site visitors via subscription, contribution, newsletters, surveys, and custom prompts.
* **Ads:** Get customers and sell more with targeted traffic from Google Ads.

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

= 1.193.0 =

**Enhanced**

* Adjust survey triggers for Fresh Data. See [#14185](https://github.com/google/site-kit-wp/issues/14185).
* Update the footer link on the Ad Blocking Recovery setup screen to read "Exit setup" instead of "Cancel" after the user clicks "Create message". See [#14151](https://github.com/google/site-kit-wp/issues/14151).
* Update the CTA label in feature hub cards. See [#14143](https://github.com/google/site-kit-wp/issues/14143).
* Improve error notice in the "Recent activity" tab when the user encounters a permissions error. See [#14121](https://github.com/google/site-kit-wp/issues/14121).
* Add encrypted storage support for Measurement Protocol data. See [#14031](https://github.com/google/site-kit-wp/issues/14031).
* Hide the "Unlock more Site Kit features" callout once the user has visited the Feature Discovery Hub. See [#13999](https://github.com/google/site-kit-wp/issues/13999).
* Update the Feature Discovery Hub's feature cards for mobile viewports. See [#13987](https://github.com/google/site-kit-wp/issues/13987).
* Add GA events for the incomplete-setup reminder and its “Add features” tooltip. See [#13935](https://github.com/google/site-kit-wp/issues/13935).
* Add GA events for interaction with the setup success, setup error and auto-update notices on the Feature Discovery Hub. See [#13934](https://github.com/google/site-kit-wp/issues/13934).
* Add GA event tracking for the Feature Discovery Hub's feature cards and feature detail panel. See [#13933](https://github.com/google/site-kit-wp/issues/13933).
* Add GA event tracking for the Feature Discovery Hub's entry points and navigation. See [#13932](https://github.com/google/site-kit-wp/issues/13932).
* Show a spinner on the splash screen's "Sign in with Google" button until the Google sign-in page loads. See [#13910](https://github.com/google/site-kit-wp/issues/13910).
* Show a one-time tooltip pointing to "Add features" when the user first dismisses an incomplete-setup reminder. See [#13789](https://github.com/google/site-kit-wp/issues/13789).
* Add a dashboard reminder notification to resume abandoned Reader Revenue Manager newsletter sign-up form setup. See [#13788](https://github.com/google/site-kit-wp/issues/13788).
* Add the survey CTA type and its configuration to the Reader Revenue Manager module. See [#13739](https://github.com/google/site-kit-wp/issues/13739).
* Add a dashboard notification that invites publishers to set up a Reader Revenue Manager survey. See [#13734](https://github.com/google/site-kit-wp/issues/13734).
* Add a "Back" button to the survey questions and survey CTA steps of the Reader Revenue Manager express setup. See [#13733](https://github.com/google/site-kit-wp/issues/13733).
* Create the Google Analytics custom dimensions required for the Reader Revenue Manager survey when entering the survey setup. See [#13731](https://github.com/google/site-kit-wp/issues/13731).
* Add the selected questions pane to the Reader Revenue Manager survey setup, where users can remove and reorder their survey questions. See [#13729](https://github.com/google/site-kit-wp/issues/13729).
* Add the custom question side sheet to the Reader Revenue Manager survey setup. See [#13728](https://github.com/google/site-kit-wp/issues/13728).
* Require the organization and publication IDs in Reader Revenue Manager's publication and CTA datapoints. See [#13429](https://github.com/google/site-kit-wp/issues/13429).
* Show a success notice in place of a feature's card on the Feature Discovery Hub when the feature is set up without leaving the hub. See [#13346](https://github.com/google/site-kit-wp/issues/13346).
* Add argument and response schemas to Site Kit’s REST API routes. See [#6760](https://github.com/google/site-kit-wp/issues/6760).

**Fixed**

* Fix Site Kit emails being rejected or marked as spam by sending them from the site’s domain. See [#14189](https://github.com/google/site-kit-wp/issues/14189).
* Fix "See all recent posts" so that it scrolls to the "Latest content" card and moves keyboard focus to its "Latest content" tab. See [#14122](https://github.com/google/site-kit-wp/issues/14122).
* Update the latest post performance tiles to use a light blue background and a smaller title, and use the same smaller title in the Site goals tiles. See [#14119](https://github.com/google/site-kit-wp/issues/14119).
* Fix the icon of the insight notice on the "Recent activity" tab to match the design. See [#14115](https://github.com/google/site-kit-wp/issues/14115).
* Fix the color of the pin icon in the "Latest post performance since published" section. See [#14114](https://github.com/google/site-kit-wp/issues/14114).
* Fix the heading level of the tile titles in the "Latest post performance" section of the Recent activity tab. See [#14112](https://github.com/google/site-kit-wp/issues/14112).
* Fix the alignment of the Site Kit icon in the WordPress admin menu on small screens and in the collapsed menu. Props jibin7jose. See [#13378](https://github.com/google/site-kit-wp/issues/13378).
* Fix a bug where Key Metrics was hidden on the dashboard after another admin signed in to Site Kit. See [#13371](https://github.com/google/site-kit-wp/issues/13371).

[See changelog for all versions](https://raw.githubusercontent.com/google/site-kit-wp/main/changelog.txt).
