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
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Publications;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication as Legacy_Publication;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\ContentPolicyStatus;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\ListPublicationsResponse;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Get_PublicationsTest extends TestCase {

	public function test_create_request() {
		$module    = $this->get_module();
		$datapoint = $this->get_datapoint( $module );
		$request   = $datapoint->create_request( $this->get_data_request() );

		$this->assertSame(
			'/v1/organizations/*/publications',
			$request->getUri()->getPath(),
			'The Web Content Publisher list publications endpoint should be used.'
		);
		$this->assertSame(
			'filter=site_url = "https://example.com" OR site_url = "http://example.com" OR site_url = "https://www.example.com" OR site_url = "http://www.example.com"',
			urldecode( $request->getUri()->getQuery() ),
			'The Web Content Publisher request should filter publications for the current site.'
		);
	}

	public function test_parse_response__normalizes_publications() {
		$content_policy_status = new ContentPolicyStatus();
		$content_policy_status->setPolicyInfoUrl( 'https://example.com/policy-info' );
		$content_policy_status->setState( 'VIOLATION_ACTIVE' );

		$publication = new Publication();
		$publication->setContentPolicyStatus( $content_policy_status );
		$publication->setOnboardingState( 'COMPLETE' );
		$publication->setPaymentOption( 'SUBSCRIPTIONS' );
		$publication->setProducts( array( 'publication-1:basic', 'publication-1:advanced' ) );
		$publication->setPublicationId( 'publication-1' );

		$response = new ListPublicationsResponse();
		$response->setPublications( array( $publication ) );

		$synchronized_publications = null;
		$publications              = $this->get_datapoint(
			$this->get_module(),
			function ( $received_publications ) use ( &$synchronized_publications ) {
				$synchronized_publications = $received_publications;
			}
		)->parse_response( $response, $this->get_data_request() );

		$this->assertIsArray( $publications[0], 'Publication resources should be returned as plain arrays.' );
		$this->assertSame( 'publication-1', $publications[0]['publicationId'], 'The publication ID should be preserved.' );
		$this->assertSame( 'ONBOARDING_COMPLETE', $publications[0]['onboardingState'], 'The onboarding state should be normalized.' );
		$this->assertSame( array( 'publication-1:basic', 'publication-1:advanced' ), wp_list_pluck( $publications[0]['products'], 'name' ), 'The products should be normalized.' );
		$this->assertTrue( $publications[0]['paymentOptions']['subscriptions'], 'The payment option should be normalized.' );
		$this->assertSame( 'CONTENT_POLICY_VIOLATION_ACTIVE', $publications[0]['contentPolicyStatus']['contentPolicyState'], 'The content policy state should be normalized.' );
		$this->assertSame( 'https://example.com/policy-info', $publications[0]['contentPolicyStatus']['policyInfoLink'], 'The policy info URL should be normalized.' );
		$this->assertContainsOnlyInstancesOf( Legacy_Publication::class, $synchronized_publications, 'Legacy publication models should be passed to the synchronization callback.' );
		$this->assertSame( 'publication-1', $synchronized_publications[0]->getPublicationId(), 'The synchronized publication ID should be preserved.' );
		$this->assertSame( 'ONBOARDING_COMPLETE', $synchronized_publications[0]->getOnboardingState(), 'The synchronized publication state should be normalized.' );
		$this->assertSame( array( 'publication-1:basic', 'publication-1:advanced' ), wp_list_pluck( $synchronized_publications[0]->getProducts(), 'name' ), 'The synchronized publication products should use legacy product models.' );
		$this->assertTrue( $synchronized_publications[0]->getPaymentOptions()->getSubscriptions(), 'The synchronized publication payment option should use a legacy payment options model.' );
		$this->assertSame( 'CONTENT_POLICY_VIOLATION_ACTIVE', $synchronized_publications[0]->getContentPolicyStatus()->getContentPolicyState(), 'The synchronized publication policy state should use a legacy content policy model.' );
	}

	public function test_parse_response__handles_empty_publications_response() {
		$publications = $this->get_datapoint( $this->get_module() )->parse_response(
			new ListPublicationsResponse(),
			$this->get_data_request()
		);

		$this->assertSame( array(), $publications, 'An empty API response should return an empty publications array.' );
	}

	private function get_module() {
		$module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module->get_client()->withDefer( true );

		return $module;
	}

	private function get_datapoint( Reader_Revenue_Manager $module, ?callable $synchronize_publication_data = null ) {
		$client = $module->get_client();

		return new Get_Publications(
			array(
				'filter_callback' => 'site_url = "https://example.com" OR site_url = "http://example.com" OR site_url = "https://www.example.com" OR site_url = "http://www.example.com"',
				'service'         => fn () => new Webcontentpublisher( $client ),
				'sync_callback'   => $synchronize_publication_data ?: function () {},
			)
		);
	}

	private function get_data_request() {
		return new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'publications', array() );
	}
}
