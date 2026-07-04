<?php
/**
 * Plugin Name: Disable client-side media processing
 * Description: MU plugin for disabling client-side media processing during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// Disable client-side media processing allows Puppeteer to
// navigate in headless mode during media uploads.
add_filter( 'wp_client_side_media_processing_enabled', '__return_false' );
