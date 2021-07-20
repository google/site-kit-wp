<?php
/**
 * Tag_Production_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\Guards
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\Guards {

	use Google\Site_Kit\Core\Tags\Guards\Tag_Production_Guard;
	use Google\Site_Kit\Tests\TestCase;

	class Tag_Production_GuardTest extends TestCase {

		public function test_can_activate_on_older_environments() {
			// Pre WP-5.5.0
			if ( ! function_exists( 'wp_get_environment_type' ) ) {
				$this->markTestSkipped( 'Missing wp_get_environment_type() function.' );
			}
			$tagproduction = new Tag_Production_Guard();
			$this->assertTrue( $tagproduction->can_activate() );

		}

		public function test_can_activate_in_production() {
			// Post WP-5.5.0
			if ( function_exists( 'wp_get_environment_type' ) ) {
				$this->markTestSkipped( 'Testing legacy environments without wp_get_environment_type() function.' );
			}
			$tagproduction = new Tag_Production_Guard();
			$this->assertTrue( $tagproduction->can_activate() );
		}

		public function test_can_not_activate_in_development() {
			// Pre WP-5.5.0
			if ( ! function_exists( 'wp_get_environment_type' ) ) {
				$this->markTestSkipped( 'Missing wp_get_environment_type() function.' );
			}
			$tagproduction                           = new Tag_Production_Guard();
			$GLOBALS['test_wp_get_environment_type'] = 'development';
			$this->assertFalse( $tagproduction->can_activate() );
			unset( $GLOBALS['test_wp_get_environment_type'] );

		}
	}
}

// As we're not able to change the return values of wp_get_environment_type
// We create an implementation for this test so that we can define custom return values.
// @see https://github.com/WordPress/WordPress/blob/f5713b8d717b398efe7de40c869f77543fb2068e/wp-includes/load.php#L195
namespace Google\Site_Kit\Core\Tags\Guards {
	if ( function_exists( 'wp_get_environment_type' ) ) {

		function wp_get_environment_type() {
			return isset( $GLOBALS['test_wp_get_environment_type'] ) ? $GLOBALS['test_wp_get_environment_type'] : \wp_get_environment_type();
		}
	}
}
