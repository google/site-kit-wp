<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Create_PublicationTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Create_Publication;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Create_PublicationTest extends TestCase {

	/**
	 * Create publication datapoint.
	 *
	 * @var Create_Publication
	 */
	private $datapoint;

	/**
	 * Reader Revenue Manager module.
	 *
	 * @var Reader_Revenue_Manager
	 */
	private $module;

	public function set_up() {
		parent::set_up();

		$this->enable_feature( 'rrmExpressSetup' );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->module = new Reader_Revenue_Manager( $context );
		$this->module->get_client()->withDefer( true );

		$service = new Webcontentpublisher( $this->module->get_client() );

		$this->datapoint = new Create_Publication(
			array(
				'reference_site_url' => 'https://example.com',
				'service'            => function () use ( $service ) {
					return $service;
				},
			)
		);
	}

	public function test_create_request() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'displayName'  => 'Example Publication',
					'languageCode' => 'en',
					'regionCode'   => 'US',
				)
			)
		);

		$this->assertSame(
			'https://webcontentpublisher.googleapis.com/v1/organizations/*/publications',
			(string) $request->getUri(),
			'The request should use the create publication endpoint.'
		);
		$this->assertSame( 'POST', $request->getMethod(), 'The request should use POST.' );

		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'displayName'   => 'Example Publication',
					'languageCode'  => 'en',
					'primaryDomain' => array(
						'ownershipVerified' => true,
						'url'               => 'https://example.com',
					),
					'regionCode'    => 'US',
					'rrmProduct'    => array( 'enabled' => true ),
				)
			),
			(string) $request->getBody(),
			'The request body should include the publication details and primary domain.'
		);
	}

	/**
	 * @dataProvider data_missing_required_params
	 */
	public function test_create_request__requires_params( $param ) {
		$data = array(
			'displayName'  => 'Example Publication',
			'languageCode' => 'en',
			'regionCode'   => 'US',
		);
		unset( $data[ $param ] );

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( "Request parameter is empty: {$param}." );

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	public function data_missing_required_params() {
		return array(
			'displayName'  => array( 'displayName' ),
			'languageCode' => array( 'languageCode' ),
			'regionCode'   => array( 'regionCode' ),
		);
	}

	public function test_parse_response() {
		$response = new Publication();
		$response->setOnboardingState( 'COMPLETE' );
		$response->setPublicationId( 'publication-1' );

		$publication = $this->datapoint->parse_response(
			$response,
			$this->get_data_request(
				array(
					'displayName'  => 'Example Publication',
					'languageCode' => 'en',
					'regionCode'   => 'US',
				)
			)
		);

		$this->assertSame( 'publication-1', $publication['publicationId'], 'The response should contain the created publication.' );
		$this->assertSame( 'ONBOARDING_COMPLETE', $publication['onboardingState'], 'The response should be normalized.' );
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'POST', 'modules', 'reader-revenue-manager', 'create-publication', $data );
	}
}
