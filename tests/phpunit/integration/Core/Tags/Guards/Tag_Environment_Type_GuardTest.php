<?php
/**
 * Tag_Environment_Type_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\Guards
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\Guards;

use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Tests\TestCase;

class Tag_Environment_Type_GuardTest extends TestCase {

	public function tear_down() {
		remove_all_filters( 'googlesitekit_allowed_tag_environment_types' );
		parent::tear_down();
	}

	public function test_can_activate_on_post_5_5_version() {
		if ( ! function_exists( 'wp_get_environment_type' ) ) {
			// This environment is pre WP-5.5.0 and is skipped.
			$this->markTestSkipped( 'Testing WP5.5.0 or later and skipping due to missing wp_get_environment_type() function.' );
		}
		$tagproduction = new Tag_Environment_Type_Guard();
		$this->assertTrue( $tagproduction->can_activate(), 'Tag should be able to activate on post 5.5 version.' );
	}

	public function test_can_activate_on_older_versions() {
		if ( function_exists( 'wp_get_environment_type' ) ) {
			// This environment is WP-5.5.0 or later and is skipped.
			$this->markTestSkipped( 'Testing legacy environments without wp_get_environment_type() function.' );
		}
		$tagproduction = new Tag_Environment_Type_Guard();
		$this->assertTrue( $tagproduction->can_activate(), 'Tag should be able to activate on older versions.' );
	}

	public function test_can_not_activate_when_current_environment_is_not_allowed() {
		// Pre WP-5.5.0.
		if ( ! function_exists( 'wp_get_environment_type' ) ) {
			$this->markTestSkipped( 'Missing wp_get_environment_type() function.' );
		}

		$current_env = wp_get_environment_type();

		add_filter(
			'googlesitekit_allowed_tag_environment_types',
			function () use ( $current_env ) {
				return array_values(
					array_diff( array( 'local', 'development', 'staging', 'production' ), array( $current_env ) )
				);
			}
		);

		$tagproduction = new Tag_Environment_Type_Guard();
		$this->assertFalse( $tagproduction->can_activate(), 'Tag should not be able to activate when the current environment is not allowed.' );
	}

	public function test_can_activate_when_current_environment_is_allowed() {
		// Pre WP-5.5.0.
		if ( ! function_exists( 'wp_get_environment_type' ) ) {
			$this->markTestSkipped( 'Missing wp_get_environment_type() function.' );
		}

		$current_env = wp_get_environment_type();

		add_filter(
			'googlesitekit_allowed_tag_environment_types',
			function () use ( $current_env ) {
				return array( $current_env );
			}
		);

		$tagproduction = new Tag_Environment_Type_Guard();
		$this->assertTrue( $tagproduction->can_activate(), 'Tag should be able to activate when the current environment is allowed.' );
	}
}
