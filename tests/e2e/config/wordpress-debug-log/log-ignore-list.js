/**
 * @since 1.81.0
 *
 * @type {Object} WordPress debug log entries to ignore, keyed by WordPress version.
 */
export const logIgnoreList = {
	'4.7.19': [
		// Deprecated syntax or function calls which are fixed in later WP versions.
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/formatting.php on line 2426',
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/formatting.php on line 4360',
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/load.php on line 649',
		'PHP Deprecated:  Array and string offset access syntax with curly braces is deprecated in /var/www/html/wp-includes/class-wp-editor.php on line 774',
		'PHP Deprecated:  implode(): Passing glue string after array is deprecated. Swap the parameters in /var/www/html/wp-includes/class-wp-editor.php on line 705',
		'PHP Deprecated:  implode(): Passing glue string after array is deprecated. Swap the parameters in /var/www/html/wp-includes/class-wp-editor.php on line 706',
		'PHP Deprecated:  implode(): Passing glue string after array is deprecated. Swap the parameters in /var/www/html/wp-includes/class-wp-editor.php on line 707',
		'PHP Deprecated:  implode(): Passing glue string after array is deprecated. Swap the parameters in /var/www/html/wp-includes/class-wp-editor.php on line 708',
		'PHP Deprecated:  implode(): Passing glue string after array is deprecated. Swap the parameters in /var/www/html/wp-includes/SimplePie/Parse/Date.php on line 545',
		'PHP Deprecated:  implode(): Passing glue string after array is deprecated. Swap the parameters in /var/www/html/wp-includes/SimplePie/Parse/Date.php on line 546',
		"PHP Deprecated:  The behavior of unparenthesized expressions containing both '.' and '+'/'-' will change in PHP 8: '+'/'-' will take a higher precedence in /var/www/html/wp-admin/includes/class-wp-ajax-upgrader-skin.php on line 103",

		// Undefined variables in compact() are fixed in later WP versions.
		'PHP Notice:  compact(): Undefined variable: context in /var/www/html/wp-includes/post.php on line 3222',
		'PHP Notice:  compact(): Undefined variable: filter in /var/www/html/wp-includes/post.php on line 3222',
		'PHP Notice:  compact(): Undefined variable: ID in /var/www/html/wp-includes/post.php on line 3222',
		'PHP Notice:  compact(): Undefined variable: limits in /var/www/html/wp-includes/class-wp-comment-query.php on line 860',
		'PHP Notice:  compact(): Undefined variable: groupby in /var/www/html/wp-includes/class-wp-comment-query.php on line 860',

		// These calls to count are fixed in later WP versions.
		'PHP Warning:  count(): Parameter must be an array or an object that implements Countable in /var/www/html/wp-admin/includes/template.php on line 1425',
		'PHP Warning:  count(): Parameter must be an array or an object that implements Countable in /var/www/html/wp-includes/kses.php on line 893',

		// These are guarded against in later WP versions.
		'PHP Notice:  Trying to access array offset on value of type bool in /var/www/html/wp-admin/includes/update.php on line 608',
		'PHP Notice:  Trying to access array offset on value of type bool in /var/www/html/wp-includes/theme.php on line 2241',
	],
	'4.9.16': [
		// Deprecated syntax or function calls which are fixed in later WP versions.
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/formatting.php on line 2443',
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/formatting.php on line 4382',
		'PHP Deprecated:  Function get_magic_quotes_gpc() is deprecated in /var/www/html/wp-includes/load.php on line 651',
		'PHP Deprecated:  Array and string offset access syntax with curly braces is deprecated in /var/www/html/wp-includes/class-wp-editor.php on line 730',
		'PHP Deprecated:  Array and string offset access syntax with curly braces is deprecated in /var/www/html/wp-includes/class-wp-editor.php on line 731',
		'PHP Deprecated:  implode(): Passing glue string after array is deprecated. Swap the parameters in /var/www/html/wp-includes/SimplePie/Parse/Date.php on line 545',
		'PHP Deprecated:  implode(): Passing glue string after array is deprecated. Swap the parameters in /var/www/html/wp-includes/SimplePie/Parse/Date.php on line 546',
		"PHP Deprecated:  The behavior of unparenthesized expressions containing both '.' and '+'/'-' will change in PHP 8: '+'/'-' will take a higher precedence in /var/www/html/wp-admin/includes/class-wp-ajax-upgrader-skin.php on line 98",

		// Undefined variables in compact() are fixed in later WP versions.
		'PHP Notice:  compact(): Undefined variable: context in /var/www/html/wp-includes/post.php on line 3390',
		'PHP Notice:  compact(): Undefined variable: filter in /var/www/html/wp-includes/post.php on line 3390',
		'PHP Notice:  compact(): Undefined variable: ID in /var/www/html/wp-includes/post.php on line 3390',
		'PHP Notice:  compact(): Undefined variable: limits in /var/www/html/wp-includes/class-wp-comment-query.php on line 853',
		'PHP Notice:  compact(): Undefined variable: groupby in /var/www/html/wp-includes/class-wp-comment-query.php on line 853',

		// These are guarded against in later WP versions.
		'PHP Notice:  Trying to access array offset on value of type bool in /var/www/html/wp-admin/includes/update.php on line 608',
		'PHP Notice:  Trying to access array offset on value of type null in /var/www/html/wp-includes/rest-api/class-wp-rest-request.php on line 338',
		'PHP Notice:  Trying to access array offset on value of type bool in /var/www/html/wp-includes/theme.php on line 2241',
	],
};
