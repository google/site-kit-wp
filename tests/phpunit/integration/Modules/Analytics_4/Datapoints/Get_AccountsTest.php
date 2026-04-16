<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_AccountsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Accounts;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaAccount;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListAccountsResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_AccountsTest extends TestCase {

	/**
	 * Get_Accounts datapoint instance.
	 *
	 * @var Get_Accounts
	 */
	private $datapoint;

	/**
	 * Captured HTTP request.
	 *
	 * @var Request
	 */
	private $captured_request;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	public function set_up() {
		parent::set_up();

		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options         = new Options( $context );
		$user            = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options    = new User_Options( $context, $user->ID );
		$authentication  = new Authentication( $context, $options, $user_options );
		$this->analytics = new Analytics_4( $context, $options, $user_options, $authentication );

		$this->analytics->get_client()->withDefer( true );
		$service = new Google_Service_GoogleAnalyticsAdmin( $this->analytics->get_client() );

		$this->datapoint = new Get_Accounts(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->captured_request = $request;

				$account_a = new GoogleAnalyticsAdminV1betaAccount();
				$account_a->setName( 'accounts/111' );
				$account_b = new GoogleAnalyticsAdminV1betaAccount();
				$account_b->setName( 'accounts/222' );

				$response = new GoogleAnalyticsAdminV1betaListAccountsResponse();
				$response->setAccounts( array( $account_a, $account_b ) );

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request() {
		$this->captured_request = null;

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'accounts', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsadmin.googleapis.com/v1beta/accounts',
			$this->captured_request->getUri()->__toString(),
			'Accounts request should target the expected API endpoint.'
		);
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'accounts', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $this->datapoint->parse_response(
			$this->analytics->get_client()->execute( $request ),
			$data_request
		);

		$this->assertCount( 2, $response, 'Accounts response should include one entry per account.' );
		$this->assertEquals( '111', $response[0]->_id, 'First account should have the expected parsed _id.' );
		$this->assertEquals( '222', $response[1]->_id, 'Second account should have the expected parsed _id.' );
	}
}
