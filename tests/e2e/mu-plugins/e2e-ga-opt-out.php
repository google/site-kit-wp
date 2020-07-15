<?php
/**
 * Plugin Name: E2E GA Opt-out
 * Description: Opts-out of GA measurement for E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

$print_ga_opt_out = function () {
	?>
<script type="text/javascript">window["_gaUserPrefs"] = { ioo : function() { return true; } }</script>
	<?php
};
add_action( 'admin_head', $print_ga_opt_out, -99 );
add_action( 'login_head', $print_ga_opt_out, -99 );
add_action( 'wp_head',    $print_ga_opt_out, -99 );
unset( $print_ga_opt_out );
