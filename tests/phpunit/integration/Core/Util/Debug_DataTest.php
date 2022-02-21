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
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Debug_DataTest extends TestCase {

	public function test_register() {
		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options         = new Options( $context );
		$user_options    = new User_Options( $context );
		$authentication  = new Authentication( $context, $options, $user_options );
		$modules         = new Modules( $context, $options, $user_options, $authentication );
		$dismissed_items = new Dismissed_Items( $user_options );
		$permissions     = new Permissions( $context, $authentication, $modules, $user_options, $dismissed_items );

		$debug_data = new Debug_Data( $context, $options, $user_options, $authentication, $modules, $permissions );
		remove_all_filters( 'debug_information' );

		$debug_data->register();

		$this->assertTrue( has_filter( 'debug_information' ) );

		$info = apply_filters( 'debug_information', array() );
		$this->assertArrayHasKey( 'google-site-kit', $info );

		$this->assertEqualSets(
			array(
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
				'search_console_property',
				'required_scopes',
				'capabilities',
				'enabled_features',
			),
			array_keys( $info['google-site-kit']['fields'] )
		);
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
}
