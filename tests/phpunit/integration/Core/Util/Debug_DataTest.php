<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\Debug_DataTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Debug_DataTest extends TestCase {

	public function test_register() {
		$debug_data = new Debug_Data( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'debug_information' );

		$debug_data->register();

		$this->assertTrue( has_filter( 'debug_information' ) );

		$info = apply_filters( 'debug_information', array() );
		$this->assertArrayHasKey( 'google-site-kit', $info );

		$this->assertEqualSetsWithIndex(
			array(
				'version',
				'php_version',
				'wp_version',
				'amp_mode',
				'site_status',
				'user_status',
				'active_modules',
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
