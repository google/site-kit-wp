<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group RRM
 */
class SettingsTest extends SettingsTestCase {
	/**
	 * Settings object.
	 *
	 * @var Settings
	 */
	private $settings;

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

		$this->options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->settings = new Settings( $this->options );
		$this->user_id  = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $this->user_id );
	}

	public function test_get_default() {
		$this->settings->register();

		$this->assertEqualSetsWithIndex(
			array(
				'publicationID'                            => '',
				'publicationOnboardingState'               => '',
				'publicationOnboardingStateLastSyncedAtMs' => 0,
			),
			get_option( Settings::OPTION )
		);
	}

	public function test_view_only_keys() {
		$this->assertIsArray( $this->settings->get_view_only_keys() );
		$this->assertEmpty( $this->settings->get_view_only_keys() );
	}

	public function data_publication_settings() {
		return array(
			'publicationID is valid string'                => array( 'publicationID', 'ABCD1234', 'ABCD1234' ),
			'publicationOnboardingState is valid string'   => array( 'publicationOnboardingState', 'PENDING_VERIFICATION', 'PENDING_VERIFICATION' ),
			'publicationOnboardingStateLastSyncedAtMs is valid' => array( 'publicationOnboardingStateLastSyncedAtMs', 0, 0 ),
			'publicationID is invalid string'              => array( 'publicationID', 'ABCD1234&^##', '' ),
			'publicationOnboardingState is invalid string' => array( 'publicationOnboardingState', 'INVALID_STATE', '' ),
			'publicationOnboardingStateLastSyncedAtMs is invalid' => array( 'publicationOnboardingStateLastSyncedAtMs', 0.87686, 0 ),
		);
	}

	/**
	 * @dataProvider data_publication_settings
	 */
	public function test_reader_revenue_manager_settings_sanitization( $setting, $value, $expected_value ) {
		$this->settings->register();

		$options_key = $this->get_option_name();
		delete_option( $options_key );

		$options             = $this->settings->get();
		$options[ $setting ] = $value;
		$this->settings->set( $options );
		$options = get_option( $options_key );
		$this->assertEquals( $expected_value, $options[ $setting ] );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
