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

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Analytics 4 object.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	public function setUp() {
		parent::setUp();

		$this->context   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->analytics = new Analytics_4( $this->context );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$this->analytics->register();

		// Adding required scopes.
		$this->assertEquals(
			$this->analytics->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
	}

	public function test_handle_provisioning_callback() {
	}

	public function test_get_scopes() {
		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/analytics.readonly',
			),
			$this->analytics->get_scopes()
		);
	}

	public function test_is_connected() {
		$options   = new Options( $this->context );
		$analytics = new Analytics_4( $this->context, $options );

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
		$options = new Options( $this->context );
		$options->set( Settings::OPTION, 'test-value' );

		$analytics = new Analytics_4( $this->context, $options );
		$analytics->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_get_datapoints() {
		$this->assertEqualSets(
			array(
				'account-summaries',
				'accounts',
				'create-property',
				'create-webdatastream',
				'properties',
				'property',
				'webdatastreams',
				'webdatastreams-batch',
			),
			$this->analytics->get_datapoints()
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return $this->analytics;
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return $this->analytics;
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return $this->analytics;
	}

}
