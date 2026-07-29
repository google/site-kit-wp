<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Get_CTAsTest
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_CTAs;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\ListCtasResponse;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Get_CTAsTest extends TestCase {

	/**
	 * Get CTAs datapoint.
	 *
	 * @var Get_CTAs
	 */
	private $datapoint;

	public function set_up() {
		parent::set_up();

		$module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module->get_client()->withDefer( true );

		$service         = new Webcontentpublisher( $module->get_client() );
		$this->datapoint = new Get_CTAs(
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
			'https://webcontentpublisher.googleapis.com/v1/organizations/organization-1/publications/publication-1/ctas',
			(string) $request->getUri(),
			'The request should use the list CTAs endpoint for the publication.'
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
		$this->assertFalse( $this->datapoint->is_shareable(), 'The get CTAs datapoint should not be shareable.' );
	}

	public function test_parse_response() {
		$response = new ListCtasResponse(
			array(
				'ctas' => array(
					new Cta( array( 'name' => 'organizations/organization-1/publications/publication-1/ctas/1' ) ),
				),
			)
		);

		$ctas = $this->datapoint->parse_response(
			$response,
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
				)
			)
		);

		$this->assertCount( 1, $ctas, 'The response should contain the publication CTAs.' );
		$this->assertSame(
			'organizations/organization-1/publications/publication-1/ctas/1',
			$ctas[0]->getName(),
			'The CTA resource should be returned unchanged.'
		);
	}

	public function test_parse_response__returns_empty_array_when_no_ctas() {
		$response = new ListCtasResponse();

		$this->assertSame(
			array(),
			$this->datapoint->parse_response(
				$response,
				$this->get_data_request(
					array(
						'organizationID' => 'organization-1',
						'publicationID'  => 'publication-1',
					)
				)
			),
			'The datapoint should return an empty array when the publication has no CTAs.'
		);
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'ctas', $data );
	}
}
