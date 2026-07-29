<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Create_CTATest
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Create_CTA;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Create_CTATest extends TestCase {

	/**
	 * Create CTA datapoint.
	 *
	 * @var Create_CTA
	 */
	private $datapoint;

	public function set_up() {
		parent::set_up();

		$module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module->get_client()->withDefer( true );

		$service         = new Webcontentpublisher( $module->get_client() );
		$this->datapoint = new Create_CTA(
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
					'organizationID'   => 'organization-1',
					'publicationID'    => 'publication-1',
					'displayName'      => 'Newsletter sign-up',
					'newsletterConfig' => array(
						'title'         => 'Subscribe to our newsletter',
						'customMessage' => 'Join our mailing list.',
					),
				)
			)
		);

		$this->assertSame(
			'https://webcontentpublisher.googleapis.com/v1/organizations/organization-1/publications/publication-1/ctas',
			(string) $request->getUri(),
			'The request should use the create CTA endpoint for the publication.'
		);

		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'displayName'      => 'Newsletter sign-up',
					'newsletterConfig' => array(
						'title'         => 'Subscribe to our newsletter',
						'customMessage' => 'Join our mailing list.',
					),
					'type'             => 'NEWSLETTER_SIGNUP',
				)
			),
			(string) $request->getBody(),
			'The request body should include the newsletter sign-up CTA configuration.'
		);
	}

	public function test_create_request__omits_display_name_when_absent() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID'   => 'organization-1',
					'publicationID'    => 'publication-1',
					'newsletterConfig' => array( 'title' => 'Subscribe' ),
				)
			)
		);

		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'newsletterConfig' => array( 'title' => 'Subscribe' ),
					'type'             => 'NEWSLETTER_SIGNUP',
				)
			),
			(string) $request->getBody(),
			'The request body should omit the display name when it is not provided.'
		);
	}

	/**
	 * @dataProvider data_missing_required_params
	 */
	public function test_create_request__requires_params( $param ) {
		$data = array(
			'organizationID'   => 'organization-1',
			'publicationID'    => 'publication-1',
			'newsletterConfig' => array( 'title' => 'Subscribe' ),
		);
		unset( $data[ $param ] );

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( "Request parameter is empty: {$param}." );

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	public function data_missing_required_params() {
		return array(
			'organizationID'   => array( 'organizationID' ),
			'publicationID'    => array( 'publicationID' ),
			'newsletterConfig' => array( 'newsletterConfig' ),
		);
	}

	public function test_is_not_shareable() {
		$this->assertFalse( $this->datapoint->is_shareable(), 'The create CTA datapoint should not be shareable.' );
	}

	public function test_parse_response() {
		$response = new Cta( array( 'name' => 'organizations/organization-1/publications/publication-1/ctas/1' ) );

		$cta = $this->datapoint->parse_response(
			$response,
			$this->get_data_request(
				array(
					'organizationID'   => 'organization-1',
					'publicationID'    => 'publication-1',
					'newsletterConfig' => array( 'title' => 'Subscribe' ),
				)
			)
		);

		$this->assertSame(
			'organizations/organization-1/publications/publication-1/ctas/1',
			$cta->getName(),
			'The created CTA resource should be returned unchanged.'
		);
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'POST', 'modules', 'reader-revenue-manager', 'create-cta', $data );
	}
}
