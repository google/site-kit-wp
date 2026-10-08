=== Site Kit by Google - Analytics, Search Console, AdSense, Speed ===

Contributors:      google
Requires at least: 5.2
Tested up to:      7.1
Requires PHP:      7.4
Stable tag:        1.189.0
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

= 1.189.0 =

**Enhanced**

* Update proxy setup to include verification evidence. See [#13678](https://github.com/google/site-kit-wp/issues/13678).
* Add the `datePicker` feature flag for the dashboard date picker feature. See [#13609](https://github.com/google/site-kit-wp/issues/13609).
* Add the `typicalTraffic` feature flag. See [#13592](https://github.com/google/site-kit-wp/issues/13592).
* Add survey triggers in Reader Revenue Manager express setup flow. See [#13577](https://github.com/google/site-kit-wp/issues/13577).
* Add a feature metric reporting configured Reader Revenue Manager CTA types. See [#13576](https://github.com/google/site-kit-wp/issues/13576).
* Remove the All Traffic widget, so the new Traffic Overview widget shows in the Traffic section of the main and entity dashboards for every site. See [#13413](https://github.com/google/site-kit-wp/issues/13413).
* Add the PDF widget for the new Traffic Overview version. See [#13412](https://github.com/google/site-kit-wp/issues/13412).
* Add loading, gathering-data, zero-data and error states to the new Traffic Overview widget. See [#13411](https://github.com/google/site-kit-wp/issues/13411).
* Add the daily traffic chart to the new Traffic Overview widget. See [#13409](https://github.com/google/site-kit-wp/issues/13409).
* Add ability to enable Plugin Conversion Tracking from Site Goals CTA. See [#13398](https://github.com/google/site-kit-wp/issues/13398).
* Save publication type and email opt-in when accepting Reader Revenue Manager Terms of Service during express setup. See [#13392](https://github.com/google/site-kit-wp/issues/13392).
* Show the new feature count in the "Add Features" admin menu item. See [#13359](https://github.com/google/site-kit-wp/issues/13359).
* Add an **Add features** button to the dashboard header with a badge for new features. See [#13358](https://github.com/google/site-kit-wp/issues/13358).
* Allow a user to provide feedback when dismissing a feature from the "What's new?" tab in the Feature Discovery Hub. See [#13357](https://github.com/google/site-kit-wp/issues/13357).
* Build the Feature Discovery Hub's "All services and features" tab. See [#13328](https://github.com/google/site-kit-wp/issues/13328).
* Build the feature card's CTA for setting up a feature, with a stub setup action. See [#13322](https://github.com/google/site-kit-wp/issues/13322).
* Build the Feature Discovery Hub's "What's new?" tab. See [#13321](https://github.com/google/site-kit-wp/issues/13321).
* Build the `FeatureCard` and `EffortIndicator` components for the upcoming Feature Discovery Hub, and present them in Storybook. See [#13320](https://github.com/google/site-kit-wp/issues/13320).
* Route new users to the "All services and features" tab on their first visit to the Feature Discovery Hub, and the "What's new?" tab by default on subsequent visits. See [#13319](https://github.com/google/site-kit-wp/issues/13319).
* Add event tracking that monitors when a reader finishes reading a post. See [#13287](https://github.com/google/site-kit-wp/issues/13287).
* Add the setup complete step to the Reader Revenue Manager Express setup flow. See [#13028](https://github.com/google/site-kit-wp/issues/13028).

**Fixed**

* Ensure traffic overview cards show accurate percentages when rounding. See [#13659](https://github.com/google/site-kit-wp/issues/13659).
* Fix duplicate date labels on the Traffic overview chart while Analytics is gathering data. See [#13658](https://github.com/google/site-kit-wp/issues/13658).
* Fix the welcome tour skipping its traffic step when the new Traffic Overview widget is enabled. See [#13656](https://github.com/google/site-kit-wp/issues/13656).
* Fix creating a CTA in the Reader Revenue Manager express setup flow. See [#13634](https://github.com/google/site-kit-wp/issues/13634).
* Fix listing existing publications in the Reader Revenue Manager express setup flow. See [#13622](https://github.com/google/site-kit-wp/issues/13622).
* Fix creating a publication in the Reader Revenue Manager express setup flow. See [#13620](https://github.com/google/site-kit-wp/issues/13620).
* Ensure empty data rows don't appear in the Speed section of the PDF export. Props vivekjm. See [#13215](https://github.com/google/site-kit-wp/issues/13215).

[See changelog for all versions](https://raw.githubusercontent.com/google/site-kit-wp/main/changelog.txt).
