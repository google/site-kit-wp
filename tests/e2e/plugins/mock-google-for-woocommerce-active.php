<?php
/**
 * Plugin Name: E2E Tests Mock Google for WooCommerce Active
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Mocks Google for WooCommerce as active for Site Kit E2E tests by defining WC_GLA_VERSION.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

if ( ! defined( 'WC_GLA_VERSION' ) ) {
	define( 'WC_GLA_VERSION', '1.0.0' );
}
