<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics\Settings
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\Analytics\Settings;
use Google\Site_Kit\Tests\Core\Storage\Setting_With_Owned_Keys_ContractTests;
use Google\Site_Kit\Tests\FakeHttpClient;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group Analytics
 */
class SettingsTest extends SettingsTestCase {

	use Setting_With_Owned_Keys_ContractTests;

	public function test_register_option_filters() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		remove_all_filters( 'googlesitekit_analytics_account_id' );
		remove_all_filters( 'googlesitekit_analytics_property_id' );
		remove_all_filters( 'googlesitekit_analytics_internal_web_property_id' );
		remove_all_filters( 'googlesitekit_analytics_view_id' );
		$settings->register();

		// Test accountID can be overridden by non-empty value via filter
		update_option( Settings::OPTION, array( 'accountID' => 'saved-account-id' ) );
		$this->assertEquals( 'saved-account-id', get_option( Settings::OPTION )['accountID'] );
		add_filter( 'googlesitekit_analytics_account_id', '__return_empty_string' );
		$this->assertEquals( 'saved-account-id', get_option( Settings::OPTION )['accountID'] );
		add_filter(
			'googlesitekit_analytics_account_id',
			function () {
				return 'filtered-account-id';
			}
		);
		$this->assertEquals( 'filtered-account-id', get_option( Settings::OPTION )['accountID'] );

		// Test propertyID can be overridden by non-empty value via filter
		update_option( Settings::OPTION, array( 'propertyID' => 'saved-property-id' ) );
		$this->assertEquals( 'saved-property-id', get_option( Settings::OPTION )['propertyID'] );
		add_filter( 'googlesitekit_analytics_property_id', '__return_empty_string' );
		$this->assertEquals( 'saved-property-id', get_option( Settings::OPTION )['propertyID'] );
		add_filter(
			'googlesitekit_analytics_property_id',
			function () {
				return 'filtered-property-id';
			}
		);
		$this->assertEquals( 'filtered-property-id', get_option( Settings::OPTION )['propertyID'] );

		// Test internalWebPropertyID can be overridden by non-empty value via filter
		update_option( Settings::OPTION, array( 'internalWebPropertyID' => 'saved-internal-web-property-id' ) );
		$this->assertEquals( 'saved-internal-web-property-id', get_option( Settings::OPTION )['internalWebPropertyID'] );
		add_filter( 'googlesitekit_analytics_internal_web_property_id', '__return_empty_string' );
		$this->assertEquals( 'saved-internal-web-property-id', get_option( Settings::OPTION )['internalWebPropertyID'] );
		add_filter(
			'googlesitekit_analytics_internal_web_property_id',
			function () {
				return 'filtered-internal-web-property-id';
			}
		);
		$this->assertEquals( 'filtered-internal-web-property-id', get_option( Settings::OPTION )['internalWebPropertyID'] );

		// Test profileID can be overridden by non-empty value via filter
		update_option( Settings::OPTION, array( 'profileID' => 'saved-profile-id' ) );
		$this->assertEquals( 'saved-profile-id', get_option( Settings::OPTION )['profileID'] );
		add_filter( 'googlesitekit_analytics_view_id', '__return_empty_string' );
		$this->assertEquals( 'saved-profile-id', get_option( Settings::OPTION )['profileID'] );
		add_filter(
			'googlesitekit_analytics_view_id',
			function () {
				return 'filtered-profile-id';
			}
		);
		$this->assertEquals( 'filtered-profile-id', get_option( Settings::OPTION )['profileID'] );
	}

	public function test_get_default() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'             => '',
				'propertyID'            => '',
				'profileID'             => '',
				'internalWebPropertyID' => '',
				'useSnippet'            => true,
				'canUseSnippet'         => true,
				'ownerID'               => 0,
				'anonymizeIP'           => true,
				'trackingDisabled'      => array( 'loggedinUsers' ),
				'adsenseLinked'         => false,
				'adsConversionID'       => '',
			),
			get_option( Settings::OPTION )
		);
	}

	public function test_legacy_options() {
		$legacy_option = array(
			'accountId'             => 'test-account-id',
			'profileId'             => 'test-profile-id',
			'propertyId'            => 'test-property-id',
			'internalWebPropertyId' => 'test-internal-web-property-id',
		);
		update_option( Settings::OPTION, $legacy_option );
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$option = $settings->get();
		$this->assertArraySubset(
			array(
				'accountID'             => 'test-account-id',
				'profileID'             => 'test-profile-id',
				'propertyID'            => 'test-property-id',
				'internalWebPropertyID' => 'test-internal-web-property-id',
			),
			$option
		);

		foreach ( array_keys( $legacy_option ) as $legacy_key ) {
			$this->assertArrayNotHasKey( $legacy_key, $option );
		}
	}

	public function test_legacy_adsense_linked() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();
		$legacy_adsense_linked_option = 'googlesitekit_analytics_adsense_linked';
		remove_all_filters( 'googlesitekit_analytics_adsense_linked' );
		// By default the Analytics module registers a filter to force linked to false until AdSense is active.
		// Simulated here, as the Analytics module isn't registered.
		add_filter( 'googlesitekit_analytics_adsense_linked', '__return_false' );
		update_option( $legacy_adsense_linked_option, '1' );

		$this->assertFalse( $settings->get()['adsenseLinked'] );
		// Simulate AdSense activated.
		remove_filter( 'googlesitekit_analytics_adsense_linked', '__return_false' );
		// The legacy option is used as a fallback in the default value if the setting is not set yet.
		$this->assertTrue( $settings->get()['adsenseLinked'] );

		// Any saved value in Settings will supersede the default inherited from the legacy setting.
		$settings->set( array( 'adsenseLinked' => false ) );
		$this->assertFalse( $settings->get()['adsenseLinked'] );
	}

	public function test_adsense_linked_is_always_false_if_adsense_is_inactive() {
		remove_all_filters( 'googlesitekit_analytics_adsense_linked' );
		$context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$settings = new Settings( new Options( $context ) );
		$settings->register();
		$analytics = new Analytics( $context );
		$analytics->register(); // Hooks filter to force adsenseLinked false.

		$this->assertFalse( $settings->get()['adsenseLinked'] );

		// Set the setting to true, but it should still return false.
		$settings->merge( array( 'adsenseLinked' => true ) );

		$this->assertFalse( $settings->get()['adsenseLinked'] );
	}

	public function test_adsense_linked_is_false_if_adsense_is_active_and_not_connected() {
		remove_all_filters( 'googlesitekit_analytics_adsense_linked' );
		$context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$settings = new Settings( new Options( $context ) );
		$settings->register();
		$adsense = new AdSense( $context );

		$this->assertFalse( $settings->get()['adsenseLinked'] );

		$adsense->register(); // AdSense is now active, but not connected.
		$this->assertFalse( $adsense->is_connected() );

		$this->assertFalse( $settings->get()['adsenseLinked'] );
	}

	public function test_adsense_linked_is_true_if_adsense_is_active_and_connected_once_analytics_report_with_adsense_metrics_is_requested() {
		remove_all_filters( 'googlesitekit_analytics_adsense_linked' );
		$user_id  = $this->factory()->user->create();
		$context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$settings = new Settings( new Options( $context ) );
		$settings->register();
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $user_id );
		$authentication = new Authentication( $context, $options, $user_options );
		$adsense        = new AdSense( $context, $options, $user_options, $authentication );
		$analytics      = new Analytics( $context, $options, $user_options, $authentication );
		$authentication->get_oauth_client()->get_client()->setHttpClient(
			new FakeHttpClient() // Returns 200 by default.
		);

		$adsense->register(); // AdSense is now active.
		$adsense->get_settings()->register();
		$adsense->get_settings()->merge(
			array(
				'accountSetupComplete' => true,
				'siteSetupComplete'    => true,
			)
		);
		$this->assertTrue( $adsense->is_connected() ); // AdSense is now connected.

		$this->assertFalse( $settings->get()['adsenseLinked'] );

		// Request requires Analytics settings.
		$settings->merge( array( 'profileID' => '987654' ) );
		// Grant scopes so request doesn't fail.
		$authentication->get_oauth_client()->set_granted_scopes(
			$analytics->get_scopes()
		);
		// Any expression starting with `ga:adsense` should trigger the linking.
		$data = $analytics->get_data(
			'report',
			array(
				'metrics' => array(
					array(
						'alias'      => 'Earnings',
						'expression' => 'ga:adsenseRevenue',
					),
				),
			)
		);
		$this->assertNotWPError( $data );

		$this->assertTrue( $settings->get()['adsenseLinked'] );
	}

	public function test_can_use_snippet__default_value() {
		remove_all_filters( 'googlesitekit_analytics_can_use_snippet' );
		$context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$settings = new Settings( new Options( $context ) );
		$settings->register();

		// Defaults to `true`
		$this->assertTrue( $settings->get()['canUseSnippet'] );
		// Only filters returning a boolean are allowed.
		$filter_return = 'a string';
		add_filter(
			'googlesitekit_analytics_can_use_snippet',
			function () use ( &$filter_return ) {
				return $filter_return;
			}
		);
		$this->assertTrue( $settings->get()['canUseSnippet'] );
		$filter_return = false;
		$this->assertFalse( $settings->get()['canUseSnippet'] );
	}

	public function test_can_use_snippet__saved_value() {
		remove_all_filters( 'googlesitekit_analytics_can_use_snippet' );
		$context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$settings = new Settings( new Options( $context ) );
		$settings->register();

		// Defaults to `true`
		$this->assertTrue( $settings->get()['canUseSnippet'] );
		// Save with defaults.
		$settings->merge( array() );
		$this->assertTrue( $settings->get()['canUseSnippet'] );
		// Saved value may be inconsistent with filtered return.
		$settings->merge( array( 'canUseSnippet' => false ) );
		$raw_value = $this->queryOption( Settings::OPTION )['option_value'];
		// Here we show that the raw value in the DB is `false` but the setting returns `true`.
		$this->assertFalse( maybe_unserialize( $raw_value )['canUseSnippet'] );
		$this->assertTrue( $settings->get()['canUseSnippet'] );
		// Keep in mind the saved value is still `false` below.

		// Only filters returning a boolean are allowed.
		$filter_return = 'a string';
		add_filter(
			'googlesitekit_analytics_can_use_snippet',
			function () use ( &$filter_return ) {
				return $filter_return;
			}
		);
		// Non-boolean filter return defaults to setting value (saved `false` above).
		$this->assertFalse( $settings->get()['canUseSnippet'] );
		$filter_return = false;
		$this->assertFalse( $settings->get()['canUseSnippet'] );

		// No filters restores the default of `true`.
		remove_all_filters( 'googlesitekit_analytics_can_use_snippet' );
		$this->assertTrue( $settings->get()['canUseSnippet'] );
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
