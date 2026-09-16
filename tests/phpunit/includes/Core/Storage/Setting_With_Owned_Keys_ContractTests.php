<?php
/**
 * Setting_With_Owned_Keys_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Tests\TestCase_Context_Trait;

trait Setting_With_Owned_Keys_ContractTests {

	use TestCase_Context_Trait;

	/**
	 * @return Setting_With_Owned_Keys_Interface
	 */
	abstract protected function get_setting_with_owned_keys();

	public function test_owner_id_is_set() {
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$user_id = $testcase->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
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

		$options_key = $testcase->get_option_name();
		$fields      = $settings->get_owned_keys();
		foreach ( $fields as $field ) {
			delete_option( $options_key );

			$options = $settings->get();
			$testcase->assertEmpty( $options['ownerID'], 'Settings should have no owner before an owned field is changed.' );

			$options[ $field ] = 'test-value';
			$settings->set( $options );

			$options = get_option( $options_key );
			$testcase->assertEquals( $user_id, $options['ownerID'], 'Current administrator should become the settings owner after changing an owned field.' );
		}
	}

	public function test_owner_id_is_not_set() {
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$user_id = $testcase->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
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

		$options_key = $testcase->get_option_name();

		add_option(
			$options_key,
			array(
				'not-owned-key' => 'old-value',
			)
		);

		$options = $settings->get();
		$testcase->assertEmpty( $options['ownerID'], 'Settings should have no owner before a non-owned field is changed.' );

		$options['not-owned-key'] = 'new-value';
		$settings->set( $options );

		$options = get_option( $options_key );
		$testcase->assertNotEquals( $user_id, $options['ownerID'], 'Changing a non-owned field should not assign settings ownership.' );
	}

	public function test_owner_id_is_not_set_if_user_has_insufficient_permssions() {
		$testcase = $this->get_testcase();
		$settings = $this->get_setting_with_owned_keys();
		$settings->register();

		$user_id = $testcase->factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		$options_key = $testcase->get_option_name();
		$fields      = $settings->get_owned_keys();
		foreach ( $fields as $field ) {
			delete_option( $options_key );

			$options = $settings->get();
			$testcase->assertEmpty( $options['ownerID'], 'Settings should have no owner before an owned field is changed.' );

			$options[ $field ] = 'test-value';
			$settings->set( $options );

			$options = get_option( $options_key );
			$testcase->assertNotEquals( $user_id, $options['ownerID'], 'User without permission to manage options should not become the settings owner.' );
		}
	}
}
