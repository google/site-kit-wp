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
use Google\Site_Kit\Tests\Core\Storage\Setting_With_Owned_Keys_ContractTests;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group Analytics
 */
class SettingsTest extends SettingsTestCase {

	use Setting_With_Owned_Keys_ContractTests;

	const VALID_TEST_IDS = array(
		'googleTagID'          => 'G-XXXX',
		'googleTagAccountID'   => 12121,
		'googleTagContainerID' => 12121,
	);

	public function test_get_default() {

		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

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

	public function test_owner_id_is_set() {
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$user_id = $testcase->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
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

		$options_key = $testcase->get_option_name();
		$keys        = $settings->get_owned_keys();
		foreach ( $keys as $key ) {
			delete_option( $options_key );

			$options = $settings->get();
			$testcase->assertEmpty( $options['ownerID'] );

			if ( array_key_exists( $key, self::VALID_TEST_IDS ) ) {
				$options[ $key ] = self::VALID_TEST_IDS[ $key ];
			} else {
				$options[ $key ] = 'test-value';
			}
			$settings->set( $options );

			$options = get_option( $options_key );
			$testcase->assertEquals( $user_id, $options['ownerID'] );
		}
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
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$options_key = $testcase->get_option_name();
		delete_option( $options_key );

		$options         = $settings->get();
		$options[ $tag ] = $id;
		$settings->set( $options );
		$options = get_option( $options_key );
		$testcase->assertEquals( $expected, $options[ $tag ] );
	}

	protected function get_testcase() {
		return $this;
	}

	protected function get_setting_with_owned_keys() {
		return new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
