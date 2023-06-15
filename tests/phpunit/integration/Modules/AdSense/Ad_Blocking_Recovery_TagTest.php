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

	private $test_revcory_tag              = 'test-recovery-tag';
	private $encoded_recovery_tag          = 'dGVzdC1yZWNvdmVyeS10YWc='; // base64 encode( $this->test_revcory_tag )
	private $test_error_protection_code    = 'test-error-protection-code';
	private $encoded_error_protection_code = 'dGVzdC1lcnJvci1wcm90ZWN0aW9uLWNvZGU='; // base64 encode( $this->test_error_protection_code )


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
				'tag'                   => $this->encoded_recovery_tag,
				'error_protection_code' => $this->encoded_error_protection_code,
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'tag'                   => $this->test_revcory_tag,
				'error_protection_code' => $this->test_error_protection_code,
			),
			$this->ad_blocking_recovery_tag->get()
		);

		$this->assertEqualSetsWithIndex(
			array(
				'tag'                   => $this->encoded_recovery_tag,
				'error_protection_code' => $this->encoded_error_protection_code,
			),
			get_option( Ad_Blocking_Recovery_Tag::OPTION )
		);
	}

	public function test_get_with_invalid_data() {
		update_option(
			Ad_Blocking_Recovery_Tag::OPTION,
			array(
				'tag'                   => 'inv@lid', // invalid base64 encoded string
				'error_protection_code' => 'inv@lid', // invalid base64 encoded string
			)
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
					'tag'                   => $this->test_revcory_tag,
					'error_protection_code' => $this->test_error_protection_code,
				)
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'tag'                   => $this->test_revcory_tag,
				'error_protection_code' => $this->test_error_protection_code,
			),
			$this->ad_blocking_recovery_tag->get()
		);

		$this->assertEqualSetsWithIndex(
			array(
				'tag'                   => $this->encoded_recovery_tag,
				'error_protection_code' => $this->encoded_error_protection_code,
			),
			get_option( Ad_Blocking_Recovery_Tag::OPTION )
		);
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Ad_Blocking_Recovery_Tag::OPTION;
	}
}
