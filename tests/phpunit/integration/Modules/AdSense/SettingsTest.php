<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Settings
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\AdSense\Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group AdSense
 */
class SettingsTest extends SettingsTestCase {

	public function test_register_filters() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		update_option( Settings::OPTION, array( 'accountID' => 'saved-account-id' ) );
		$this->assertArraySubset( array( 'accountID' => 'saved-account-id' ), get_option( Settings::OPTION ) );
		add_filter( 'googlesitekit_adsense_account_id', '__return_empty_string' );
		$this->assertArraySubset( array( 'accountID' => 'saved-account-id' ), get_option( Settings::OPTION ) );
		remove_filter( 'googlesitekit_adsense_account_id', '__return_empty_string' );

		add_filter(
			'googlesitekit_adsense_account_id',
			function () {
				return 'filtered-adsense-account-id';
			}
		);
		$this->assertArraySubset( array( 'accountID' => 'filtered-adsense-account-id' ), get_option( Settings::OPTION ) );

		// Default value filtered into saved value.
		$this->assertArraySubset( array( 'useSnippet' => true ), get_option( Settings::OPTION ) );
		update_option( Settings::OPTION, array( 'useSnippet' => false ) );
		// Default respects saved value.
		$this->assertArraySubset( array( 'useSnippet' => false ), get_option( Settings::OPTION ) );
	}

	public function test_get_default() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'            => '',
				'clientID'             => '',
				'accountStatus'        => '',
				'siteStatus'           => '',
				'accountSetupComplete' => false,
				'siteSetupComplete'    => false,
				'useSnippet'           => true,
			),
			get_option( Settings::OPTION )
		);
	}

	public function test_legacy_options() {
		$legacy_option = array(
			'account_id'        => 'test-account-id',
			'account_status'    => 'test-account-status',
			'client_id'         => 'test-client-id',
			'adsenseTagEnabled' => 'test-adsense-tag-enabled',
			'setup_complete'    => 'test-setup-complete',
		);
		update_option( Settings::OPTION, $legacy_option );
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$option = $settings->get();
		$this->assertArraySubset(
			array(
				'accountID'            => 'test-account-id',
				'accountStatus'        => 'test-account-status',
				'clientID'             => 'test-client-id',
				'useSnippet'           => 'test-adsense-tag-enabled',
				'accountSetupComplete' => 'test-setup-complete',
				'siteSetupComplete'    => 'test-setup-complete',
			),
			$option
		);

		foreach ( array_keys( $legacy_option ) as $legacy_key ) {
			$this->assertArrayNotHasKey( $legacy_key, $option );
		}

		// Ensure valid/current keys are not overridden by legacy.
		update_option(
			Settings::OPTION,
			array(
				'account_id' => 'test-legacy-account-id',
				'accountID'  => 'test-current-account-id',
			)
		);
		$option = $settings->get();
		$this->assertEquals( 'test-current-account-id', $option['accountID'] );
		$this->assertArrayNotHasKey( 'account_id', $option );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
