=== Site Kit by Google - Analytics, Search Console, AdSense, Speed ===

Contributors:      google
Requires at least: 5.2
Tested up to:      6.8
Requires PHP:      7.4
Stable tag:        1.165.0
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

= 1.165.0 =

**Added**

* Add support for using Sign in with Google for WordPress user comments. See [#11478](https://github.com/google/site-kit-wp/issues/11478).
* Add new “Enable Sign in with Google for user comments” Sign in with Google setting to Site Health. See [#11477](https://github.com/google/site-kit-wp/issues/11477).
* Add the "Show next to comments" toggle to the Sign in with Google setup form. See [#11476](https://github.com/google/site-kit-wp/issues/11476).
* Add developer documentation to the Sign in with Google action. See [#11446](https://github.com/google/site-kit-wp/issues/11446).

**Enhanced**

* Implement GA4 tracking events for Enhanced Conversions notifications. See [#11644](https://github.com/google/site-kit-wp/issues/11644).
* Decouple Enhanced Conversions from the Ads module; send user data when any gtag-using service is connected (Ads, Analytics, or Tag Manager). See [#11600](https://github.com/google/site-kit-wp/issues/11600).
* Add feature metrics tracking for SiwG and Enhanced Conversions. See [#11572](https://github.com/google/site-kit-wp/issues/11572).
* Synchronise audiences and custom dimensions on the Key Metrics setup screen. See [#11386](https://github.com/google/site-kit-wp/issues/11386).
* Automatically set up Audience Segmentation when landing on the dashboard in the new Analytics setup flow. See [#11385](https://github.com/google/site-kit-wp/issues/11385).
* Add redirection to Key Metrics setup after successful Analytics account creation as part of the new setup flow. See [#11381](https://github.com/google/site-kit-wp/issues/11381).
* Display the progress indicator on the Key Metrics setup screen when it's navigated to in the new setup flow. See [#11380](https://github.com/google/site-kit-wp/issues/11380).
* Add "Exit setup" button to the splash screen header when `setupFlowRefresh` feature flag is enabled. See [#11337](https://github.com/google/site-kit-wp/issues/11337).
* Add info tooltip below the Sign in with Google CTA on the splash screen to explain why Google account connection is required. See [#11335](https://github.com/google/site-kit-wp/issues/11335).
* Add a "Recommended" badge below the Analytics checkbox on the new splash screen. See [#11334](https://github.com/google/site-kit-wp/issues/11334).
* Create setup email reports notice component. See [#11144](https://github.com/google/site-kit-wp/issues/11144).
* Add PUE settings section to the Admin settings screen. See [#11141](https://github.com/google/site-kit-wp/issues/11141).
* Add Enhanced Conversions notification components for Ads and Analytics modules. See [#11018](https://github.com/google/site-kit-wp/issues/11018).
* Fix bug that caused Sign in with Google button not to redirect the user to the page they signed in from. See [#10487](https://github.com/google/site-kit-wp/issues/10487).
* Set a max-width on the Sign in with Google button. See [#10476](https://github.com/google/site-kit-wp/issues/10476).
* Add support for block styling and custom HTML classes for the Sign in with Google block. See [#10475](https://github.com/google/site-kit-wp/issues/10475).
* Add support for Sign in with Google button using a shortcode (`site_kit_sign_in_with_google`). See [#10150](https://github.com/google/site-kit-wp/issues/10150).

**Changed**

* Display warning when incompatible plugin/other issues are detected after Sign in with Google is set up. See [#11457](https://github.com/google/site-kit-wp/issues/11457).

**Fixed**

* Prevent empty fields being sent in user data for Enhanced Conversion events. See [#11626](https://github.com/google/site-kit-wp/issues/11626).
* Fix bug that could cause Sign in with Google client ID not to be persisted. See [#11611](https://github.com/google/site-kit-wp/issues/11611).
* Fix inconsistent plugin conversion tracking label in the Ads settings view. See [#11588](https://github.com/google/site-kit-wp/issues/11588).
* Fix phone number classification in Enhanced Conversions to disregard false positives. See [#11484](https://github.com/google/site-kit-wp/issues/11484).
* Fix visual bug in visitor group slide-over panel. See [#10991](https://github.com/google/site-kit-wp/issues/10991).

[See changelog for all versions](https://raw.githubusercontent.com/google/site-kit-wp/main/changelog.txt).
