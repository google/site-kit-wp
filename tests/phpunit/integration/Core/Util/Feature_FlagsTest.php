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

class Feature_FlagsTest extends TestCase {

	protected static $backup_instance;

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();
		// Preserve the main instance across other tests.
		self::$backup_instance = Feature_Flags::get_instance();
	}

	public static function tearDownAfterClass() {
		if ( self::$backup_instance instanceof Feature_Flags ) {
			Feature_Flags::set_instance( self::$backup_instance );
		}

		parent::tearDownAfterClass();
	}

	public function test_get_mode() {
		// Defaults to 'production'.
		$this->assertEquals( 'production', ( new Feature_Flags( array() ) )->get_mode() );

		// It reads the flag mode from the config.
		$this->assertEquals( 'foo', ( new Feature_Flags( array(), 'foo' ) )->get_mode() );

		// Is filterable.
		$return_custom_mode = function () {
			return 'custom';
		};
		add_filter( 'googlesitekit_flag_mode', $return_custom_mode );
		$this->assertEquals( 'custom', ( new Feature_Flags( array(), 'foo' ) )->get_mode() );

		// Defaults to production if filter returns falsy.
		add_filter( 'googlesitekit_flag_mode', '__return_false' );
		$this->assertEquals( 'production', ( new Feature_Flags( array(), 'foo' ) )->get_mode() );
	}

	/**
	 * @dataProvider data_is_feature_enabled
	 *
	 * @param array   $features
	 * @param array   $mode
	 * @param string  $feature
	 * @param boolean $expected
	 */
	public function test_is_feature_enabled( $features, $mode, $feature, $expected ) {
		$feature_flags = new Feature_Flags( $features, $mode );

		if ( $expected ) {
			$this->assertTrue( $feature_flags->is_feature_enabled( $feature ) );
		} else {
			$this->assertFalse( $feature_flags->is_feature_enabled( $feature ) );
		}
	}

	/**
	 * @dataProvider data_is_feature_enabled
	 *
	 * @param array   $features
	 * @param array   $mode
	 * @param string  $feature
	 * @param boolean $expected
	 */
	public function test_static_enabled( $features, $mode, $feature, $expected ) {
		$feature_flags = new Feature_Flags( $features, $mode );
		Feature_Flags::set_instance( $feature_flags );

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
					'test_feature' => 'production',
				),
				'production',
				'',
				false,
			),
			'non-string truthy feature given'              => array(
				array(
					'test_feature' => 'production',
				),
				'production',
				(object) array( 'foo' => 'bar' ),
				false,
			),
			'feature enabled for production in production' => array(
				array(
					'test_feature' => 'production',
				),
				'production',
				'test_feature',
				true,
			),
			'sub-feature enabled for production in production' => array(
				array(
					'test_feature' => array(
						'sub_feature' => 'production',
					),
				),
				'production',
				'test_feature.sub_feature',
				true,
			),
			'feature enabled for development in production' => array(
				array(
					'test_feature' => 'development',
				),
				'production',
				'test_feature',
				false,
			),
			'sub-feature enabled for development in production' => array(
				array(
					'test_feature' => array(
						'sub_feature' => 'development',
					),
				),
				'production',
				'test_feature.sub_feature',
				false,
			),
			'feature enabled for development and production in development' => array(
				array(
					'test_feature' => array( 'development', 'production' ),
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
								'fourth' => 'test',
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
