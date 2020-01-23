<?php
/**
 * Plugin Name: E2E Tests Analytics Existing Tag
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for rendering an existing Analytics tag during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

register_activation_hook(
	__FILE__,
	function () {
		delete_option( 'googlesitekit_e2e_analytics_existing_property_id' );
	}
);

register_deactivation_hook(
	__FILE__,
	function () {
		delete_option( 'googlesitekit_e2e_analytics_existing_property_id' );
	}
);

add_action(
	'wp_print_scripts',
	function () {
		$UA_CODE = get_option( 'googlesitekit_e2e_analytics_existing_property_id' );

		if ( ! $UA_CODE ) {
			return;
		}

		echo <<<HTML
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=$UA_CODE"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '$UA_CODE');
</script>
HTML;
	}
);
