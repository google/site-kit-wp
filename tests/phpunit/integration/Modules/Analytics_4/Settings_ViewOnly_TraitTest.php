<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Settings_ViewOnly_TraitTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Core\Storage\Setting_With_ViewOnly_Keys_Trait;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group Analytics
 */
class Settings_ViewOnly_TraitTest extends SettingsTestCase {

	use Setting_With_ViewOnly_Keys_Trait;

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

	/**
	 * @inheritDoc
	 */
	public function get_view_only_keys() {
		return array(
			'propertyID',
		);
	}

	public function set_up() {
		parent::set_up();

		$this->options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->settings = new Settings( $this->options );
	}

	public function test_get_view_only_settings() {
		$this->settings->register();

		$settings = $this->get_view_only_settings();

		$this->assertEqualSetsWithIndex(
			array(
				'propertyID' => '',
			),
			$settings
		);
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}

	/**
	 * Gets Analytics 4 settings.
	 *
	 * @return array Analytics 4 settings, or default if not set.
	 */
	public function get() {
		return $this->options->get( $this->get_option_name() );
	}

}
