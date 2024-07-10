<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Ad_Blocking_Recovery_TagTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group AdSense
 */
class Ad_Blocking_Recovery_TagTest extends SettingsTestCase {

	/**
	 * @var Ad_Blocking_Recovery_Tag
	 */
	private $ad_blocking_recovery_tag;

	private $test_recovery_tag          = 'test-recovery-tag';
	private $test_error_protection_code = 'test-error-protection-code';


	public function set_up() {
		parent::set_up();
		$this->ad_blocking_recovery_tag = new Ad_Blocking_Recovery_Tag( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->ad_blocking_recovery_tag->register();
	}

	public function test_get_default() {
		$this->assertEqualSetsWithIndex(
			array(
				'tag'                   => '',
				'error_protection_code' => '',
			),
			get_option( Ad_Blocking_Recovery_Tag::OPTION )
		);
	}

	public function test_get() {
		update_option(
			Ad_Blocking_Recovery_Tag::OPTION,
			array(
				'tag'                   => $this->test_recovery_tag,
				'error_protection_code' => $this->test_error_protection_code,
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'tag'                   => $this->test_recovery_tag,
				'error_protection_code' => $this->test_error_protection_code,
			),
			$this->ad_blocking_recovery_tag->get()
		);
	}

	/**
	 * @dataProvider data_invalid_values
	 */
	public function test_get_with_invalid_data( $value ) {
		update_option(
			Ad_Blocking_Recovery_Tag::OPTION,
			$value
		);

		$this->assertEqualSetsWithIndex(
			array(
				'tag'                   => '',
				'error_protection_code' => '',
			),
			$this->ad_blocking_recovery_tag->get()
		);
	}

	public function test_set() {
		$this->assertTrue(
			$this->ad_blocking_recovery_tag->set(
				array(
					'tag'                   => $this->test_recovery_tag,
					'error_protection_code' => $this->test_error_protection_code,
				)
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'tag'                   => $this->test_recovery_tag,
				'error_protection_code' => $this->test_error_protection_code,
			),
			get_option( Ad_Blocking_Recovery_Tag::OPTION )
		);
	}

	/**
	 * @dataProvider data_invalid_values
	 *
	 * @param mixed $value
	 */
	public function test_set_invalid_values( $value ) {
		$this->assertFalse( $this->ad_blocking_recovery_tag->set( $value ) );
	}

	public function data_invalid_values() {
		return array(
			'non-array'      => array( 'test' ),
			'empty'          => array( array() ),
			'invalid index'  => array( array( 'foo' => 'bar' ) ),
			'missing index'  => array( array( 'tag' => 'bar' ) ),
			'invalid values' => array(
				array(
					'tag'                   => 1234,
					'error_protection_code' => false,
				),
			),

		);
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Ad_Blocking_Recovery_Tag::OPTION;
	}
}
