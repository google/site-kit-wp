<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Settings
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\AdSense\Settings;
use Google\Site_Kit\Tests\Core\Storage\Setting_With_Owned_Keys_ContractTests;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group AdSense
 */
class SettingsTest extends SettingsTestCase {

	use Setting_With_Owned_Keys_ContractTests;

	public function test_register_filters() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		update_option( Settings::OPTION, array( 'accountID' => 'saved-account-id' ) );
		$this->assertArrayIntersection( array( 'accountID' => 'saved-account-id' ), get_option( Settings::OPTION ), 'Saved accountID should be present in option.' );
		add_filter( 'googlesitekit_adsense_account_id', '__return_empty_string' );
		$this->assertArrayIntersection( array( 'accountID' => 'saved-account-id' ), get_option( Settings::OPTION ), 'Filter returning empty should not override saved accountID.' );
		remove_filter( 'googlesitekit_adsense_account_id', '__return_empty_string' );

		add_filter(
			'googlesitekit_adsense_account_id',
			function () {
				return 'filtered-adsense-account-id';
			}
		);
		$this->assertArrayIntersection( array( 'accountID' => 'filtered-adsense-account-id' ), get_option( Settings::OPTION ), 'Filter should override accountID value.' );

		// Default value filtered into saved value.
		$this->assertArrayIntersection( array( 'useSnippet' => true ), get_option( Settings::OPTION ), 'Default filtered useSnippet should be true.' );
		update_option( Settings::OPTION, array( 'useSnippet' => false ) );
		// Default respects saved value.
		$this->assertArrayIntersection( array( 'useSnippet' => false ), get_option( Settings::OPTION ), 'Saved useSnippet should be respected over default.' );
	}

	public function test_get_default() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'                         => '',
				'clientID'                          => '',
				'accountStatus'                     => '',
				'siteStatus'                        => '',
				'accountSetupComplete'              => false,
				'siteSetupComplete'                 => false,
				'useSnippet'                        => true,
				'ownerID'                           => 0,
				'webStoriesAdUnit'                  => '',
				'autoAdsDisabled'                   => array(),
				'setupCompletedTimestamp'           => null,
				'useAdBlockingRecoverySnippet'      => false,
				'useAdBlockingRecoveryErrorSnippet' => false,
				'adBlockingRecoverySetupStatus'     => '',
			),
			get_option( Settings::OPTION ),
			'Default AdSense settings should match expected structure and values.'
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
		$this->assertArrayIntersection(
			array(
				'accountID'            => 'test-account-id',
				'accountStatus'        => 'test-account-status',
				'clientID'             => 'test-client-id',
				'useSnippet'           => 'test-adsense-tag-enabled',
				'accountSetupComplete' => 'test-setup-complete',
				'siteSetupComplete'    => 'test-setup-complete',
			),
			$option,
			'Legacy options should be mapped to current keys.'
		);

		foreach ( array_keys( $legacy_option ) as $legacy_key ) {
			$this->assertArrayNotHasKey( $legacy_key, $option, 'Legacy key should not be present in current option.' );
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
		$this->assertEquals( 'test-current-account-id', $option['accountID'], 'Current accountID should override legacy key.' );
		$this->assertArrayNotHasKey( 'account_id', $option, 'Legacy account_id should not be present when current key is set.' );
	}

	public function test_setup_completed_timestamp__new_setup() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$this->assertNull( $settings->get()['setupCompletedTimestamp'], 'setupCompletedTimestamp should be null initially.' );

		// Change only account status.
		$settings->merge(
			array(
				'accountStatus' => 'ready',
			)
		);

		$this->assertNull( $settings->get()['setupCompletedTimestamp'], 'Changing only account status should not set setupCompletedTimestamp.' );

		// Change only site status.
		$settings->merge(
			array(
				'accountStatus' => '',
				'siteStatus'    => 'ready',
			)
		);

		$this->assertNull( $settings->get()['setupCompletedTimestamp'], 'Changing only site status should not set setupCompletedTimestamp.' );

		// Change both account and site status.
		$settings->merge(
			array(
				'accountStatus' => 'ready',
				'siteStatus'    => 'ready',
			)
		);

		$this->assertTrue( gmdate( 'Ymd' ) === gmdate( 'Ymd', $settings->get()['setupCompletedTimestamp'] ), 'Changing both statuses should set today as setupCompletedTimestamp.' );
	}

	public function test_setup_completed_timestamp__existing_setup() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		remove_all_filters( 'pre_update_option_' . Settings::OPTION );

		// Change both account and site status.
		$settings->merge(
			array(
				'accountStatus' => 'ready',
				'siteStatus'    => 'ready',
			)
		);
		$settings->register();

		$this->assertNull( $settings->get()['setupCompletedTimestamp'], 'Existing setup should not have setupCompletedTimestamp by default upon re-register.' );

		// Change any AdSense setting.
		$settings->merge(
			array(
				'useSnippet' => false,
			)
		);

		$test_date            = (int) gmdate( 'Ymd', strtotime( '-1 month' ) );
		$setup_completed_date = (int) gmdate( 'Ymd', $settings->get()['setupCompletedTimestamp'] );

		// Test date can be greater than setup completed date if the `setupCompletedTimestamp` was saved on midnight.
		$this->assertTrue( $test_date >= $setup_completed_date, 'setupCompletedTimestamp should be in the past after change.' );
	}

	protected function get_testcase() {
		return $this;
	}

	protected function get_setting_with_owned_keys() {
		return new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
