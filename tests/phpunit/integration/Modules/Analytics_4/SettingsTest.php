<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group Analytics
 */
class SettingsTest extends SettingsTestCase {

	const VALID_TEST_IDS = array(
		'googleTagID'          => 'G-XXXX',
		'googleTagAccountID'   => 12121,
		'googleTagContainerID' => 12121,
	);

	/**
	 * Settings object.
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Admin ID.
	 *
	 * @var int
	 */
	private $user_id;

	public function set_up() {
		parent::set_up();

		$this->options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->settings = new Settings( $this->options );
		$this->user_id  = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $this->user_id );
	}

	public function test_get_default() {
		$this->settings->register();

		$this->assertEqualSetsWithIndex(
			array(
				// TODO: These can be uncommented when Analytics and Analytics 4 modules are officially separated.
				// 'accountID'       => '',
				// 'adsConversionID' => '',
				'propertyID'              => '',
				'webDataStreamID'         => '',
				'measurementID'           => '',
				'useSnippet'              => true,
				'ownerID'                 => 0,
				'googleTagID'             => '',
				'googleTagAccountID'      => '',
				'googleTagContainerID'    => '',
				'googleTagLastSyncedAtMs' => 0,
			),
			get_option( Settings::OPTION )
		);
	}

	// public function test_get_default__news_key_metrics() {
	// 	$this->enable_feature( 'newsKeyMetrics' );
	// 	$this->settings->register();

	// 	$this->assertEqualSetsWithIndex(
	// 		array(
	// 			// TODO: These can be uncommented when Analytics and Analytics 4 modules are officially separated.
	// 			// 'accountID'              => '',
	// 			// 'adsConversionID'        => '',
	// 			'propertyID'                => '',
	// 			'webDataStreamID'           => '',
	// 			'measurementID'             => '',
	// 			'useSnippet'                => true,
	// 			'ownerID'                   => 0,
	// 			'googleTagID'               => '',
	// 			'googleTagAccountID'        => '',
	// 			'googleTagContainerID'      => '',
	// 			'googleTagLastSyncedAtMs'   => 0,
	// 			'availableCustomDimensions' => null,
	// 		),
	// 		get_option( Settings::OPTION )
	// 	);
	// }

	public function data_tag_ids() {
		return array(
			'googleTagID is valid G-XXXX string'           => array( 'googleTagID', 'G-XXXX', 'G-XXXX' ),
			'googleTagID is valid GT-XXXX string'          => array( 'googleTagID', 'GT-XXXX', 'GT-XXXX' ),
			'googleTagID is valid AW-XXXX string'          => array( 'googleTagID', 'AW-XXXX', 'AW-XXXX' ),
			'googleTagAccountID is valid numeric string'   => array( 'googleTagAccountID', 12121, 12121 ),
			'googleTagContainerID is valid numeric string' => array( 'googleTagContainerID', 12121, 12121 ),
			'googleTagID is invalid string'                => array( 'googleTagID', 'xxxx', '' ),
			'googleTagID is invalid number'                => array( 'googleTagID', 12121, '' ),
			'googleTagAccountID is invalid string'         => array( 'googleTagAccountID', 'xxxx', '' ),
			'googleTagAccountID is invalid number'         => array( 'googleTagAccountID', 0, '' ),
			'googleTagContainerID is invalid string'       => array( 'googleTagContainerID', 'xxxx', '' ),
			'googleTagContainerID is invalid number'       => array( 'googleTagContainerID', 0, '' ),
		);
	}

	/**
	 * @dataProvider data_tag_ids
	 */
	public function test_google_tag_ids( $tag, $id, $expected ) {
		$this->settings->register();

		$options_key = $this->get_option_name();
		delete_option( $options_key );

		$options         = $this->settings->get();
		$options[ $tag ] = $id;
		$this->settings->set( $options );
		$options = get_option( $options_key );
		$this->assertEquals( $expected, $options[ $tag ] );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}

	public function test_owner_id_is_taken_from_analytics_settings() {
		delete_option( Analytics_Settings::OPTION );

		$this->settings->register();

		$analytics_settings = new Analytics_Settings( $this->options );
		$analytics_settings->register();
		$analytics_settings->merge( array( 'ownerID' => $this->user_id ) );
		$this->assertEquals( $this->user_id, $analytics_settings->get()['ownerID'] );

		$options = $this->settings->get();
		$this->assertEquals( $this->user_id, $options['ownerID'] );
	}

	/**
	 * @dataProvider data_owned_keys
	 */
	public function test_owner_id_is_set_in_analytics_settings_when_owned_keys_are_changed_in_analytics_4( $property_name, $property_value ) {
		delete_option( Analytics_Settings::OPTION );

		// Ensure admin user has Permissions::MANAGE_OPTIONS cap regardless of authentication.
		add_filter(
			'map_meta_cap',
			function( $caps, $cap ) {
				if ( Permissions::MANAGE_OPTIONS === $cap ) {
					return array( 'manage_options' );
				}
				return $caps;
			},
			99,
			2
		);

		$analytics_settings = new Analytics_Settings( $this->options );
		$analytics_settings->register();
		$this->assertEquals( 0, $analytics_settings->get()['ownerID'] );

		$this->settings->register();
		$this->settings->merge( array( $property_name => $property_value ) );

		$this->assertEquals( $this->user_id, $analytics_settings->get()['ownerID'] );
	}

	public function data_owned_keys() {
		$tests = array();
		$keys  = ( new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) ) )->get_owned_keys();

		foreach ( $keys as $key ) {
			$value = '12345';
			if ( array_key_exists( $key, self::VALID_TEST_IDS ) ) {
				$value = self::VALID_TEST_IDS[ $key ];
			}

			$tests[ $key ] = array( $key, $value );
		}

		return $tests;
	}

}
