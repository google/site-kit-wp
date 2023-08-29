<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\Debug_DataTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Tests\Core\Modules\FakeModule;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Debug_DataTest extends TestCase {

	public function new_debug_data() {
		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options         = new Options( $context );
		$user_options    = new User_Options( $context );
		$authentication  = new Authentication( $context, $options, $user_options );
		$modules         = new Modules( $context, $options, $user_options, $authentication );
		$dismissed_items = new Dismissed_Items( $user_options );
		$permissions     = new Permissions( $context, $authentication, $modules, $user_options, $dismissed_items );

		$fake_module = new FakeModule( $context, $options, $user_options );
		$fake_module->set_force_active( true ); // necessary to add sharing fields
		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );

		return new Debug_Data( $context, $options, $user_options, $authentication, $modules, $permissions );
	}

	public function test_register() {
		remove_all_filters( 'debug_information' );
		$debug_data = $this->new_debug_data();
		$debug_data->register();

		$this->assertTrue( has_filter( 'debug_information' ) );
	}

	public function test_registered_debug_information() {
		remove_all_filters( 'debug_information' );
		$debug_data = $this->new_debug_data();
		$debug_data->register();

		$info = apply_filters( 'debug_information', array() );
		$this->assertArrayHasKey( 'google-site-kit', $info );

		$this->assertNonConditionalFields( $info );
		$this->assertArrayNotHasKey( 'recoverable_modules', $info['google-site-kit']['fields'] );
		$this->assertNotHasDashboardSharingModuleFields( 'fake-module', $info );
	}

	public function test_registered_debug_information__dashboard_sharing() {
		remove_all_filters( 'debug_information' );
		$debug_data = $this->new_debug_data();
		$debug_data->register();

		$info = apply_filters( 'debug_information', array() );
		$this->assertArrayHasKey( 'google-site-kit', $info );

		$this->assertNonConditionalFields( $info );
		$this->assertArrayHasKey( 'recoverable_modules', $info['google-site-kit']['fields'] );
		$this->assertHasDashboardSharingModuleFields( 'fake-module', $info );
	}

	/**
	 * @dataProvider redacted_debug_value_provider
	 */
	public function test_redact_debug_value( $input, $expected, $mask_start ) {
		$this->assertEquals(
			$expected,
			Debug_Data::redact_debug_value( $input, $mask_start )
		);
	}

	public function redacted_debug_value_provider() {
		return array(
			array(
				'test-value-to-redact',
				'••••••••••••••••dact',
				-4,
			),
			array(
				'test-value-to-redact',
				'test••••••••••••••••',
				4,
			),
			array(
				'test-value-to-redact',
				'••••••••••••••••••••',
				0,
			),
			array(
				array(), // non-scalar
				'',
				-4,
			),
		);
	}

	protected function assertNonConditionalFields( $debug_information ) {
		$non_conditional_keys = array(
			'version',
			'php_version',
			'wp_version',
			'amp_mode',
			'site_status',
			'user_status',
			'verification_status',
			'connected_user_count',
			'active_modules',
			'reference_url',
			'required_scopes',
			'capabilities',
			'enabled_features',
		);
		$actual_keys          = array_keys( $debug_information['google-site-kit']['fields'] );

		$this->assertEqualSets(
			$non_conditional_keys,
			array_intersect( $non_conditional_keys, $actual_keys ),
			'Failed to assert all non-conditional debug info fields are present'
		);
	}

	protected function assertHasDashboardSharingModuleFields( $module_slug, $debug_information ) {
		$sharing_keys = array(
			"{$module_slug}_shared_roles",
			"{$module_slug}_management",
		);
		$actual_keys  = array_keys( $debug_information['google-site-kit']['fields'] );

		$this->assertEqualSets(
			$sharing_keys,
			array_intersect( $sharing_keys, $actual_keys ),
			"Failed to assert that dashboard sharing fields were present for $module_slug"
		);
	}

	protected function assertNotHasDashboardSharingModuleFields( $module_slug, $debug_information ) {
		$sharing_keys = array(
			"{$module_slug}_shared_roles",
			"{$module_slug}_management",
		);
		$actual_keys  = array_keys( $debug_information['google-site-kit']['fields'] );

		$this->assertEmpty(
			array_intersect( $sharing_keys, $actual_keys ),
			"Failed to assert that dashboard sharing fields were not present for $module_slug"
		);
	}
}
