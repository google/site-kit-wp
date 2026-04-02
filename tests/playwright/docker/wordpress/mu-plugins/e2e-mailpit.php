<?php
/**
 * Plugin Name: E2E Tests Mailpit Plugin
 * Description: Utility plugin for forcing Mailpit SMTP mailtrap during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter(
	'wp_mail_from',
	function () {
		return isset( $_COOKIE['_wp_test_db'] )
			? $_COOKIE['_wp_test_db'] . '@example.com'
			: 'admin@example.com';
	}
);

add_filter(
	'wp_mail_from_name',
	function () {
		return 'Site Kit E2E Tests';
	}
);

add_action(
	'phpmailer_init',
	function ( $phpmailer ) {
		$phpmailer->isSMTP();
		$phpmailer->Host       = 'mailpit';
		$phpmailer->Port       = 1025;
		$phpmailer->Username   = 'admin@example.com';
		$phpmailer->Password   = '';
		$phpmailer->SMTPSecure = '';
		$phpmailer->SMTPAuth   = false;
	}
);
