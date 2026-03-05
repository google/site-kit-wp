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
		$phpmailer->isSMTP();
		$phpmailer->Host       = 'mailpit';
		$phpmailer->Port       = 1025;
		$phpmailer->Username   = 'email@xyz.com';
		$phpmailer->Password   = '';
		$phpmailer->From       = 'email@xyz.com';
		$phpmailer->FromName   = 'Site Kit E2E Tests';
		$phpmailer->SMTPSecure = '';
		$phpmailer->SMTPAuth   = false;
	}
);
