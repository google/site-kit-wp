<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Get_PublicationTest
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Publication;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Get_PublicationTest extends TestCase {

	/**
	 * Get publication datapoint.
	 *
	 * @var Get_Publication
	 */
	private $datapoint;

	public function set_up() {
		parent::set_up();

		$module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module->get_client()->withDefer( true );

		$service         = new Webcontentpublisher( $module->get_client() );
		$this->datapoint = new Get_Publication(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			)
		);
	}

	public function test_create_request() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
				)
			)
		);

		$this->assertSame(
			'https://webcontentpublisher.googleapis.com/v1/organizations/organization-1/publications/publication-1',
			(string) $request->getUri(),
			'The request should use the get publication endpoint.'
		);
	}

	/**
	 * @dataProvider data_missing_required_params
	 */
	public function test_create_request__requires_params( $param ) {
		$data = array(
			'organizationID' => 'organization-1',
			'publicationID'  => 'publication-1',
		);
		unset( $data[ $param ] );

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( "Request parameter is empty: {$param}." );

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	public function data_missing_required_params() {
		return array(
			'organizationID' => array( 'organizationID' ),
			'publicationID'  => array( 'publicationID' ),
		);
	}

	public function test_is_not_shareable() {
		$this->assertFalse( $this->datapoint->is_shareable(), 'The get publication datapoint should not be shareable.' );
	}

	public function test_parse_response() {
		$response = new Publication(
			array(
				'organizationId' => 'organization-1',
				'publicationId'  => 'publication-1',
			)
		);
		$data     = array(
			'organizationID' => 'organization-1',
			'publicationID'  => 'publication-1',
		);

		$publication = $this->datapoint->parse_response( $response, $this->get_data_request( $data ) );

		$this->assertSame( 'publication-1', $publication->getPublicationId(), 'The response should contain the requested publication.' );
		$this->assertSame( 'organization-1', $publication['organizationId'], 'New API fields should be preserved.' );
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'publication', $data );
	}
}
