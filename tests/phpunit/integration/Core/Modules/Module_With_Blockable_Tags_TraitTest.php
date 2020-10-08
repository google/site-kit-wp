<?php
/**
 * Class Google\Site_Kit\Tests\Core\Modules\Module_With_Blockable_Tags_TraitTest
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Tests\TestCase;

class Module_With_Blockable_Tags_TraitTest extends TestCase {

	public function test_is_tag_blocked() {
		$module = new FakeModule_With_Tags( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Tag is not blocked by default.
		$this->assertFalse( $module->is_tag_blocked() );

		add_filter( 'googlesitekit_fake-module_tag_blocked', '__return_true' );

		$this->assertTrue( $module->is_tag_blocked() );

		// The return value of the filter is cast to a boolean before returning.
		add_filter( 'googlesitekit_fake-module_tag_blocked', '__return_empty_string' );
		$this->assertFalse( $module->is_tag_blocked() );
	}

	public function test_is_tag_blocked__amp() {
		$module = new FakeModule_With_Tags( $this->get_amp_primary_context() );

		// Tag is not blocked by default.
		$this->assertFalse( $module->is_tag_blocked() );

		add_filter( 'googlesitekit_fake-module_tag_amp_blocked', '__return_true' );

		$this->assertTrue( $module->is_tag_blocked() );
	}

	public function test_get_tag_block_on_consent_attribute() {
		$module = new FakeModule_With_Tags( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Returns empty string by default.
		$this->assertEquals( '', $module->get_tag_block_on_consent_attribute() );

		// Returns attributes to prevent script loading if truthy.
		add_filter( 'googlesitekit_fake-module_tag_block_on_consent', '__return_true' );

		$this->assertEquals( ' type="text/plain" data-block-on-consent', $module->get_tag_block_on_consent_attribute() );
	}

	/**
	 * @dataProvider amp_block_on_consent_attribute_provider
	 * @param mixed  $filter_value Value to return from filter callback.
	 * @param string $expected     Expected return value from method.
	 */
	public function test_get_tag_amp_block_on_consent_attribute( $filter_value, $expected ) {
		$module = new FakeModule_With_Tags( $this->get_amp_primary_context() );

		// Returns empty string by default.
		$this->assertEquals( '', $module->get_tag_amp_block_on_consent_attribute() );

		$filter_callback = function () use ( $filter_value ) {
			return $filter_value;
		};
		add_filter( 'googlesitekit_fake-module_tag_amp_block_on_consent', $filter_callback );

		$this->assertEquals( $expected, $module->get_tag_amp_block_on_consent_attribute() );
	}

	public function amp_block_on_consent_attribute_provider() {
		return array(
			'boolean true'    => array(
				true,
				' data-block-on-consent',
			),
			'_till_responded' => array(
				'_till_responded',
				' data-block-on-consent="_till_responded"',
			),
			'_till_accepted'  => array(
				'_till_accepted',
				' data-block-on-consent="_till_accepted"',
			),
			'_auto_reject'    => array(
				'_auto_reject',
				' data-block-on-consent="_auto_reject"',
			),
			'int 1'           => array(
				1,
				' data-block-on-consent',
			),
			'empty string'    => array(
				'',
				'',
			),
			'string true'     => array(
				'true',
				' data-block-on-consent',
			),
			'string false'    => array(
				'false',
				'',
			),
			'int zero'        => array(
				0,
				'',
			),
			'array'           => array(
				array(),
				'',
			),
		);
	}
}
