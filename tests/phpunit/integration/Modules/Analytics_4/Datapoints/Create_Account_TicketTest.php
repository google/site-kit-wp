<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Create_Account_TicketTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin\AccountProvisioningService;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit_Dependencies\Google\Service\Exception;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProvisionAccountTicketResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_User;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Account_Ticket;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Create_Account_TicketTest extends TestCase {

	/**
	 * Create_Account_Ticket datapoint instance.
	 *
	 * @var Create_Account_Ticket
	 */
	private $datapoint;

	/**
	 * Provision account ticket request instance.
	 *
	 * @var Request
	 */
	private $provision_account_ticket_request;

	/**
	 * User object.
	 *
	 * @var WP_User
	 */
	private $user;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Authentication instance.
	 *
	 * @var Authentication
	 */
	private $authentication;

	public function set_up() {
		parent::set_up();

		$context              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options              = new Options( $context );
		$this->user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options         = new User_Options( $context, $this->user->ID );
		$this->authentication = new Authentication( $context, $options, $user_options );
		$this->analytics      = new Analytics_4( $context, $options, $user_options, $this->authentication );

		$this->analytics->get_client()->withDefer( true );
		$service = new AccountProvisioningService( $this->analytics->get_client(), $this->authentication->get_google_proxy()->url() );

		$this->datapoint = new Create_Account_Ticket(
			array(
				'credentials'               => $this->authentication->credentials()->get(),
				'provisioning_redirect_uri' => $this->authentication->get_google_proxy()
					->get_site_fields()['analytics_redirect_uri'],
				'service'                   => function () use ( $service ) {
					return $service;
				},
				'scopes'                    => array( Analytics_4::EDIT_SCOPE ),
				'request_scopes_message'    => __( 'You’ll need to grant Site Kit permission to create a new Analytics account on your behalf.', 'google-site-kit' ),
			),
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->provision_account_ticket_request = $request;

				$response = new GoogleAnalyticsAdminV1betaProvisionAccountTicketResponse();
				$response->setAccountTicketId( 'test-account-ticket-id' );

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);

		wp_set_current_user( $this->user->ID );
	}

	public function required_parameters() {
		return array(
			'displayName'    => array( 'displayName' ),
			'regionCode'     => array( 'regionCode' ),
			'propertyName'   => array( 'propertyName' ),
			'dataStreamName' => array( 'dataStreamName' ),
			'timezone'       => array( 'timezone' ),
		);
	}

	/**
	 * @dataProvider required_parameters
	 */
	public function test_create_request_validates_required_params( $required_param ) {
		$data = array(
			'displayName'    => 'test account name',
			'regionCode'     => 'US',
			'propertyName'   => 'test property name',
			'dataStreamName' => 'test stream name',
			'timezone'       => 'UTC',
		);
		// Remove the required parameter under test.
		unset( $data[ $required_param ] );

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'create-account-ticket', $data );

		try {
			$this->datapoint->create_request( $data_request );
			$this->fail( 'Expected Missing_Required_Param_Exception to be thrown.' );
		} catch ( Missing_Required_Param_Exception $e ) {
			$this->assertStringContainsString( "Request parameter is empty: $required_param", $e->getMessage(), 'Should indicate the missing parameter.' );
		}
	}

	/**
	 * @dataProvider data_create_account_ticket_show_progress
	 */
	public function test_create_request( $showProgressParams ) {
		$this->enable_feature( 'setupFlowRefresh' );

		$this->provision_account_ticket_request = null;

		$data = array(
			'displayName'    => 'test account name',
			'regionCode'     => 'US',
			'propertyName'   => 'test property name',
			'dataStreamName' => 'test stream name',
			'timezone'       => 'UTC',
		);

		if ( isset( $showProgressParams['provided'] ) ) {
			$data['showProgress'] = $showProgressParams['provided'];
		}

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'create-account-ticket', $data );
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertEquals( 'https://sitekit.withgoogle.com/v1beta/accounts:provisionAccountTicket', $this->provision_account_ticket_request->getUri()->__toString(), 'The request should be made to the correct endpoint.' );
		$account_ticket_request = new Analytics_4\GoogleAnalyticsAdmin\Proxy_GoogleAnalyticsAdminProvisionAccountTicketRequest(
			json_decode( $this->provision_account_ticket_request->getBody()->getContents(), true ) // must be array to hydrate model.
		);
		$this->assertEquals( 'test account name', $account_ticket_request->getAccount()->getDisplayName(), 'Account display name should match the provided value.' );
		$this->assertEquals( 'US', $account_ticket_request->getAccount()->getRegionCode(), 'Account region code should match the provided value.' );
		$redirect_uri = $this->authentication->get_google_proxy()->get_site_fields()['analytics_redirect_uri'];
		$this->assertEquals( $redirect_uri, $account_ticket_request->getRedirectUri(), 'Redirect URI should match the analytics redirect URI from site fields.' );
		$this->assertEquals( $showProgressParams['expected'], $account_ticket_request->getShowProgress(), 'The `showProgress` field should match the expected value' );
	}

	public function test_parse_response() {
		$this->provision_account_ticket_request = null;

		$data = array(
			'displayName'                      => 'test account name',
			'regionCode'                       => 'US',
			'propertyName'                     => 'test property name',
			'dataStreamName'                   => 'test stream name',
			'timezone'                         => 'UTC',
			'enhancedMeasurementStreamEnabled' => true,
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'create-account-ticket', $data );
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $this->datapoint->parse_response( $this->analytics->get_client()->execute( $request ), $data_request );

		$this->assertNotWPError( $response, 'Account ticket creation should succeed when all required parameters are provided.' );
		$account_ticket_params = get_transient( Analytics_4::PROVISION_ACCOUNT_TICKET_ID . '::' . $this->user->ID );
		$this->assertEquals( 'test-account-ticket-id', $account_ticket_params['id'], 'Account ticket ID should be stored in transient.' );
		$this->assertEquals( 'test property name', $account_ticket_params['property_name'], 'Property display name should be stored in transient.' );
		$this->assertEquals( 'test stream name', $account_ticket_params['data_stream_name'], 'Stream display name should be stored in transient.' );
		$this->assertEquals( 'UTC', $account_ticket_params['timezone'], 'Timezone should be stored in transient.' );
		$this->assertEquals( true, $account_ticket_params['enhanced_measurement_stream_enabled'], 'Enhanced measurement stream enabled should be stored in transient.' );
	}

	public function data_create_account_ticket_show_progress() {
		return array(
			array(
				'with showProgress provided as true' => array(
					'provided' => true,
					'expected' => true,
				),
			),
			array(
				'with showProgress provided as false' => array(
					'provided' => false,
					'expected' => false,
				),
			),
			// When the value for `showProgress` is not provided, it should default to `false`.
			'with showProgress not provided' => array(
				array(
					'expected' => false,
				),
			),
		);
	}
}
