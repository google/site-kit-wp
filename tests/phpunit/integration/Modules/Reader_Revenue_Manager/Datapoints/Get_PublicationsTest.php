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
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Publications;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit\Tests\TestCase;
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

	public function set_up() {
		parent::set_up();

		$this->enable_feature( 'rrmExpressSetup' );
	}

	public function test_create_request() {
		$module    = $this->get_module();
		$datapoint = $this->get_datapoint( $module );
		$request   = $datapoint->create_request( $this->get_data_request() );

		$this->assertSame(
			'webcontentpublisher.googleapis.com',
			$request->getUri()->getHost(),
			'The Web Content Publisher list publications endpoint should be used.'
		);
		$this->assertSame(
			'filter=site_url = "https://example.com" OR site_url = "http://example.com" OR site_url = "https://www.example.com" OR site_url = "http://www.example.com"',
			urldecode( $request->getUri()->getQuery() ),
			'The Web Content Publisher request should filter publications for the current site.'
		);
	}

	public function test_get_publications__url() {
		$module    = $this->get_module();
		$datapoint = $this->get_datapoint( $module, 'http://test.com' );
		$request   = $datapoint->create_request( $this->get_data_request() );
		$result    = $datapoint->parse_response( $this->get_publications_list_response(), $this->get_data_request() );

		$this->assertIsArray( $result[0], 'Publications result should contain only publication arrays for URL-based property.' );

		$publication = $result[0];

		$this->assertEquals( 'Test Property', $publication['displayName'], 'Publication display name should be correct.' );
		$this->assertEquals( 'ABCDEFGH', $publication['publicationId'], 'Publication ID should be correct.' );

		$expected_filter = 'filter=' . join(
			' OR ',
			array_map(
				function ( $url ) {
					return sprintf( 'site_url = "%s"', $url );
				},
				URL::permute_site_url( 'http://test.com' )
			)
		);

		$this->assertEquals( $expected_filter, urldecode( $request->getUri()->getQuery() ), 'URL filter should match expected format.' );
	}

	public function test_get_publications__domain() {
		$module    = $this->get_module();
		$datapoint = $this->get_datapoint( $module, 'sc-domain:example.com' );
		$request   = $datapoint->create_request( $this->get_data_request() );
		$result    = $datapoint->parse_response( $this->get_publications_list_response(), $this->get_data_request() );

		$this->assertIsArray( $result[0], 'Publications result should contain only publication arrays for domain-based property.' );

		$publication = $result[0];

		$this->assertEquals( 'Test Property', $publication['displayName'], 'Publication display name should be correct for domain test.' );
		$this->assertEquals( 'ABCDEFGH', $publication['publicationId'], 'Publication ID should be correct for domain test.' );

		$expected_filter = 'filter=' . join(
			' OR ',
			array_map(
				function ( $domain ) {
					return sprintf( 'domain = "%s"', $domain );
				},
				URL::permute_site_hosts( 'example.com' )
			)
		);

		$this->assertEquals( $expected_filter, urldecode( $request->getUri()->getQuery() ), 'Domain filter should match expected format.' );
	}

	public function test_parse_response__synchronizes_matching_publication() {
		$publication_id = 'ABCDEFGH';
		$module         = $this->get_module();

		$module->get_settings()->register();
		$module->get_settings()->set(
			array(
				'organizationID' => 'old-organization',
				'publicationID'  => $publication_id,
			)
		);

		$result = $this->get_datapoint( $module )->parse_response(
			$this->get_publications_list_response_with_details( $publication_id ),
			$this->get_data_request()
		);

		$this->assertIsArray( $result[0], 'Publication lookup used to synchronize settings should return publication arrays.' );

		$this->assertSame(
			'organization-1',
			$module->get_settings()->get()['organizationID'],
			'The matching publication should be passed to publication synchronization.'
		);
	}

	public function test_parse_response__does_not_synchronize_non_matching_publication() {
		$module = $this->get_module();

		$module->get_settings()->register();
		$module->get_settings()->set(
			array(
				'organizationID' => 'old-organization',
				'publicationID'  => 'NON_EXISTENT',
			)
		);

		$this->get_datapoint( $module )->parse_response(
			$this->get_publications_list_response_with_details( 'ABCDEFGH' ),
			$this->get_data_request()
		);

		$this->assertSame(
			'old-organization',
			$module->get_settings()->get()['organizationID'],
			'A non-matching publication should not be passed to publication synchronization.'
		);
	}

	public function test_parse_response__normalizes_publications() {
		$module = $this->get_module();

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

		$publications = $this->get_datapoint( $module )->parse_response( $response, $this->get_data_request() );

		$this->assertIsArray( $publications[0], 'Publication resources should be returned as plain arrays.' );
		$this->assertSame( 'publication-1', $publications[0]['publicationId'], 'The publication ID should be preserved.' );
		$this->assertSame( 'ONBOARDING_COMPLETE', $publications[0]['onboardingState'], 'The onboarding state should be normalized.' );
		$this->assertSame( array( 'publication-1:basic', 'publication-1:advanced' ), wp_list_pluck( $publications[0]['products'], 'name' ), 'The products should be normalized.' );
		$this->assertTrue( $publications[0]['paymentOptions']['subscriptions'], 'The payment option should be normalized.' );
		$this->assertSame( 'CONTENT_POLICY_VIOLATION_ACTIVE', $publications[0]['contentPolicyStatus']['contentPolicyState'], 'The content policy state should be normalized.' );
		$this->assertSame( 'https://example.com/policy-info', $publications[0]['contentPolicyStatus']['policyInfoLink'], 'The policy info URL should be normalized.' );
	}

	public function test_parse_response__handles_empty_publications_response() {
		$publications = $this->get_datapoint( $this->get_module() )->parse_response(
			new ListPublicationsResponse(),
			$this->get_data_request()
		);

		$this->assertSame( array(), $publications, 'An empty API response should return an empty publications array.' );
	}

	private function get_publications_list_response( $publication_id = 'ABCDEFGH', $onboarding_state = 'PENDING_VERIFICATION' ) {
		$publication = new Publication();

		$publication->setPublicationId( $publication_id );
		$publication->setOrganizationId( 'organization-1' );
		$publication->setDisplayName( 'Test Property' );
		$publication->setOnboardingState( $onboarding_state );

		$response = new ListPublicationsResponse();
		$response->setPublications( array( $publication ) );

		return $response;
	}

	private function get_publications_list_response_with_details( $publication_id = 'ABCDEFGH' ) {
		$publication = new Publication();
		$publication->setPublicationId( $publication_id );
		$publication->setOrganizationId( 'organization-1' );
		$publication->setDisplayName( 'Test Property' );
		$publication->setOnboardingState( 'COMPLETE' );
		$publication->setProducts( array( 'testpubID:basic', 'testpubID:advanced' ) );
		$publication->setPaymentOption( 'SUBSCRIPTIONS' );

		$content_policy_status = new ContentPolicyStatus();
		$content_policy_status->setState( 'VIOLATION_ACTIVE' );
		$content_policy_status->setPolicyInfoUrl( 'https://example.com/policy-info' );
		$publication->setContentPolicyStatus( $content_policy_status );

		$response = new ListPublicationsResponse();
		$response->setPublications( array( $publication ) );

		return $response;
	}

	private function get_module() {
		$module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module->get_client()->withDefer( true );

		return $module;
	}

	private function get_datapoint( Reader_Revenue_Manager $module, $property_id = 'https://example.com' ) {
		$client  = $module->get_client();
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Search_Console_Settings::OPTION, array( 'propertyID' => $property_id ) );

		return new Get_Publications(
			array(
				'options'  => $options,
				'service'  => fn () => new Webcontentpublisher( $client ),
				'settings' => $module->get_settings(),
			)
		);
	}

	private function get_data_request() {
		return new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'publications', array() );
	}
}
