<?php
/**
 * WordPress DB Drop-in: E2E Test Database Router
 *
 * Routes WordPress database connections to test-specific databases based on a
 * cookie set by Playwright fixtures. This drop-in is loaded at the very
 * beginning of WordPress initialisation — before mu-plugins, before options are
 * read, and before any hooks fire — guaranteeing that the correct database is
 * used for every operation in the request.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

$_e2e_db_name = isset( $_COOKIE['_wp_test_db'] )
	? preg_replace( '/[^a-zA-Z0-9_]/', '_', $_COOKIE['_wp_test_db'] )
	: DB_NAME;

$_e2e_error_level_map = array(
	E_WARNING         => 'E_WARNING',
	E_NOTICE          => 'E_NOTICE',
	E_DEPRECATED      => 'E_DEPRECATED',
	E_STRICT          => 'E_STRICT',
	E_USER_ERROR      => 'E_USER_ERROR',
	E_USER_WARNING    => 'E_USER_WARNING',
	E_USER_NOTICE     => 'E_USER_NOTICE',
	E_USER_DEPRECATED => 'E_USER_DEPRECATED',
);

$wpdb = new wpdb( DB_USER, DB_PASSWORD, $_e2e_db_name, DB_HOST );

// No-op error logger by default.
$_e2e_log_error = function () {};

// Register PHP error handlers to capture errors in a per-test database table.
if ( isset( $_COOKIE['_wp_test_db'] ) ) {
	// Create error log table if it doesn't exist.
	$wpdb->query(
		"CREATE TABLE IF NOT EXISTS `wp_e2e_error_log` (
			`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			`timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
			`level` VARCHAR(50) NOT NULL,
			`message` TEXT NOT NULL,
			`file` VARCHAR(500) NOT NULL DEFAULT '',
			`line` INT UNSIGNED NOT NULL DEFAULT 0,
			`backtrace` TEXT NULL,
			PRIMARY KEY (`id`)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
	);

	// Error logger that logs errors to the database.
	$_e2e_log_error = function ( $level, $message, $file, $line, $backtrace = null ) {
		global $wpdb;
		static $in_handler = false;

		if ( $in_handler ) {
			return;
		}

		$in_handler = true;
		$wpdb->insert(
			'wp_e2e_error_log',
			array(
				'level'     => $level,
				'message'   => $message,
				'file'      => $file,
				'line'      => $line,
				'backtrace' => $backtrace,
			)
		);
		$in_handler = false;
	};
}

// Set error handler to capture errors and log them to the database.
set_error_handler( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler
	function ( $errno, $errstr, $errfile, $errline ) use ( $_e2e_log_error, $_e2e_error_level_map ) {
		$level = isset( $_e2e_error_level_map[ $errno ] )
			? $_e2e_error_level_map[ $errno ]
			: 'E_UNKNOWN(' . $errno . ')';

		$_e2e_log_error( $level, $errstr, $errfile, $errline );

		// Return false so PHP's default error handler still runs.
		return false;
	}
);

// Set exception handler to capture exceptions and log them to the database.
$_e2e_previous_exception_handler = set_exception_handler(
	function ( $e ) use ( $_e2e_log_error, &$_e2e_previous_exception_handler ) {
		$_e2e_log_error(
			'UNCAUGHT_EXCEPTION',
			$e->getMessage(),
			$e->getFile(),
			$e->getLine(),
			$e->getTraceAsString()
		);

		if ( $_e2e_previous_exception_handler ) {
			call_user_func( $_e2e_previous_exception_handler, $e );
		}
	}
);

// Register shutdown function to capture fatal errors and log them to the database.
register_shutdown_function(
	function () use ( $_e2e_log_error ) {
		$error = error_get_last();
		if ( $error && in_array( $error['type'], array( E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR ), true ) ) {
			$level_map = array(
				E_ERROR         => 'E_ERROR',
				E_PARSE         => 'E_PARSE',
				E_CORE_ERROR    => 'E_CORE_ERROR',
				E_COMPILE_ERROR => 'E_COMPILE_ERROR',
			);

			$_e2e_log_error(
				$level_map[ $error['type'] ],
				$error['message'],
				$error['file'],
				$error['line']
			);
		}
	}
);

// Unset variables to avoid polluting the global namespace.
unset( $_e2e_db_name, $_e2e_error_level_map );

// Skip DB upgrade on every request.
add_filter(
	'pre_option_db_version',
	function () {
		global $wp_db_version;
		return $wp_db_version;
	}
);
