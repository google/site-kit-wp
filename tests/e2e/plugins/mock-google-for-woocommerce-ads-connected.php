<?php
/**
 * Plugin Name: E2E Tests Mock Google for WooCommerce Ads Connected
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Mocks Google for WooCommerce Ads account as connected by overriding the gla_ads_id option.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// Return a truthy value for gla_ads_id to mimic a linked Ads account.
add_filter(
	'pre_option_gla_ads_id',
	function () {
		return true;
	}
);
