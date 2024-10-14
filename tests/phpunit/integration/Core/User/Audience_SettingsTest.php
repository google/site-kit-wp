<?php
/**
 * Class Google\Site_Kit\Tests\Core\User\Audience_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Audience_Settings;
use Google\Site_Kit\Tests\TestCase;

class Audience_SettingsTest extends TestCase {

	/**
	 * Audience_Settings instance.
	 *
	 * @var Audience_Settings
	 */
	private $audience_settings;

	public function set_up() {
		parent::set_up();
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$meta_key     = $user_options->get_meta_key( Audience_Settings::OPTION );

		unregister_meta_key( 'user', $meta_key );
		// Needed to unregister the instance registered during plugin bootstrap.
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );

		$this->audience_settings = new Audience_Settings( $user_options );

		$this->audience_settings->register();
	}

	public function test_get_default() {
		$this->assertEquals(
			array(
				'configuredAudiences'                => null,
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => false,
			),
			$this->audience_settings->get()
		);
	}

	public function data_audience_settings() {
		return array(
			'empty by default'                             => array(
				null,
				array(),
			),
			'non-array - bool'                             => array(
				false,
				array(),
			),
			'non-array - int'                              => array(
				123,
				array(),
			),
			'array of configuredAudiences with non-string elements' => array(
				array( 'configuredAudiences' => array( 'validAudienceResourceName1', false, true, null, array(), 'validAudienceResourceName2', '' ) ),
				array( 'configuredAudiences' => array( 'validAudienceResourceName1', 'validAudienceResourceName2' ) ),
			),
			'array of configuredAudiences with all string elements' => array(
				array( 'configuredAudiences' => array( 'validAudienceResourceName1', 'validAudienceResourceName2', 'validAudienceResourceName3' ) ),
				array( 'configuredAudiences' => array( 'validAudienceResourceName1', 'validAudienceResourceName2', 'validAudienceResourceName3' ) ),
			),
			'null configuredAudiences setting'             => array(
				array(
					'configuredAudiences' => null,
				),
				array(
					'configuredAudiences' => null,
				),
			),
			'null isAudienceSegmentationWidgetHidden flag' => array(
				array(
					'isAudienceSegmentationWidgetHidden' => null,
				),
				array(),
			),
			'int isAudienceSegmentationWidgetHidden 1 flag' => array(
				array(
					'isAudienceSegmentationWidgetHidden' => 1,
				),
				array(
					'isAudienceSegmentationWidgetHidden' => true,
				),
			),
			'int isAudienceSegmentationWidgetHidden 0 flag' => array(
				array(
					'isAudienceSegmentationWidgetHidden' => 0,
				),
				array(
					'isAudienceSegmentationWidgetHidden' => true,
				),
			),
			'string isAudienceSegmentationWidgetHidden flag' => array(
				array(
					'isAudienceSegmentationWidgetHidden' => 'some string',
				),
				array(
					'isAudienceSegmentationWidgetHidden' => true,
				),
			),
			'true isAudienceSegmentationWidgetHidden flag' => array(
				array(
					'isAudienceSegmentationWidgetHidden' => true,
				),
				array(
					'isAudienceSegmentationWidgetHidden' => true,
				),
			),
			'false isAudienceSegmentationWidgetHidden flag' => array(
				array(
					'isAudienceSegmentationWidgetHidden' => false,
				),
				array(
					'isAudienceSegmentationWidgetHidden' => false,
				),
			),
			'null didSetAudiences flag'                    => array(
				array(
					'didSetAudiences' => null,
				),
				array(),
			),
			'int didSetAudiences 1 flag'                   => array(
				array(
					'didSetAudiences' => 1,
				),
				array(
					'didSetAudiences' => true,
				),
			),
			'int didSetAudiences 0 flag'                   => array(
				array(
					'didSetAudiences' => 0,
				),
				array(
					'didSetAudiences' => true,
				),
			),
			'string didSetAudiences flag'                  => array(
				array(
					'didSetAudiences' => 'some string',
				),
				array(
					'didSetAudiences' => true,
				),
			),
			'true didSetAudiences flag'                    => array(
				array(
					'didSetAudiences' => true,
				),
				array(
					'didSetAudiences' => true,
				),
			),
			'false didSetAudiences flag'                   => array(
				array(
					'didSetAudiences' => false,
				),
				array(
					'didSetAudiences' => false,
				),
			),
			'multiple settings'                            => array(
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', false, 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => 'some string',
					'didSetAudiences'                    => 0,
				),
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => true,
					'didSetAudiences'                    => true,
				),
			),
		);
	}

	/**
	 * @dataProvider data_audience_settings
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		$this->audience_settings->set( $input );
		$this->assertEquals( $expected, $this->audience_settings->get() );
	}

	public function test_merge() {
		$original_settings = array(
			'configuredAudiences'                => array( 'widgetA' ),
			'isAudienceSegmentationWidgetHidden' => false,
		);

		$changed_settings = array(
			'configuredAudiences'                => array( 'widgetB' ),
			'isAudienceSegmentationWidgetHidden' => true,
		);

		// Make sure settings can be updated even without having them set initially
		$this->audience_settings->merge( $original_settings );
		$this->assertEqualSetsWithIndex(
			array_merge(
				$original_settings,
				array(
					// `didSetAudiences` should be set to true when configuredAudiences is set to a non-empty array.
					'didSetAudiences' => true,
				)
			),
			$this->audience_settings->get()
		);

		// Make sure invalid keys aren't set
		$this->audience_settings->merge( array( 'test_key' => 'test_value' ) );
		$this->assertEqualSetsWithIndex(
			array_merge(
				$original_settings,
				array(
					'didSetAudiences' => true,
				)
			),
			$this->audience_settings->get()
		);

		// Make sure that we can update settings partially
		$this->audience_settings->set( $original_settings );
		$this->audience_settings->merge( array( 'isAudienceSegmentationWidgetHidden' => true ) );
		$this->assertEqualSetsWithIndex(
			array(
				'configuredAudiences'                => $original_settings['configuredAudiences'],
				'isAudienceSegmentationWidgetHidden' => true,
			),
			$this->audience_settings->get()
		);

		// Make sure that we can update all settings at once
		$this->audience_settings->set( $original_settings );
		$this->audience_settings->merge( $changed_settings );
		$this->assertEqualSetsWithIndex(
			array_merge(
				$changed_settings,
				array(
					'didSetAudiences' => true,
				)
			),
			$this->audience_settings->get()
		);

		// Make sure that we can't set wrong format (or `null`) for the isAudienceSegmentationWidgetHidden property
		$this->audience_settings->set( $original_settings );
		$this->audience_settings->merge( array( 'isAudienceSegmentationWidgetHidden' => null ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->audience_settings->get() );

		// Make sure that we can't set wrong format for the configuredAudiences property.
		$this->audience_settings->set( $original_settings );
		$this->audience_settings->merge( array( 'configuredAudiences' => false ) );
		$this->assertEqualSetsWithIndex(
			array_merge(
				$original_settings,
				array(
					'configuredAudiences' => array(),
				)
			),
			$this->audience_settings->get()
		);

		// Make sure we can set `null` for the configuredAudiences property.
		$this->audience_settings->set( $original_settings );
		$this->audience_settings->merge( array( 'configuredAudiences' => null ) );
		$this->assertEqualSetsWithIndex(
			array_merge(
				$original_settings,
				array(
					'configuredAudiences' => null,
				)
			),
			$this->audience_settings->get()
		);
	}

	public function test_merge__did_set_audiences() {
		// Verify that the `didSetAudiences` flag is not set when configuredAudiences is set to an empty array.
		$this->audience_settings->merge( array( 'configuredAudiences' => array() ) );
		$this->assertEqualSetsWithIndex(
			array(
				'configuredAudiences'                => array(),
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => false,
			),
			$this->audience_settings->get()
		);

		// Verify that the `didSetAudiences` flag is set when configuredAudiences is set to a non-empty array.
		$this->audience_settings->merge( array( 'configuredAudiences' => array( 'widgetA' ) ) );
		$this->assertEqualSetsWithIndex(
			array(
				'configuredAudiences'                => array( 'widgetA' ),
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => true,
			),
			$this->audience_settings->get()
		);

		// Verify that `didSetAudiences` retains its value when `configuredAudiences` is updated to an empty array.
		$this->audience_settings->merge( array( 'configuredAudiences' => array() ) );
		$this->assertEqualSetsWithIndex(
			array(
				'configuredAudiences'                => array(),
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => true,
			),
			$this->audience_settings->get()
		);

		// Make sure that we can't set wrong format (or `null`) for the
		// `didSetAudiences` property.
		$this->audience_settings->merge( array( 'didSetAudiences' => null ) );
		$this->assertEqualSetsWithIndex(
			array(
				'configuredAudiences'                => array(),
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => true,
			),
			$this->audience_settings->get()
		);
	}
}
