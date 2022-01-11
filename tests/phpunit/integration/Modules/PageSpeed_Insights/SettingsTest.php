<?php
/**
 * Class Google\Site_Kit\Tests\Modules\PageSpeed_Insights\SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\PageSpeed_Insights
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\PageSpeed_Insights;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\PageSpeed_Insights\Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group PageSpeed_Insights
 */
class SettingsTest extends SettingsTestCase {

	public function test_get_default() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$this->assertEqualSetsWithIndex(
			array( 'ownerID' => 0 ),
			get_option( Settings::OPTION )
		);
	}

	protected function get_testcase() {
		return $this;
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
