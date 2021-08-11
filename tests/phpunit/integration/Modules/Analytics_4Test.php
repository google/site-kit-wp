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
use Google\Site_Kit\Tests\FakeHttpClient;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Response;
use Google\Site_Kit_Dependencies\GuzzleHttp\Stream\Stream;

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
		$account_id       = '12345678';
		$property_id      = '1001';
		$webdatastream_id = '2001';
		$measurement_id   = '1A2BCD345E';

		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => $account_id,
				'propertyID'      => '',
				'webDataStreamID' => '',
				'measurementID'   => '',
			)
		);

		$http_client = new FakeHttpClient();
		$http_client->set_request_handler(
			function( Request $request ) use ( $property_id, $webdatastream_id, $measurement_id ) {
				$url = parse_url( $request->getUrl() );
				if ( 'analyticsadmin.googleapis.com' !== $url['host'] ) {
					return new Response( 200 );
				}

				switch ( $url['path'] ) {
					case '/v1alpha/properties':
						return new Response(
							200,
							array(),
							Stream::factory(
								json_encode(
									array(
										'name' => "properties/{$property_id}",
									)
								)
							)
						);
					case "/v1alpha/properties/{$property_id}/webDataStreams":
						return new Response(
							200,
							array(),
							Stream::factory(
								json_encode(
									array(
										'name'          => "properties/{$property_id}/webDataStreams/{$webdatastream_id}",
										'measurementId' => $measurement_id,
									)
								)
							)
						);
					default:
						return new Response( 200 );
				}
			}
		);

		remove_all_actions( 'googlesitekit_analytics_handle_provisioning_callback' );

		$this->analytics->get_client()->setHttpClient( $http_client );
		$this->analytics->register();

		do_action( 'googlesitekit_analytics_handle_provisioning_callback', $account_id );

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'       => $account_id,
				'propertyID'      => $property_id,
				'webDataStreamID' => $webdatastream_id,
				'measurementID'   => $measurement_id,
			),
			$options->get( Settings::OPTION )
		);
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
