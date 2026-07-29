<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Get_PublicationsTest
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Publications;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\ListPublicationsResponse as Legacy_ListPublicationsResponse;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication as Legacy_Publication;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\ListPublicationsResponse;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Get_PublicationsTest extends TestCase {

	public function test_create_request__uses_legacy_service_when_feature_is_disabled() {
		$module = $this->get_module();
		$client = $module->get_client();

		$datapoint = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new SubscribewithGoogle( $client );
			}
		);

		$request = $datapoint->create_request( $this->get_data_request() );

		$this->assertSame( '/v1/publications', $request->getUri()->getPath(), 'The legacy list publications endpoint should be used.' );
		$this->assertSame( 'filter=site_url%20%3D%20%22https%3A%2F%2Fexample.com%22', $request->getUri()->getQuery(), 'The legacy publication filter should be preserved.' );
	}

	public function test_create_request__uses_new_service_when_feature_is_enabled() {
		$this->enable_feature( 'rrmExpressSetup' );

		$module = $this->get_module();
		$module->get_settings()->register();
		$module->get_settings()->merge( array( 'organizationID' => 'organization-1' ) );
		$client = $module->get_client();

		$datapoint = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new Webcontentpublisher( $client );
			}
		);

		$request = $datapoint->create_request( $this->get_data_request() );

		$this->assertSame(
			'/v1/organizations/organization-1/publications',
			$request->getUri()->getPath(),
			'The Web Content Publisher list publications endpoint should be used.'
		);
	}

	public function test_create_request__requires_organization_id_for_new_service() {
		$this->enable_feature( 'rrmExpressSetup' );

		$module = $this->get_module();
		$client = $module->get_client();

		$datapoint = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new Webcontentpublisher( $client );
			}
		);

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( 'Request parameter is empty: organizationID.' );

		$datapoint->create_request( $this->get_data_request() );
	}

	public function test_parse_response__normalizes_new_publications() {
		$this->enable_feature( 'rrmExpressSetup' );

		$module = $this->get_module();
		$client = $module->get_client();

		$synchronized = null;
		$datapoint    = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new Webcontentpublisher( $client );
			},
			function ( $publications ) use ( &$synchronized ) {
				$synchronized = $publications;
			}
		);

		$response = new ListPublicationsResponse();
		$response->setPublications(
			array(
				new Publication(
					array(
						'onboardingState' => 'COMPLETE',
						'paymentOption'   => 'SUBSCRIPTIONS',
						'products'        => array( 'basic' ),
						'publicationId'   => 'publication-1',
					)
				),
			)
		);

		$publications = $datapoint->parse_response( $response, $this->get_data_request() );

		$this->assertContainsOnlyInstancesOf( Legacy_Publication::class, $publications, 'New publication resources should be normalized to the legacy model.' );
		$this->assertSame( 'ONBOARDING_COMPLETE', $publications[0]->getOnboardingState(), 'The onboarding state should be normalized.' );
		$this->assertSame( $publications, $synchronized, 'Normalized publications should be passed to the synchronization callback.' );
	}

	public function test_parse_response__preserves_legacy_publications() {
		$module = $this->get_module();
		$client = $module->get_client();

		$datapoint   = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new SubscribewithGoogle( $client );
			}
		);
		$publication = new Legacy_Publication();
		$publication->setPublicationId( 'publication-1' );
		$response = new Legacy_ListPublicationsResponse();
		$response->setPublications( array( $publication ) );

		$this->assertSame(
			array( $publication ),
			$datapoint->parse_response( $response, $this->get_data_request() ),
			'Legacy publication resources should be returned unchanged.'
		);
	}

	public function test_parse_response__handles_empty_publications_response() {
		$this->enable_feature( 'rrmExpressSetup' );

		$module = $this->get_module();
		$client = $module->get_client();

		$synchronized = null;
		$datapoint    = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new Webcontentpublisher( $client );
			},
			function ( $publications ) use ( &$synchronized ) {
				$synchronized = $publications;
			}
		);

		$publications = $datapoint->parse_response( new ListPublicationsResponse(), $this->get_data_request() );

		$this->assertSame( array(), $publications, 'An empty API response should return an empty publications array.' );
		$this->assertSame( array(), $synchronized, 'The synchronization callback should receive an empty publications array.' );
	}

	private function get_module() {
		$module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module->get_client()->withDefer( true );

		return $module;
	}

	private function get_datapoint( Reader_Revenue_Manager $module, callable $service, ?callable $synchronize = null ) {
		return new Get_Publications(
			array(
				'get_publication_filter'       => function () {
					return 'site_url = "https://example.com"';
				},
				'service'                      => $service,
				'settings'                     => $module->get_settings(),
				'synchronize_publication_data' => $synchronize ?: function () {},
			)
		);
	}

	private function get_data_request() {
		return new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'publications', array() );
	}
}
