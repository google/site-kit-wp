/**
 * @since 1.81.0
 *
 * @type {Object} WordPress debug log entries to ignore, keyed by WordPress version.
 */
export const logIgnoreList = {
	'5.2.16': [
		// Deprecated syntax or function calls which are fixed in later WP versions.
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/load.php on line 926',
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/formatting.php on line 2697',
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/formatting.php on line 4803',
		'PHP Deprecated:  Array and string offset access syntax with curly braces is deprecated in /var/www/html/wp-includes/class-wp-editor.php on line 749',
		'PHP Deprecated:  Array and string offset access syntax with curly braces is deprecated in /var/www/html/wp-includes/class-wp-editor.php on line 750',
		'PHP Deprecated:  implode(): Passing glue string after array is deprecated. Swap the parameters in /var/www/html/wp-includes/SimplePie/Parse/Date.php on line 545',
		'PHP Deprecated:  implode(): Passing glue string after array is deprecated. Swap the parameters in /var/www/html/wp-includes/SimplePie/Parse/Date.php on line 546',

		// These are guarded against in later WP versions.
		'PHP Notice:  Trying to access array offset on value of type bool in /var/www/html/wp-admin/includes/update.php on line 673',
		'PHP Notice:  Trying to access array offset on value of type null in /var/www/html/wp-includes/rest-api/class-wp-rest-request.php on line 337',
		'PHP Notice:  Trying to access array offset on value of type bool in /var/www/html/wp-includes/theme.php on line 2360',
	],
	nightly: [
		// Can be removed once WordPress AMP Plugin removes the deprecated function
		// call.
		//
		// See: https://github.com/ampproject/amp-wp/issues/7619
		'PHP Deprecated:  Function _admin_bar_bump_cb is deprecated since version 6.4.0! Use wp_enqueue_admin_bar_bump_styles instead. in /var/www/html/wp-includes/functions.php on line 6032',
	],
};
