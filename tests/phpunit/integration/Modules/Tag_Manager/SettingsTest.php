<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Tag_Manager\Settings
 *
 * @package   Google\Site_Kit\Tests\Modules\Tag_Manager
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Tag_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Tag_Manager\Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group Tag_Manager
 */
class SettingsTest extends SettingsTestCase {

	public function test_get_default() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$default_value = get_option( Settings::OPTION );
		$this->assertEquals( $default_value, $settings->get_default() );

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'      => '',
				'containerID'    => '',
				'ampContainerID' => '',
				'useSnippet'     => true,
			),
			$settings->get_default()
		);
	}

	public function test_legacy_options() {
		$legacy_option = array(
			'account_id'   => 'test-account-id-snake',
			'accountId'    => 'test-account-id-camel',
			'container_id' => 'test-container-id-snake',
			'containerId'  => 'test-container-id-camel',
		);
		update_option( Settings::OPTION, $legacy_option );
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$option = $settings->get();
		$this->assertArraySubset(
			array(
				// The first legacy key for the same new key wins.
				'accountID'   => 'test-account-id-snake',
				'containerID' => 'test-container-id-snake',
			),
			$option
		);

		foreach ( array_keys( $legacy_option ) as $legacy_key ) {
			$this->assertArrayNotHasKey( $legacy_key, $option );
		}
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
