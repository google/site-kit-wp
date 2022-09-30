/**
 * @since 1.81.0
 *
 * @type {Object} WordPress debug log entries to ignore, keyed by WordPress version.
 */
export const logIgnoreList = {
	'5.2.16': [
		// Deprecated syntax or function calls which are fixed in later WP versions.
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/load.php on line 926',
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/formatting.php on line 4803',

		// These are guarded against in later WP versions.
		'PHP Notice:  Trying to access array offset on value of type bool in /var/www/html/wp-admin/includes/update.php on line 673',
		'PHP Notice:  Trying to access array offset on value of type null in /var/www/html/wp-includes/rest-api/class-wp-rest-request.php on line 337',
		'PHP Notice:  Trying to access array offset on value of type bool in /var/www/html/wp-includes/theme.php on line 2360',
	],
};
