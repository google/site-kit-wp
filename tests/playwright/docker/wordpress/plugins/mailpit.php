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

add_action(
	'phpmailer_init',
	function ( PHPMailer $phpmailer ) {
		$from_name = isset( $_COOKIE['_wp_test_db'] )
			? preg_replace( '/[^a-zA-Z0-9_]/', '_', $_COOKIE['_wp_test_db'] ) . '@example.com'
			: 'admin@example.com';

		$phpmailer->isSMTP();
		$phpmailer->Host       = 'mailpit';
		$phpmailer->Port       = 1025;
		$phpmailer->Username   = 'admin@example.com';
		$phpmailer->Password   = '';
		$phpmailer->From       = $from_name;
		$phpmailer->FromName   = 'Site Kit E2E Tests';
		$phpmailer->SMTPSecure = '';
		$phpmailer->SMTPAuth   = false;
	}
);
