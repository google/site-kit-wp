<?php
/**
 * Class Google\Site_Kit\Tests\Core\Modules\Tags\Module_AMP_TagTest
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules\Tags;

use Google\Site_Kit\Tests\Core\Modules\Tags\FakeModule_AMP_Tag;
use Google\Site_Kit\Tests\TestCase;

class Module_AMP_TagTest extends TestCase {

	private $amp_tag;

	private $module_slug;

	public function set_up() {
		parent::set_up();

		$this->module_slug = 'fake-module';
		$this->amp_tag     = new FakeModule_AMP_Tag( 'test-tag-id', $this->module_slug );
	}

	public function test_is_tag_blocked() {
		// Tag is not blocked by default.
		$this->assertFalse( $this->amp_tag->is_tag_blocked() );

		add_filter( "googlesitekit_{$this->module_slug}_tag_amp_blocked", '__return_true' );

		$this->assertTrue( $this->amp_tag->is_tag_blocked() );
	}

	/**
	 * @dataProvider amp_block_on_consent_attribute_provider
	 * @param mixed  $filter_value Value to return from filter callback.
	 * @param string $expected     Expected return value from method.
	 */
	public function test_get_tag_blocked_on_consent_attribute( $filter_value, $expected ) {
		// Returns empty string by default.
		$this->assertEquals( '', $this->amp_tag->get_tag_blocked_on_consent_attribute() );

		$filter_callback = function () use ( $filter_value ) {
			return $filter_value;
		};
		add_filter( "googlesitekit_{$this->module_slug}_tag_amp_block_on_consent", $filter_callback );

		$this->assertEquals( $expected, $this->amp_tag->get_tag_blocked_on_consent_attribute() );
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
