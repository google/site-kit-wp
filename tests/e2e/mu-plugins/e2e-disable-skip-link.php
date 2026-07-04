<?php
/**
 * Plugin Name: Disable Skip Link Script Tag in WP Footer
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

remove_action( 'wp_footer', 'the_block_template_skip_link' );
