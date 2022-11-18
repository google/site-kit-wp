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
		$fields      = $settings->get_owned_keys();
		foreach ( $fields as $field ) {
			delete_option( $options_key );

			$options = $settings->get();
			$testcase->assertEmpty( $options['ownerID'] );

			if ( 'googleTagID' === $field ) {
				$options[ $field ] = 'G-XXXXXX';
			} else {
				$options[ $field ] = 'test-value';
			}
			$settings->set( $options );

			$options = get_option( $options_key );
			$testcase->assertEquals( $user_id, $options['ownerID'] );
		}
	}

	public function test_validate_google_tag_id() {
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

		$google_tag_ids_valid = array( 'G-XXXX', 'GT-XXXX', 'AW-XXXX' );

		foreach ( $google_tag_ids_valid as $tag_id ) {
			$options                = $settings->get();
			$options['googleTagID'] = $tag_id;
			$settings->set( $options );
			$options = get_option( $options_key );
			$testcase->assertEquals( $tag_id, $options['googleTagID'] );
		}
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
