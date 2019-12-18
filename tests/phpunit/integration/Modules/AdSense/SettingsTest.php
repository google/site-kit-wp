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
use Google\Site_Kit\Tests\TestCase;

class SettingsTest extends TestCase {

	public function test_register() {
		remove_all_filters( 'default_option_' . Settings::OPTION );
		remove_all_filters( 'option_' . Settings::OPTION );
		delete_option( Settings::OPTION );
		$this->assertFalse( get_option( Settings::OPTION ) );
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$default_value = get_option( Settings::OPTION );
		$this->assertEquals( $default_value, $settings->get_default() );

		$this->assertEqualSets(
			array(
				'setupComplete' => false,
				'accountID'     => '',
				'accountStatus' => '',
				'clientID'      => '',
				'useSnippet'    => true,
			),
			$default_value
		);

		update_option( Settings::OPTION, array( 'accountID' => 'saved-account-id' ) );
		$this->assertArraySubset( array( 'accountID' => 'saved-account-id' ), get_option( Settings::OPTION ) );
		add_filter( 'googlesitekit_adsense_account_id', '__return_empty_string' );
		$this->assertArraySubset( array( 'accountID' => 'saved-account-id' ), get_option( Settings::OPTION ) );
		remove_filter( 'googlesitekit_adsense_account_id', '__return_empty_string' );

		add_filter( 'googlesitekit_adsense_account_id', function () {
			return 'filtered-adsense-account-id';
		} );
		$this->assertArraySubset( array( 'accountID' => 'filtered-adsense-account-id' ), get_option( Settings::OPTION ) );

		// Default value filtered into saved value.
		$this->assertArraySubset( array( 'useSnippet' => true ), get_option( Settings::OPTION ) );
		update_option( Settings::OPTION, array( 'useSnippet' => false ) );
		// Default respects saved value.
		$this->assertArraySubset( array( 'useSnippet' => false ), get_option( Settings::OPTION ) );
	}
}
