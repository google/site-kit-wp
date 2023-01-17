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

	const GOOGLE_TAG_IDS = array( 'G-XXXX', 'GT-XXXX', 'AW-XXXX' );
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
				'propertyID'           => '',
				'webDataStreamID'      => '',
				'measurementID'        => '',
				'useSnippet'           => true,
				'ownerID'              => 0,
				'googleTagID'          => '',
				'googleTagAccountID'   => '',
				'googleTagContainerID' => '',
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

			if ( isset( self::VALID_TEST_IDS[ $key ] ) ) {
				$options[ $key ] = self::VALID_TEST_IDS[ $key ];
			} else {
				$options[ $key ] = 'test-value';
			}
			$settings->set( $options );

			$options = get_option( $options_key );
			$testcase->assertEquals( $user_id, $options['ownerID'] );
		}
	}

	public function test_valid_google_tag_id() {
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$options_key = $testcase->get_option_name();
		delete_option( $options_key );

		foreach ( self::GOOGLE_TAG_IDS as $tag_id ) {
			$options                = $settings->get();
			$options['googleTagID'] = $tag_id;
			$settings->set( $options );
			$options = get_option( $options_key );
			$testcase->assertEquals( $tag_id, $options['googleTagID'] );
		}
	}

	public function test_invalid_google_tag_id() {
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$options_key = $testcase->get_option_name();
		delete_option( $options_key );

		$options                = $settings->get();
		$options['googleTagID'] = 'XXX';
		$settings->set( $options );
		$options = get_option( $options_key );
		$testcase->assertEquals( '', $options['googleTagID'] );
	}

	public function data_invalid_account_ids() {
		return array(
			'with invalid string' => array( 'xxxx' ),
			'with invalid number' => array( 0, -1212 ),
		);
	}

	/**
	 * @dataProvider data_invalid_account_ids
	 */
	public function test_invalid_tag_account_id( $invalid_id ) {
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$options_key = $testcase->get_option_name();
		delete_option( $options_key );

		$options                       = $settings->get();
		$options['googleTagAccountID'] = $invalid_id;
		$settings->set( $options );
		$options = get_option( $options_key );
		$testcase->assertEquals( '', $options['googleTagAccountID'] );
	}

	public function test_valid_tag_account_id() {
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$options_key = $testcase->get_option_name();
		delete_option( $options_key );

		$options                       = $settings->get();
		$options['googleTagAccountID'] = self::VALID_TEST_IDS['googleTagAccountID'];
		$settings->set( $options );
		$options = get_option( $options_key );
		$testcase->assertEquals( self::VALID_TEST_IDS['googleTagAccountID'], $options['googleTagAccountID'] );
	}

	/**
	 * @dataProvider data_invalid_account_ids
	 */
	public function test_invalid_google_tag_container_id( $invalid_id ) {
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$options_key = $testcase->get_option_name();
		delete_option( $options_key );

		$options                       = $settings->get();
		$options['googleTagAccountID'] = $invalid_id;
		$settings->set( $options );
		$options = get_option( $options_key );
		$testcase->assertEquals( '', $options['googleTagAccountID'] );
	}

	public function test_valid_google_tag_container_id() {
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$options_key = $testcase->get_option_name();
		delete_option( $options_key );

		$options                         = $settings->get();
		$options['googleTagContainerID'] = self::VALID_TEST_IDS['googleTagContainerID'];
		$settings->set( $options );
		$options = get_option( $options_key );
		$testcase->assertEquals( self::VALID_TEST_IDS['googleTagContainerID'], $options['googleTagContainerID'] );
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
