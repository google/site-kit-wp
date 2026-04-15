<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Account_SummariesTest
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
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Account_Summaries;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaAccountSummary;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListAccountSummariesResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Account_SummariesTest extends TestCase {

	/**
	 * Get_Account_Summaries datapoint instance.
	 *
	 * @var Get_Account_Summaries
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

		$this->datapoint = new Get_Account_Summaries(
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

				$summary  = new GoogleAnalyticsAdminV1betaAccountSummary();
				$response = new GoogleAnalyticsAdminV1betaListAccountSummariesResponse();
				$response->setAccountSummaries( array( $summary ) );

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request() {
		$this->captured_request = null;

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'account-summaries', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$uri = $this->captured_request->getUri()->__toString();
		$this->assertStringContainsString(
			'analyticsadmin.googleapis.com/v1beta/accountSummaries',
			$uri,
			'Account summaries request should target the expected API endpoint.'
		);
		$this->assertStringContainsString(
			'pageSize=200',
			$uri,
			'Account summaries request should request the expected page size.'
		);
		$this->assertStringNotContainsString(
			'pageToken',
			$uri,
			'Account summaries request should not include a page token when none is provided.'
		);
	}

	public function test_create_request_with_page_token() {
		$this->captured_request = null;

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'account-summaries',
			array(
				'pageToken' => 'next-page-token',
			)
		);
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertStringContainsString(
			'pageToken=next-page-token',
			urldecode( $this->captured_request->getUri()->getQuery() ),
			'Account summaries request should include the page token when provided.'
		);
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'account-summaries', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$api_response = $this->analytics->get_client()->execute( $request );
		$parsed       = $this->datapoint->parse_response( $api_response, $data_request );

		$this->assertSame(
			$api_response,
			$parsed,
			'parse_response should return the API response unchanged.'
		);
		$this->assertCount(
			1,
			$parsed->getAccountSummaries(),
			'Parsed response should preserve account summaries from the API.'
		);
	}
}
