<?php
/**
 * Pre_WP_Mail_Skip_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

trait Pre_WP_Mail_Skip_Trait {

	/**
	 * Skips the test if the pre_wp_mail filter (WordPress 5.7+) isn't available.
	 */
	protected function skip_if_pre_wp_mail_unsupported() {
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}
	}
}
