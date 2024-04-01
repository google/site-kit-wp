<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Audience_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
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

	public function data_audience_settings() {
		return array(
			'empty by default' => array(
				null,
				array(),
			),
			'non-array - bool' => array(
				false,
				array(),
			),
			'non-array - int'  => array(
				123,
				array(),
			),
			'empty array of configuredAudiences and null isAudienceSegmentationWidgetHidden flag' => array(
				array(
					'configuredAudiences'                => array(),
					'isAudienceSegmentationWidgetHidden' => null,
				),
				array(
					'configuredAudiences' => array(),
				),
			),
			'array of configuredAudiences with non-string elements' => array(
				array( 'configuredAudiences' => array( 'validAudienceResourceName1', false, true, null, array(), 'validAudienceResourceName2', '' ) ),
				array( 'configuredAudiences' => array( 'validAudienceResourceName1', 'validAudienceResourceName2' ) ),
			),
			'array of configuredAudiences and int isAudienceSegmentationWidgetHidden flag' => array(
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => 1,
				),
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => true,
				),
			),
			'array of configuredAudiences and int isAudienceSegmentationWidgetHidden flag' => array(
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => 0,
				),
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => true,
				),
			),
			'array of configuredAudiences and a string isAudienceSegmentationWidgetHidden flag' => array(
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => 'some string',
				),
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => true,
				),
			),
			'array of configuredAudiences and a true isAudienceSegmentationWidgetHidden flag' => array(
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => true,
				),
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => true,
				),
			),
			'array of configuredAudiences and a false isAudienceSegmentationWidgetHidden flag' => array(
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => false,
				),
				array(
					'configuredAudiences'                => array( 'validAudienceResourceName1', 'validAudienceResourceName1' ),
					'isAudienceSegmentationWidgetHidden' => false,
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
		$this->assertEqualSetsWithIndex( $original_settings, $this->audience_settings->get() );

		// Make sure invalid keys aren't set
		$this->audience_settings->merge( array( 'test_key' => 'test_value' ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->audience_settings->get() );

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
		$this->assertEqualSetsWithIndex( $changed_settings, $this->audience_settings->get() );

		// Make sure that we can't set wrong format for the isAudienceSegmentationWidgetHidden property
		$this->audience_settings->set( $original_settings );
		$this->audience_settings->merge( array( 'isAudienceSegmentationWidgetHidden' => null ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->audience_settings->get() );

		// Make sure that we can't set wrong format for the configuredAudiences property
		$this->audience_settings->set( $original_settings );
		$this->audience_settings->merge( array( 'configuredAudiences' => null ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->audience_settings->get() );
	}
}
