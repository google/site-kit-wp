<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Audience_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Audience_SettingsTest extends SettingsTestCase {

	/**
	 * Settings object.
	 *
	 * @var Audience_Settings
	 */
	private $audience_settings;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Admin ID.
	 *
	 * @var int
	 */
	private $user_id;

	public function set_up() {
		parent::set_up();

		$this->options           = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->audience_settings = new Audience_Settings( $this->options );
		$this->user_id           = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $this->user_id );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Audience_Settings::OPTION;
	}

	public function test_get_default() {
		$this->audience_settings->register();

		$default = $this->audience_settings->get_default();

		$this->assertEqualSetsWithIndex(
			array(
				'availableAudiences'                   => null,
				'availableAudiencesLastSyncedAt'       => 0,
				'audienceSegmentationSetupCompletedBy' => null,
			),
			$default
		);
	}

	public function test_get_type() {
		$this->audience_settings->register();

		$this->assertEquals( 'array', $this->audience_settings->get_type() );
	}

	public function test_get_sanitize_callback_with_valid_values() {
		$this->audience_settings->register();

		$this->options->set(
			$this->get_option_name(),
			array(
				'availableAudiences'                   => array( 'test' ),
				'availableAudiencesLastSyncedAt'       => 1,
				'audienceSegmentationSetupCompletedBy' => 1,
			)
		);

		$sanitized_settings = $this->audience_settings->get();

		$this->assertEqualSetsWithIndex(
			array(
				'availableAudiences'                   => array( 'test' ),
				'availableAudiencesLastSyncedAt'       => 1,
				'audienceSegmentationSetupCompletedBy' => 1,
			),
			$sanitized_settings
		);
	}

	public function test_get_sanitize_callback_with_invalid_values() {
		$this->audience_settings->register();

		$this->options->set(
			$this->get_option_name(),
			array(
				'availableAudiences'                   => 1,
				'availableAudiencesLastSyncedAt'       => 'test',
				'audienceSegmentationSetupCompletedBy' => 'test',
			)
		);

		$sanitized_settings = $this->audience_settings->get();

		$this->assertEqualSetsWithIndex(
			array(
				'availableAudiences'                   => null,
				'availableAudiencesLastSyncedAt'       => 0,
				'audienceSegmentationSetupCompletedBy' => null,
			),
			$sanitized_settings
		);
	}

	public function test_merge() {
		$this->audience_settings->register();

		$this->options->set(
			$this->get_option_name(),
			array(
				'availableAudiences'                   => array( 'test' ),
				'availableAudiencesLastSyncedAt'       => 1,
				'audienceSegmentationSetupCompletedBy' => 1,
			)
		);

		$this->audience_settings->merge(
			array(
				'availableAudiences'                   => array( 'test2' ),
				'availableAudiencesLastSyncedAt'       => 2,
				'audienceSegmentationSetupCompletedBy' => 2,
			)
		);

		$settings = $this->audience_settings->get();

		$this->assertEqualSetsWithIndex(
			array(
				'availableAudiences'                   => array( 'test2' ),
				'availableAudiencesLastSyncedAt'       => 2,
				'audienceSegmentationSetupCompletedBy' => 2,
			),
			$settings
		);
	}

	/**
	 * @group 10up
	 */
	public function test_merge_with_invalid_values() {
		$this->audience_settings->register();

		$this->options->set(
			$this->get_option_name(),
			array(
				'availableAudiences'                   => array( 'test' ),
				'availableAudiencesLastSyncedAt'       => 1,
				'audienceSegmentationSetupCompletedBy' => 1,
			)
		);

		$new_settings = $this->audience_settings->merge(
			array(
				'availableAudiences'                   => 1,
				'availableAudiencesLastSyncedAt'       => 'test',
				'audienceSegmentationSetupCompletedBy' => 'test',
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'availableAudiences'                   => null,
				'availableAudiencesLastSyncedAt'       => 0,
				'audienceSegmentationSetupCompletedBy' => null,
			),
			$this->audience_settings->get()
		);
	}
}
