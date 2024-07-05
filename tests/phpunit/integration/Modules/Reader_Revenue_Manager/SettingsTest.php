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

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
