=== Site Kit by Google - Analytics, Search Console, AdSense, Speed ===

Contributors:      google
Requires at least: 5.2
Tested up to:      6.7
Requires PHP:      7.4
Stable tag:        1.142.0
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

= 1.142.0 =

**Added**

* Add Analytics events to Sign in with Google. See [#9747](https://github.com/google/site-kit-wp/issues/9747).

**Enhanced**

* Fix the "improve your measurement" section's layout in mobile viewports. See [#9830](https://github.com/google/site-kit-wp/issues/9830).
* Update the default value of the First-party mode `isEnabled` setting to `false`. See [#9828](https://github.com/google/site-kit-wp/issues/9828).
* Add periodic server requirement health checks for first-party mode. See [#9768](https://github.com/google/site-kit-wp/issues/9768).
* Always display the "Anyone can register" WordPress setting in Sign in with Google settings. See [#9735](https://github.com/google/site-kit-wp/issues/9735).
* Update learn more link in Sign in with Google module settings. See [#9734](https://github.com/google/site-kit-wp/issues/9734).
* Update copy in Sign in with Google "Connect more services" UI. See [#9733](https://github.com/google/site-kit-wp/issues/9733).
* Update Sign in with Google setup success notification UI. See [#9724](https://github.com/google/site-kit-wp/issues/9724).
* Automatically dismiss the First-Party Mode setup banner notification when the toggle is enabled from the settings screen, preventing redundant notifications. See [#9698](https://github.com/google/site-kit-wp/issues/9698).
* Add a selector to detect changes and an action to reset First-party mode settings, integrated with Analytics and Ads rollback and validation processes. See [#9688](https://github.com/google/site-kit-wp/issues/9688).
* Add FPFE health check and script access statuses to Site Kit’s Site Health section, displaying whether these checks are enabled or disabled. See [#9668](https://github.com/google/site-kit-wp/issues/9668).
* Add First-Party Mode status to Site Kit’s Site Health section, displaying whether the feature is enabled or not when either the Analytics or Ads modules are connected and the `firstPartyMode` feature flag is active. See [#9667](https://github.com/google/site-kit-wp/issues/9667).
* Add support for gtag to load in first-party mode when enabled. See [#9664](https://github.com/google/site-kit-wp/issues/9664).
* Display the First-party mode enabled status in the Ads settings view. See [#9659](https://github.com/google/site-kit-wp/issues/9659).
* Display the First-party mode enabled status in the Analytics settings view. See [#9658](https://github.com/google/site-kit-wp/issues/9658).
* Integrate the First-party mode toggle into the Ads module’s settings form, allowing users to enable or disable First-party mode. See [#9655](https://github.com/google/site-kit-wp/issues/9655).
* Integrate the First-party mode toggle into the Analytics module’s settings form, allowing users to enable or disable First-party mode. See [#9654](https://github.com/google/site-kit-wp/issues/9654).
* Group measurement toggles together on the settings screen in the Ads and Analytics module edit sections. See [#9651](https://github.com/google/site-kit-wp/issues/9651).
* Add a "Beta" badge to the First-party mode toggle. See [#9650](https://github.com/google/site-kit-wp/issues/9650).
* Implement the First-party mode toggle as a component which is presented in Storybook. See [#9649](https://github.com/google/site-kit-wp/issues/9649).
* Add first-party mode setup success notification. See [#9648](https://github.com/google/site-kit-wp/issues/9648).
* Add the First-party mode setup banner to let users know about the feature and enable it from the dashboard. See [#9647](https://github.com/google/site-kit-wp/issues/9647).
* Update spacing between CTA actions for consistency. See [#9600](https://github.com/google/site-kit-wp/issues/9600).
* Add notification banner when event data has been missing for ninety days. See [#9578](https://github.com/google/site-kit-wp/issues/9578).
* Improve notifications rendering performance. See [#9488](https://github.com/google/site-kit-wp/issues/9488).
* Add full size selection panel on the new screen. See [#9375](https://github.com/google/site-kit-wp/issues/9375).
* Update Analytics Conversion Report notifications to be more context-aware. See [#9373](https://github.com/google/site-kit-wp/issues/9373).
* Ensure Analytics Conversion Reports notification appears for users who set up Key Metrics manually. See [#9372](https://github.com/google/site-kit-wp/issues/9372).
* Ensure that the setup flow for a module is automatically continued when clicking the "Redo setup" CTA on the "Site Kit can’t access necessary data" unsatisfied scopes notification. See [#9261](https://github.com/google/site-kit-wp/issues/9261).
* Extend Consent Mode conditions logic. See [#9147](https://github.com/google/site-kit-wp/issues/9147).

**Fixed**

* Update the Sign in with Google module to suggest using the previous client ID when re-connecting the module. See [#9744](https://github.com/google/site-kit-wp/issues/9744).
* Ensure Sign in with Google translations are consistent. See [#9738](https://github.com/google/site-kit-wp/issues/9738).
* Add Sign in with Google live preview in settings. See [#9718](https://github.com/google/site-kit-wp/issues/9718).
* Update layout of Top Content widget in smaller viewports to use a tab per metric column. See [#7563](https://github.com/google/site-kit-wp/issues/7563).

[See changelog for all versions](https://raw.githubusercontent.com/google/site-kit-wp/main/changelog.txt).
