<?php
/**
 * Module_With_Owner_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Tests\TestCase_Context_Trait;

trait Module_With_Owner_ContractTests {

	use TestCase_Context_Trait;

	/**
	 * @return Module_With_Owner
	 */
	abstract protected function get_module_with_owner();

	public function test_owner_id() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_owner();

		// By default ownerID is 0.
		$testcase->assertEquals( 0, $module->get_owner_id() );
		$testcase->assertInstanceOf( Module_With_Settings::class, $module );

		$settings = $module->get_settings();
		$testcase->assertInstanceOf( Setting::class, $settings );
		$testcase->assertInstanceOf( Setting_With_Owned_Keys_Interface::class, $settings );

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

		$settings->register();
		$keys = $settings->get_owned_keys();
		$key  = current( $keys );

		$options         = $settings->get();
		$options[ $key ] = 'new-value';
		$settings->set( $options );

		$this->assertEquals( $user_id, $module->get_owner_id() );
	}
}
