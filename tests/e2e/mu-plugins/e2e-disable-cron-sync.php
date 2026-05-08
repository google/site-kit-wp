<?php
/**
 * Plugin Name: E2E Disable Cron Sync
 * Description: Disable unnecessary cron scheduling during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter(
	'schedule_event',
	function ( $event ) {
		if ( 'googlesitekit_cron_update_remote_features' === $event->hook ) {
			return false;
		}

		return $event;
	}
);
