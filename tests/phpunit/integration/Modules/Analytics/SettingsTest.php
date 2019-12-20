<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics\Settings
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\Analytics\Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics
 */
class SettingsTest extends TestCase {

	public function test_register() {
	}


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
		add_filter( 'googlesitekit_analytics_account_id', function () {
			return 'filtered-account-id';
		} );
		$this->assertEquals( 'filtered-account-id', get_option( Settings::OPTION )['accountID'] );

		// Test propertyID can be overridden by non-empty value via filter
		update_option( Settings::OPTION, array( 'propertyID' => 'saved-property-id' ) );
		$this->assertEquals( 'saved-property-id', get_option( Settings::OPTION )['propertyID'] );
		add_filter( 'googlesitekit_analytics_property_id', '__return_empty_string' );
		$this->assertEquals( 'saved-property-id', get_option( Settings::OPTION )['propertyID'] );
		add_filter( 'googlesitekit_analytics_property_id', function () {
			return 'filtered-property-id';
		} );
		$this->assertEquals( 'filtered-property-id', get_option( Settings::OPTION )['propertyID'] );

		// Test internalWebPropertyID can be overridden by non-empty value via filter
		update_option( Settings::OPTION, array( 'internalWebPropertyID' => 'saved-internal-web-property-id' ) );
		$this->assertEquals( 'saved-internal-web-property-id', get_option( Settings::OPTION )['internalWebPropertyID'] );
		add_filter( 'googlesitekit_analytics_internal_web_property_id', '__return_empty_string' );
		$this->assertEquals( 'saved-internal-web-property-id', get_option( Settings::OPTION )['internalWebPropertyID'] );
		add_filter( 'googlesitekit_analytics_internal_web_property_id', function () {
			return 'filtered-internal-web-property-id';
		} );
		$this->assertEquals( 'filtered-internal-web-property-id', get_option( Settings::OPTION )['internalWebPropertyID'] );

		// Test profileID can be overridden by non-empty value via filter
		update_option( Settings::OPTION, array( 'profileID' => 'saved-profile-id' ) );
		$this->assertEquals( 'saved-profile-id', get_option( Settings::OPTION )['profileID'] );
		add_filter( 'googlesitekit_analytics_view_id', '__return_empty_string' );
		$this->assertEquals( 'saved-profile-id', get_option( Settings::OPTION )['profileID'] );
		add_filter( 'googlesitekit_analytics_view_id', function () {
			return 'filtered-profile-id';
		} );
		$this->assertEquals( 'filtered-profile-id', get_option( Settings::OPTION )['profileID'] );
	}


	public function test_get_default() {
	}
}
