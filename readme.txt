=== Site Kit by Google - Analytics, Search Console, AdSense, Speed ===

Contributors:      google
Requires at least: 5.2
Tested up to:      7.0
Requires PHP:      7.4
Stable tag:        1.180.0
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

= 1.180.0 =

**Enhanced**

* Add opt-in user tracking for the Analytics account creation error notice and the new "Answer question" button in the Key Metrics settings panel. Props satasiyakrish1. See [#12676](https://github.com/google/site-kit-wp/issues/12676).
* Update Reader Revenue Manager module description in Site Kit Settings. Props dokson. See [#12639](https://github.com/google/site-kit-wp/issues/12639).
* Fix bug that could cause plugins handling SMTP to send HTML emails as plaintext emails when sending Email reports. See [#12632](https://github.com/google/site-kit-wp/issues/12632).
* Add the `getGoLinkURL( key, args = {} )` selector to the `CORE_SITE` datastore. See [#12583](https://github.com/google/site-kit-wp/issues/12583).
* Add Visitor Engagement settings to Site Goals' Side Panel. See [#12582](https://github.com/google/site-kit-wp/issues/12582).
* Add Goal Drivers selection to the Site Goals panel. See [#12578](https://github.com/google/site-kit-wp/issues/12578).
* Increase number of goal drivers visible in Site Goals. See [#12577](https://github.com/google/site-kit-wp/issues/12577).
* Extend core widget registry to support PDF configuration. See [#12537](https://github.com/google/site-kit-wp/issues/12537).
* Add "Goal drivers" to the Site Goals section of the dashboard. See [#12528](https://github.com/google/site-kit-wp/issues/12528).
* Hide the "Start a feature tour" help menu item while the relevant module is still gathering data. See [#12523](https://github.com/google/site-kit-wp/issues/12523).
* Preload widgets for the dashboard tour. See [#12521](https://github.com/google/site-kit-wp/issues/12521).
* Substitute a Top Search Queries step in the dashboard tour when Key Metrics or Audience Segmentation are not yet set up. See [#12519](https://github.com/google/site-kit-wp/issues/12519).
* Improve setup flow so that the user doesn't see multiple setup CTAs when first landing on the dashboard. See [#12518](https://github.com/google/site-kit-wp/issues/12518).
* Update the splash screen to make the Analytics section more prominent in the new setup flow. See [#12516](https://github.com/google/site-kit-wp/issues/12516).
* Add visitor engagement to Site Goals. See [#12515](https://github.com/google/site-kit-wp/issues/12515).
* Add download menu item and side sheet. See [#12507](https://github.com/google/site-kit-wp/issues/12507).
* Use dynamic positioning for the Key Metric setup screen's "Complete setup" button, placing it in a sticky footer for shorter viewports. See [#12461](https://github.com/google/site-kit-wp/issues/12461).
* Update the Analytics setup screen layout for mobile and tablet viewports with a sticky footer CTA and responsive dropdown arrangement. See [#12460](https://github.com/google/site-kit-wp/issues/12460).
* Update the splash screen for mobile viewports in the new setup flow. See [#12459](https://github.com/google/site-kit-wp/issues/12459).
* Update the screenshot shown on the splash page in the new setup flow. See [#12458](https://github.com/google/site-kit-wp/issues/12458).
* Ensure email headers always include the correct "From" header. See [#12390](https://github.com/google/site-kit-wp/issues/12390).
* Enhance Analytics account creation flow to show errors inline. See [#12377](https://github.com/google/site-kit-wp/issues/12377).
* Add a meta key for users whose account is created with Sign in with Google. See [#11341](https://github.com/google/site-kit-wp/issues/11341).
* Fix layout shift when the AdSense setup prompt is dismissed. See [#11302](https://github.com/google/site-kit-wp/issues/11302).
* Update the Sign in with Google button to render in the preview mode. See [#10301](https://github.com/google/site-kit-wp/issues/10301).
* Fix layout of Sign in with Google button when session expired message appears. See [#10263](https://github.com/google/site-kit-wp/issues/10263).
* Hide Sign in with Google button on email verification pages. See [#10201](https://github.com/google/site-kit-wp/issues/10201).
* Improve the contrast for text in AdSense setup CTA widget. See [#9289](https://github.com/google/site-kit-wp/issues/9289).

**Fixed**

* Fix the last tooltip in the view-only dashboard tour being cut off on mobile viewports. See [#12691](https://github.com/google/site-kit-wp/issues/12691).
* Fix an issue that caused the tooltip associated with the welcome modal to appear in the center on smaller devices. See [#12675](https://github.com/google/site-kit-wp/issues/12675).
* Fix double 'X' icons/buttons for 'Data gathering complete' variant of the Welcome modal. Props ArivunidhiA. See [#12618](https://github.com/google/site-kit-wp/issues/12618).
* Fix a fatal TypeError when `dismissed_wp_pointers` user meta contains an unexpected type. See [#12580](https://github.com/google/site-kit-wp/issues/12580).
* Prevent help menu tooltip from being clipped in various viewports. See [#12253](https://github.com/google/site-kit-wp/issues/12253).

[See changelog for all versions](https://raw.githubusercontent.com/google/site-kit-wp/main/changelog.txt).
