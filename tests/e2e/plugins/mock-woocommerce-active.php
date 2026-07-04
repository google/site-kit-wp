<?php
/**
 * Plugin Name: E2E Tests Mock WooCommerce Active
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Mocks WooCommerce as active for Site Kit E2E tests by defining the WooCommerce class.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:ignore PSR1.Classes.ClassDeclaration.MissingNamespace
if ( ! class_exists( 'WooCommerce' ) ) {
	// Define a minimal WooCommerce class to indicate activation.
	class WooCommerce {
		public function __construct() {}
	}
}
