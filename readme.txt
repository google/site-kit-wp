=== Site Kit by Google - Analytics, Search Console, AdSense, Speed ===

Contributors:      google
Requires at least: 5.2
Tested up to:      6.8
Requires PHP:      7.4
Stable tag:        1.164.0
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

= 1.164.0 =

**Added**

* Add setting for using Sign in with Google for WordPress comments. See [#11472](https://github.com/google/site-kit-wp/issues/11472).
* Add One-Tap to Sign in with Google setup when user registrations are open. See [#11469](https://github.com/google/site-kit-wp/issues/11469).

**Enhanced**

* Add client side compatibility checks for Sign in with Google. See [#11505](https://github.com/google/site-kit-wp/issues/11505).
* Add ability to load Sign in with Google compatibility checks from Site Kit. See [#11463](https://github.com/google/site-kit-wp/issues/11463).
* Add support for detecting plugins/hosting environments incompatible with Sign in with Google. See [#11458](https://github.com/google/site-kit-wp/issues/11458).
* Add third-party support for the Sign in with Google button via a WordPress Action: `do_action( 'googlesitekit_render_sign_in_with_google_button' )`. See [#11455](https://github.com/google/site-kit-wp/issues/11455).
* Add the email reporting settings selection panel. See [#11424](https://github.com/google/site-kit-wp/issues/11424).
* Add API and data store infrastructure to preserve initial settings accompanying the new setup flow. See [#11387](https://github.com/google/site-kit-wp/issues/11387).
* Add Analytics setup success toast notice in the Key Metrics setup screen. See [#11384](https://github.com/google/site-kit-wp/issues/11384).
* Display the progress indicator on the Analytics setup screen when it's navigated to in the new setup flow. See [#11379](https://github.com/google/site-kit-wp/issues/11379).
* Add the progress indicator to the new version of the splash screen. See [#11378](https://github.com/google/site-kit-wp/issues/11378).
* Add a `ProgressIndicator` component to display progressions in user flows. See [#11377](https://github.com/google/site-kit-wp/issues/11377).
* Redirect users to the Key Metrics setup screen after successfully connecting Analytics when the `setupFlowRefresh` feature flag is enabled. See [#11375](https://github.com/google/site-kit-wp/issues/11375).
* Add Key Metrics setup screen with site purpose questionnaire and dashboard redirection functionality. See [#11374](https://github.com/google/site-kit-wp/issues/11374).
* Implement the foundation for the forthcoming splash screen update. See [#11333](https://github.com/google/site-kit-wp/issues/11333).
* Add a selector to allow users to customize frequency of reports when Proactive User Engagement is enabled. See [#11155](https://github.com/google/site-kit-wp/issues/11155).
* Add the email reporting overlay notification. See [#11147](https://github.com/google/site-kit-wp/issues/11147).
* Add Enhanced Conversions support for Mailchimp for WordPress by capturing and sending user data. See [#11127](https://github.com/google/site-kit-wp/issues/11127).
* Add Enhanced Conversions support for OptinMonster by capturing and sending user data. See [#11126](https://github.com/google/site-kit-wp/issues/11126).
* Add Enhanced Conversions support for Easy Digital Downloads by capturing and sending user data. See [#11011](https://github.com/google/site-kit-wp/issues/11011).
* Add "Learn more" link to Visitor Groups notification banner. See [#10964](https://github.com/google/site-kit-wp/issues/10964).
* Include Reader Revenue Manager in the list of services identified by the unsatisfied scopes alert. See [#10797](https://github.com/google/site-kit-wp/issues/10797).
* Don't show the "How to Improve" tab in the Pagespeed Insights widget when no recommendations are available. See [#7612](https://github.com/google/site-kit-wp/issues/7612).
* Standardize font sizes for Key Metric Widget subheadings. See [#6107](https://github.com/google/site-kit-wp/issues/6107).

**Fixed**

* Fix Reader Revenue Manager setup screen displaying empty content when API errors occur. See [#11581](https://github.com/google/site-kit-wp/issues/11581).
* Add "pinned notifications" to the notifications API, and use it to ensure the Audience Segmentation and Enhanced Measurement setup banners continue to be shown when returning from OAuth. See [#10890](https://github.com/google/site-kit-wp/issues/10890).

[See changelog for all versions](https://raw.githubusercontent.com/google/site-kit-wp/main/changelog.txt).
