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

	public function test_can_activate_on_post_5_5_version() {
		if ( ! function_exists( 'wp_get_environment_type' ) ) {
			// This environment is pre WP-5.5.0 and is skipped.
			$this->markTestSkipped( 'Testing WP5.5.0 or later and skipping due to missing wp_get_environment_type() function.' );
		}
		$tagproduction = new Tag_Environment_Type_Guard();
		$this->assertTrue( $tagproduction->can_activate() );
	}

	public function test_can_activate_on_older_versions() {
		if ( function_exists( 'wp_get_environment_type' ) ) {
			// This environment is WP-5.5.0 or later and is skipped.
			$this->markTestSkipped( 'Testing legacy environments without wp_get_environment_type() function.' );
		}
		$tagproduction = new Tag_Environment_Type_Guard();
		$this->assertTrue( $tagproduction->can_activate() );
	}

	public function test_can_not_activate_in_development() {
		// Pre WP-5.5.0
		if ( ! function_exists( 'wp_get_environment_type' ) ) {
			$this->markTestSkipped( 'Missing wp_get_environment_type() function.' );
		}
		if ( ! function_exists( 'uopz_set_static' ) ) {
			$this->markTestSkipped( 'The uopz extension is not available.' );
		}
		$env_type      = wp_get_environment_type();
		$tagproduction = new Tag_Environment_Type_Guard();
		uopz_set_static( 'wp_get_environment_type', array( 'current_env' => 'development' ) );
		$this->assertFalse( $tagproduction->can_activate() );
		uopz_set_static( 'wp_get_environment_type', array( 'current_env' => $env_type ) );
	}

	public function test_can_activate_in_development() {
		// Pre WP-5.5.0
		if ( ! function_exists( 'wp_get_environment_type' ) ) {
			$this->markTestSkipped( 'Missing wp_get_environment_type() function.' );
		}
		if ( ! function_exists( 'uopz_set_static' ) ) {
			$this->markTestSkipped( 'The uopz extension is not available.' );
		}
		$env_type      = wp_get_environment_type();
		$tagproduction = new Tag_Environment_Type_Guard();
		uopz_set_static( 'wp_get_environment_type', array( 'current_env' => 'development' ) );
		$this->assertFalse( $tagproduction->can_activate() );

		remove_all_filters( 'googlesitekit_allowed_tag_environment_types' );
		add_filter(
			'googlesitekit_allowed_tag_environment_types',
			function ( $allowed_environments ) {
				$allowed_environments[] = 'development';
				return $allowed_environments;
			}
		);
		$this->assertTrue( $tagproduction->can_activate() );

		uopz_set_static( 'wp_get_environment_type', array( 'current_env' => $env_type ) );
	}
}
