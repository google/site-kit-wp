<?php
/**
 * Feature_FlagsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Tests\TestCase;
use ReflectionMethod;

class Feature_FlagsTest extends TestCase {

	public function setUp() {
		parent::setUp();
		$this->reset_feature_flags();
	}

	public function tearDown() {
		parent::tearDown();
		$this->reset_feature_flags();
	}

	protected function reset_feature_flags() {
		Feature_Flags::set_mode( Feature_Flags::MODE_PRODUCTION );
		Feature_Flags::set_features( array() );
	}

	public function test_get_mode() {
		$method = new ReflectionMethod( Feature_Flags::class, 'get_mode' );
		$method->setAccessible( true );
		$get_mode = function ( ...$args ) use ( $method ) {
			return $method->invoke( null, ...$args );
		};

		// Defaults to 'production'.
		$this->assertEquals( 'production', $get_mode() );

		// It uses the flag mode it's provided.
		Feature_Flags::set_mode( 'foo' );
		$this->assertEquals( 'foo', $get_mode() );

		// Is filterable.
		$return_custom_mode = function () {
			return 'custom';
		};
		add_filter( 'googlesitekit_flag_mode', $return_custom_mode );
		$this->assertEquals( 'custom', $get_mode() );

		// Defaults to production if filter returns falsy.
		add_filter( 'googlesitekit_flag_mode', '__return_false' );
		$this->assertEquals( 'production', $get_mode() );
	}

	/**
	 * @dataProvider data_is_feature_enabled
	 *
	 * @param array   $features
	 * @param string  $mode
	 * @param string  $feature
	 * @param boolean $expected
	 */
	public function test_enabled( $features, $mode, $feature, $expected ) {
		Feature_Flags::set_features( $features );
		Feature_Flags::set_mode( $mode );

		if ( $expected ) {
			$this->assertTrue( Feature_Flags::enabled( $feature ) );
		} else {
			$this->assertFalse( Feature_Flags::enabled( $feature ) );
		}
	}

	public function data_is_feature_enabled() {
		return array(
			'no feature given'                             => array(
				array(
					'test_feature' => array( 'enabled' => 'production' ),
				),
				'production',
				'',
				false,
			),
			'non-string truthy feature given'              => array(
				array(
					'test_feature' => array( 'enabled' => 'production' ),
				),
				'production',
				(object) array( 'foo' => 'bar' ),
				false,
			),
			'feature enabled for production in production' => array(
				array(
					'test_feature' => array( 'enabled' => 'production' ),
				),
				'production',
				'test_feature',
				true,
			),
			'sub-feature enabled for production in production' => array(
				array(
					'test_feature' => array(
						'sub_feature' => array( 'enabled' => 'production' ),
					),
				),
				'production',
				'test_feature.sub_feature',
				true,
			),
			'feature enabled for development in production' => array(
				array(
					'test_feature' => array( 'enabled' => 'development' ),
				),
				'production',
				'test_feature',
				false,
			),
			'sub-feature enabled for development in production' => array(
				array(
					'test_feature' => array(
						'sub_feature' => array( 'enabled' => 'development' ),
					),
				),
				'production',
				'test_feature.sub_feature',
				false,
			),
			'feature enabled for development and production in development' => array(
				array(
					'test_feature' => array(
						'enabled' => array( 'development', 'production' ),
					),
				),
				'development',
				'test_feature',
				true,
			),
			'deeply nested test feature for test in test'  => array(
				array(
					'test_feature' => array(
						'sub_feature' => array(
							'third_level' => array(
								'fourth' => array( 'enabled' => 'test' ),
							),
						),
					),
				),
				'test',
				'test_feature.sub_feature.third_level.fourth',
				true,
			),
		);
	}
}
