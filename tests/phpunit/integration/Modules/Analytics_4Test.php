<?php
/**
 * Analytics_4Test
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class Analytics_4Test extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Settings_ContractTests;
	use Module_With_Owner_ContractTests;

	public function test_register() {
		$analytics = new Analytics_4( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$analytics->register();

		// Adding required scopes.
		$this->assertEquals(
			$analytics->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
	}

	public function test_get_scopes() {
		$analytics = new Analytics_4( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/analytics.readonly',
			),
			$analytics->get_scopes()
		);
	}

	public function test_is_connected() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );

		$analytics = new Analytics_4( $context, $options );

		$this->assertFalse( $analytics->is_connected() );

		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		$this->assertTrue( $analytics->is_connected() );
	}

	public function test_on_deactivation() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );
		$options->set( Settings::OPTION, 'test-value' );

		$analytics = new Analytics_4( $context, $options );
		$analytics->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_get_datapoints() {
		$analytics = new Analytics_4( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'accounts',
				'create-property',
				'create-webdatastream',
				'properties',
				'property',
				'webdatastreams',
			),
			$analytics->get_datapoints()
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Analytics_4( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return new Analytics_4( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return new Analytics_4( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}
