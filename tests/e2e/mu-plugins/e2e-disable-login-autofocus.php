<?php
/**
 * Plugin Name: Disable Login Autofocus
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter( 'enable_login_autofocus', '__return_false' );
