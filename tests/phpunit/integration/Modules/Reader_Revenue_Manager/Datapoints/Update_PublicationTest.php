<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Update_PublicationTest
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Update_Publication;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Update_PublicationTest extends TestCase {

	/**
	 * Update publication datapoint.
	 *
	 * @var Update_Publication
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

		$this->module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->module->get_client()->withDefer( true );

		$service         = new Webcontentpublisher( $this->module->get_client() );
		$this->datapoint = new Update_Publication(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			)
		);
	}

	public function test_create_request__terms_acceptance() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'data'           => array(
						'rrmProduct' => array(
							'tosAcceptance' => array(
								'userAccepted' => true,
							),
						),
					),
				)
			)
		);

		$this->assertSame( 'PATCH', $request->getMethod(), 'The request should use PATCH.' );
		$this->assertSame(
			'/v1/organizations/organization-1/publications/publication-1',
			$request->getUri()->getPath(),
			'The request should target the selected publication.'
		);

		parse_str( $request->getUri()->getQuery(), $query );
		$this->assertSame( 'rrmProduct.tosAcceptance.userAccepted', $query['updateMask'], 'The request should update the ToS acceptance.' );
		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'rrmProduct' => array(
						'tosAcceptance' => array(
							'userAccepted' => true,
						),
					),
				)
			),
			(string) $request->getBody(),
			'The request should include the ToS acceptance fields.'
		);
	}

	public function test_create_request__publication_policies() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'data'           => array(
						'publicationTosURL'           => 'https://example.com/terms',
						'publicationPrivacyPolicyURL' => 'https://example.com/privacy',
					),
				)
			)
		);

		parse_str( $request->getUri()->getQuery(), $query );
		$this->assertSame(
			'publicationTosUrl,publicationPrivacyPolicyUrl',
			$query['updateMask'],
			'The request should update both publication policy URLs.'
		);
		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'publicationPrivacyPolicyUrl' => 'https://example.com/privacy',
					'publicationTosUrl'           => 'https://example.com/terms',
				)
			),
			(string) $request->getBody(),
			'The request should include both publication policy URLs.'
		);
	}

	public function test_create_request__requires_publication_id() {
		$data = array(
			'organizationID' => 'organization-1',
			'data'           => array(
				'publicationTosURL' => 'https://example.com/terms',
			),
		);

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( 'Request parameter is empty: publicationID.' );

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	public function test_create_request__requires_organization_id() {
		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( 'Request parameter is empty: organizationID.' );

		$this->datapoint->create_request(
			$this->get_data_request(
				array(
					'publicationID' => 'publication-1',
					'data'          => array(
						'publicationTosURL' => 'https://example.com/terms',
					),
				)
			)
		);
	}

	public function test_create_request__requires_update_fields() {
		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( 'Request parameter is empty: data.' );

		$this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
				)
			)
		);
	}

	public function test_parse_response() {
		$response = new Publication();
		$response->setPublicationId( 'publication-1' );
		$response->setPublicationTosUrl( 'https://example.com/terms' );

		$publication = $this->datapoint->parse_response(
			$response,
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'data'           => array(
						'publicationTosURL' => 'https://example.com/terms',
					),
				)
			)
		);

		$this->assertSame( 'publication-1', $publication['publicationId'], 'The response should contain the updated publication.' );
		$this->assertSame( 'https://example.com/terms', $publication['publicationTosUrl'], 'New API fields should be preserved.' );
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'POST', 'modules', 'reader-revenue-manager', 'publication', $data );
	}
}
