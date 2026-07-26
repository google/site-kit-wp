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
				'accountID'                        => '',
				'adsConversionID'                  => '',
				'propertyID'                       => '',
				'webDataStreamID'                  => '',
				'measurementID'                    => '',
				'trackingDisabled'                 => array( 'loggedinUsers' ),
				'useSnippet'                       => true,
				'ownerID'                          => 0,
				'googleTagID'                      => '',
				'googleTagAccountID'               => '',
				'googleTagContainerID'             => '',
				'googleTagContainerDestinationIDs' => null,
				'googleTagLastSyncedAtMs'          => 0,
				'availableCustomDimensions'        => null,
				'propertyCreateTime'               => 0,
				'adSenseLinked'                    => false,
				'adSenseLinkedLastSyncedAt'        => 0,
				'adsLinked'                        => false,
				'adsLinkedLastSyncedAt'            => 0,
				'detectedEvents'                   => array(),
				'lostConversionEventsLastUpdateAt' => 0,
				'newConversionEventsLastUpdateAt'  => 0,
			),
			get_option( Settings::OPTION ),
			'Analytics 4 default settings should match expected values.'
		);
	}

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
		$this->assertEquals( $expected, $options[ $tag ], 'Sanitized Google Tag field should match expected.' );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}

	/**
	 * @dataProvider data_owned_keys
	 */
	public function test_owner_id_is_set_in_settings_when_owned_keys_are_changed( $property_name, $property_value ) {
		delete_option( $this->get_option_name() );

		// Ensure admin user has Permissions::MANAGE_OPTIONS cap regardless of authentication.
		add_filter(
			'map_meta_cap',
			function ( $caps, $cap ) {
				if ( Permissions::MANAGE_OPTIONS === $cap ) {
					return array( 'manage_options' );
				}
				return $caps;
			},
			99,
			2
		);

		$this->settings->register();
		$this->settings->merge( array( $property_name => $property_value ) );

		$this->assertEquals( $this->user_id, $this->settings->get()['ownerID'], 'ownerID should be set to current admin when owned keys change.' );
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

	/**
	 * Test boolean properties sanitization.
	 */
	public function test_sanitize_boolean_properties() {
		$this->settings->register();

		$options_key = $this->get_option_name();
		delete_option( $options_key );

		$test_cases = array(
			array( 'useSnippet', true, true ),
			array( 'useSnippet', false, false ),
			array( 'useSnippet', 1, true ),
			array( 'useSnippet', 0, false ),
			array( 'useSnippet', 'yes', true ),
			array( 'useSnippet', '', false ),
			array( 'adSenseLinked', true, true ),
			array( 'adSenseLinked', false, false ),
			array( 'adsLinked', true, true ),
			array( 'adsLinked', false, false ),
		);

		foreach ( $test_cases as $case ) {
			delete_option( $options_key );
			$options             = $this->settings->get();
			$options[ $case[0] ] = $case[1];
			$this->settings->set( $options );
			$saved_options = get_option( $options_key );
			$this->assertSame( $case[2], $saved_options[ $case[0] ], "Boolean property {$case[0]} should be sanitized correctly." );
		}
	}

	/**
	 * Test Google Tag ID sanitization.
	 */
	public function test_sanitize_google_tag_id() {
		$this->settings->register();

		$options_key = $this->get_option_name();
		delete_option( $options_key );

		$test_cases = array(
			array( 'G-XXXX', 'G-XXXX' ),
			array( 'GT-XXXX', 'GT-XXXX' ),
			array( 'AW-XXXX', 'AW-XXXX' ),
			array( 'G-123456789', 'G-123456789' ),
			array( 'invalid', '' ),
			array( 'G-', '' ),
			array( '', '' ),
			array( 'XX-XXXX', '' ),
		);

		foreach ( $test_cases as $case ) {
			delete_option( $options_key );
			$options                = $this->settings->get();
			$options['googleTagID'] = $case[0];
			$this->settings->set( $options );
			$saved_options = get_option( $options_key );
			$this->assertEquals( $case[1], $saved_options['googleTagID'], "Google Tag ID {$case[0]} should be sanitized to {$case[1]}." );
		}
	}

	/**
	 * Test tracking disabled sanitization.
	 */
	public function test_sanitize_tracking_disabled() {
		$this->settings->register();

		$options_key = $this->get_option_name();
		delete_option( $options_key );

		// Test: loggedinUsers selected should exclude other options.
		$options                     = $this->settings->get();
		$options['trackingDisabled'] = array( 'loggedinUsers', 'someOtherOption' );
		$this->settings->set( $options );
		$saved_options = get_option( $options_key );
		$this->assertEquals( array( 'loggedinUsers' ), $saved_options['trackingDisabled'], 'When loggedinUsers is selected, other options should be excluded.' );

		// Test: other options should be preserved.
		delete_option( $options_key );
		$options                     = $this->settings->get();
		$options['trackingDisabled'] = array( 'option1', 'option2' );
		$this->settings->set( $options );
		$saved_options = get_option( $options_key );
		$this->assertEquals( array( 'option1', 'option2' ), $saved_options['trackingDisabled'], 'Other options should be preserved as array.' );

		// Test: non-array should be converted to array.
		delete_option( $options_key );
		$options                     = $this->settings->get();
		$options['trackingDisabled'] = 'option1';
		$this->settings->set( $options );
		$saved_options = get_option( $options_key );
		$this->assertIsArray( $saved_options['trackingDisabled'], 'trackingDisabled should be converted to array.' );
	}

	/**
	 * Test numeric properties sanitization.
	 */
	public function test_sanitize_numeric_properties() {
		$this->settings->register();

		$options_key = $this->get_option_name();

		$test_cases = array(
			array( 'googleTagAccountID', 123, 123 ),
			array( 'googleTagAccountID', '456', '456' ),
			array( 'googleTagAccountID', 0, '' ),
			array( 'googleTagAccountID', -5, '' ),
			array( 'googleTagAccountID', 'invalid', '' ),
			array( 'googleTagContainerID', 789, 789 ),
			array( 'googleTagContainerID', '101', '101' ),
			array( 'googleTagContainerID', 0, '' ),
			array( 'googleTagContainerID', 'text', '' ),
		);

		foreach ( $test_cases as $case ) {
			delete_option( $options_key );
			$options             = $this->settings->get();
			$options[ $case[0] ] = $case[1];
			$this->settings->set( $options );
			$saved_options = get_option( $options_key );
			$this->assertEquals( $case[2], $saved_options[ $case[0] ], "Numeric property {$case[0]} with value {$case[1]} should be sanitized to {$case[2]}." );
		}
	}

	/**
	 * Test container destination IDs sanitization.
	 */
	public function test_sanitize_container_destination_ids() {
		$this->settings->register();

		$options_key = $this->get_option_name();

		// Test: array should be preserved.
		$options                                     = $this->settings->get();
		$destination_ids                             = array( 'id1', 'id2', 'id3' );
		$options['googleTagContainerDestinationIDs'] = $destination_ids;
		$this->settings->set( $options );
		$saved_options = get_option( $options_key );
		$this->assertEquals( $destination_ids, $saved_options['googleTagContainerDestinationIDs'], 'Array destination IDs should be preserved.' );

		// Test: non-array should be set to null.
		delete_option( $options_key );
		$options                                     = $this->settings->get();
		$options['googleTagContainerDestinationIDs'] = 'not-an-array';
		$this->settings->set( $options );
		$saved_options = get_option( $options_key );
		$this->assertNull( $saved_options['googleTagContainerDestinationIDs'], 'Non-array destination IDs should be set to null.' );
	}

	/**
	 * Test available custom dimensions sanitization.
	 */
	public function test_sanitize_available_custom_dimensions() {
		$this->settings->register();

		$options_key = $this->get_option_name();

		// Test: valid dimensions should be preserved.
		$options                              = $this->settings->get();
		$valid_dimensions                     = array( 'googlesitekit_dimension1', 'googlesitekit_dimension2' );
		$options['availableCustomDimensions'] = $valid_dimensions;
		$this->settings->set( $options );
		$saved_options = get_option( $options_key );
		$this->assertEquals( $valid_dimensions, $saved_options['availableCustomDimensions'], 'Valid dimensions should be preserved.' );

		// Test: invalid dimensions should be filtered out.
		delete_option( $options_key );
		$options                              = $this->settings->get();
		$options['availableCustomDimensions'] = array( 'googlesitekit_valid', 'invalid_dimension', 'googlesitekit_another' );
		$this->settings->set( $options );
		$saved_options = get_option( $options_key );
		$this->assertEquals( array( 'googlesitekit_valid', 'googlesitekit_another' ), $saved_options['availableCustomDimensions'], 'Invalid dimensions should be filtered out.' );

		// Test: non-array should be set to null.
		delete_option( $options_key );
		$options                              = $this->settings->get();
		$options['availableCustomDimensions'] = 'not-an-array';
		$this->settings->set( $options );
		$saved_options = get_option( $options_key );
		$this->assertNull( $saved_options['availableCustomDimensions'], 'Non-array dimensions should be set to null.' );

		// Test: empty array should be preserved.
		delete_option( $options_key );
		$options                              = $this->settings->get();
		$options['availableCustomDimensions'] = array();
		$this->settings->set( $options );
		$saved_options = get_option( $options_key );
		$this->assertEquals( array(), $saved_options['availableCustomDimensions'], 'Empty array should be preserved.' );
	}

	/**
	 * Test timestamp properties sanitization.
	 */
	public function test_sanitize_timestamp_properties() {
		$this->settings->register();

		$options_key = $this->get_option_name();

		$timestamp_properties = array(
			'adSenseLinkedLastSyncedAt',
			'adsLinkedLastSyncedAt',
			'newConversionEventsLastUpdateAt',
			'lostConversionEventsLastUpdateAt',
		);

		foreach ( $timestamp_properties as $property ) {
			// Test: valid integer timestamps.
			delete_option( $options_key );
			$options              = $this->settings->get();
			$options[ $property ] = 1234567890;
			$this->settings->set( $options );
			$saved_options = get_option( $options_key );
			$this->assertEquals( 1234567890, $saved_options[ $property ], "Valid timestamp in {$property} should be preserved." );

			// Test: non-integer should default to 0.
			delete_option( $options_key );
			$options              = $this->settings->get();
			$options[ $property ] = 'invalid';
			$this->settings->set( $options );
			$saved_options = get_option( $options_key );
			$this->assertEquals( 0, $saved_options[ $property ], "Non-integer value in {$property} should default to 0." );

			// Test: string numeric should default to 0.
			delete_option( $options_key );
			$options              = $this->settings->get();
			$options[ $property ] = '12345';
			$this->settings->set( $options );
			$saved_options = get_option( $options_key );
			$this->assertEquals( 0, $saved_options[ $property ], "String numeric value in {$property} should default to 0." );
		}
	}

	/**
	 * Test REST API endpoint sanitization with mixed inputs.
	 */
	public function test_sanitization_via_rest_api() {
		$this->settings->register();

		$options_key = $this->get_option_name();
		delete_option( $options_key );

		// Comprehensive test with multiple properties.
		$mixed_input = array(
			'useSnippet'                       => 'yes',
			'googleTagID'                      => 'G-VALIDID123',
			'googleTagAccountID'               => 999,
			'googleTagContainerID'             => 888,
			'trackingDisabled'                 => array( 'loggedinUsers', 'admin' ),
			'adSenseLinked'                    => 1,
			'adsLinked'                        => 0,
			'googleTagContainerDestinationIDs' => array( 'dest1', 'dest2' ),
			'availableCustomDimensions'        => array( 'googlesitekit_dim1', 'invalid_dim' ),
			'adSenseLinkedLastSyncedAt'        => 1698000000,
			'adsLinkedLastSyncedAt'            => 'not-a-timestamp',
			'newConversionEventsLastUpdateAt'  => 0,
			'lostConversionEventsLastUpdateAt' => 1700000000,
		);

		$this->settings->set( $mixed_input );
		$saved_options = get_option( $options_key );

		$this->assertSame( true, $saved_options['useSnippet'], 'useSnippet should be boolean true.' );
		$this->assertEquals( 'G-VALIDID123', $saved_options['googleTagID'], 'Valid Google Tag ID should be preserved.' );
		$this->assertEquals( 999, $saved_options['googleTagAccountID'], 'Valid account ID should be preserved.' );
		$this->assertEquals( 888, $saved_options['googleTagContainerID'], 'Valid container ID should be preserved.' );
		$this->assertEquals( array( 'loggedinUsers' ), $saved_options['trackingDisabled'], 'loggedinUsers should exclude other options.' );
		$this->assertSame( true, $saved_options['adSenseLinked'], 'adSenseLinked should be boolean true.' );
		$this->assertSame( false, $saved_options['adsLinked'], 'adsLinked should be boolean false.' );
		$this->assertEquals( array( 'dest1', 'dest2' ), $saved_options['googleTagContainerDestinationIDs'], 'Destination IDs array should be preserved.' );
		$this->assertEquals( array( 'googlesitekit_dim1' ), $saved_options['availableCustomDimensions'], 'Only valid dimensions should be preserved.' );
		$this->assertEquals( 1698000000, $saved_options['adSenseLinkedLastSyncedAt'], 'Valid timestamp should be preserved.' );
		$this->assertEquals( 0, $saved_options['adsLinkedLastSyncedAt'], 'Invalid timestamp should default to 0.' );
		$this->assertEquals( 0, $saved_options['newConversionEventsLastUpdateAt'], 'Zero timestamp should be preserved.' );
		$this->assertEquals( 1700000000, $saved_options['lostConversionEventsLastUpdateAt'], 'Valid timestamp should be preserved.' );
	}
}
