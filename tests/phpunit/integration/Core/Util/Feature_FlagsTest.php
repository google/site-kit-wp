<?php
/**
 * Feature_FlagsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Tests\TestCase;
use ReflectionMethod;

class Feature_FlagsTest extends TestCase {

	public function tear_down() {
		parent::tear_down();
		static::reset_feature_flags();
	}

	public function test_enabled_when_feature_name_is_empty() {
		remove_all_filters( 'googlesitekit_is_feature_enabled' );
		Feature_Flags::set_features(
			array(
				'test_feature',
			)
		);

		$this->assertFalse( Feature_Flags::enabled( '' ) );
	}

	public function test_enabled_when_feature_name_is_non_string() {
		remove_all_filters( 'googlesitekit_is_feature_enabled' );
		Feature_Flags::set_features(
			array(
				'test_feature',
			)
		);

		$feature = (object) array( 'foo' => 'bar' );
		$this->assertFalse( Feature_Flags::enabled( $feature ) );
	}

	public function test_enabled_with_filter() {
		remove_all_filters( 'googlesitekit_is_feature_enabled' );
		Feature_Flags::set_features(
			array(
				'test_feature',
			)
		);

		add_filter(
			'googlesitekit_is_feature_enabled',
			function ( $enabled, $feature_name ) {
				return 'test_feature' === $feature_name;
			},
			10,
			2
		);

		$this->assertTrue( Feature_Flags::enabled( 'test_feature' ) );
	}

	public function test_enabled_without_filter() {
		remove_all_filters( 'googlesitekit_is_feature_enabled' );
		Feature_Flags::set_features(
			array(
				'test_feature',
			)
		);

		$this->assertFalse( Feature_Flags::enabled( 'test_feature' ) );
	}
}
