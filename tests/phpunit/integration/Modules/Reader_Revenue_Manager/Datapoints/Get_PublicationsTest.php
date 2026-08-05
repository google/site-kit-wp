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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Setting_Exception;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Publications;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronize_Publication;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
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

	public function test_create_request__uses_legacy_service_for_url_property() {
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
		$this->assertSame( 'filter=site_url%20%3D%20%22https%3A%2F%2Fexample.com%22%20OR%20site_url%20%3D%20%22http%3A%2F%2Fexample.com%22%20OR%20site_url%20%3D%20%22https%3A%2F%2Fwww.example.com%22%20OR%20site_url%20%3D%20%22http%3A%2F%2Fwww.example.com%22', $request->getUri()->getQuery(), 'The legacy publication filter should include all site URL permutations.' );
	}

	public function test_create_request__uses_legacy_service_for_domain_property() {
		$module = $this->get_module();
		$client = $module->get_client();

		$datapoint = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new SubscribewithGoogle( $client );
			},
			'sc-domain:example.com'
		);

		$request = $datapoint->create_request( $this->get_data_request() );

		$this->assertSame( '/v1/publications', $request->getUri()->getPath(), 'The legacy list publications endpoint should be used.' );
		$this->assertSame(
			'filter=domain = "example.com" OR domain = "www.example.com"',
			urldecode( $request->getUri()->getQuery() ),
			'The legacy publication filter should include all site domain permutations.'
		);
	}

	public function test_create_request__uses_new_service() {
		$module = $this->get_module();
		$module->get_settings()->register();
		$module->get_settings()->set( array( 'organizationID' => 'organization-1' ) );
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
		$module = $this->get_module();
		$client = $module->get_client();

		$datapoint = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new Webcontentpublisher( $client );
			}
		);

		$this->expectException( Missing_Required_Setting_Exception::class );
		$this->expectExceptionMessage( 'Required setting is missing: organizationID.' );

		$datapoint->create_request( $this->get_data_request() );
	}

	public function test_parse_response__normalizes_and_synchronizes_new_publications() {
		$module = $this->get_module();
		$module->get_settings()->register();
		$module->get_settings()->set(
			array(
				'publicationID'              => 'publication-1',
				'publicationOnboardingState' => 'ONBOARDING_ACTION_REQUIRED',
				'productIDs'                 => array(),
				'paymentOption'              => '',
			)
		);
		$client = $module->get_client();

		$datapoint = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new Webcontentpublisher( $client );
			}
		);

		$response = new ListPublicationsResponse();
		$response->setPublications(
			array(
				new Publication(
					array(
						'contentPolicyStatus' => array(
							'policyInfoUrl' => 'https://example.com/policy-info',
							'state'         => 'VIOLATION_ACTIVE',
						),
						'onboardingState'     => 'COMPLETE',
						'paymentOption'       => 'SUBSCRIPTIONS',
						'products'            => array( 'publication-1:basic', 'publication-1:advanced' ),
						'publicationId'       => 'publication-1',
					)
				),
			)
		);

		wp_schedule_single_event(
			time() + 600,
			Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION
		);
		$original_schedule = wp_next_scheduled( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );

		$publications = $datapoint->parse_response( $response, $this->get_data_request() );
		$settings     = $module->get_settings()->get();
		$new_schedule = wp_next_scheduled( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );

		$this->assertContainsOnlyInstancesOf( Legacy_Publication::class, $publications, 'New publication resources should be normalized to the legacy model.' );
		$this->assertSame( 'ONBOARDING_COMPLETE', $publications[0]->getOnboardingState(), 'The onboarding state should be normalized.' );
		$this->assertSame( 'ONBOARDING_COMPLETE', $settings['publicationOnboardingState'], 'The connected publication onboarding state should be synchronized.' );
		$this->assertTrue( $settings['publicationOnboardingStateChanged'], 'The onboarding state changed flag should be set when the state changes.' );
		$this->assertSame( array( 'publication-1:basic', 'publication-1:advanced' ), $settings['productIDs'], 'The connected publication product IDs should be synchronized.' );
		$this->assertSame( 'subscriptions', $settings['paymentOption'], 'The connected publication payment option should be synchronized.' );
		$this->assertSame( 'CONTENT_POLICY_VIOLATION_ACTIVE', $settings['contentPolicyState'], 'The connected publication content policy state should be synchronized.' );
		$this->assertSame( 'https://example.com/policy-info', $settings['policyInfoLink'], 'The connected publication policy info link should be synchronized.' );
		$this->assertNotFalse( $new_schedule, 'The publication synchronization cron should remain scheduled.' );
		$this->assertNotSame( $original_schedule, $new_schedule, 'The publication synchronization cron should be rescheduled.' );
		$this->assertGreaterThanOrEqual( time() + HOUR_IN_SECONDS - 1, $new_schedule, 'The publication synchronization cron should be rescheduled approximately one hour from now.' );

		wp_unschedule_event( $new_schedule, Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );
	}

	public function test_parse_response__does_not_synchronize_non_matching_publication() {
		$module = $this->get_module();
		$module->get_settings()->register();
		$module->get_settings()->set(
			array(
				'publicationID'              => 'publication-1',
				'publicationOnboardingState' => 'ONBOARDING_ACTION_REQUIRED',
				'productIDs'                 => array( 'publication-1:existing' ),
				'paymentOption'              => 'contributions',
			)
		);
		$client = $module->get_client();

		$datapoint = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new Webcontentpublisher( $client );
			}
		);

		$response = new ListPublicationsResponse();
		$response->setPublications(
			array(
				new Publication(
					array(
						'onboardingState' => 'COMPLETE',
						'paymentOption'   => 'SUBSCRIPTIONS',
						'products'        => array( 'publication-2:basic' ),
						'publicationId'   => 'publication-2',
					)
				),
			)
		);

		$datapoint->parse_response( $response, $this->get_data_request() );

		$settings = $module->get_settings()->get();

		$this->assertSame( 'ONBOARDING_ACTION_REQUIRED', $settings['publicationOnboardingState'], 'The onboarding state should remain unchanged for a non-matching publication.' );
		$this->assertFalse( $settings['publicationOnboardingStateChanged'], 'The onboarding state changed flag should remain false for a non-matching publication.' );
		$this->assertSame( array( 'publication-1:existing' ), $settings['productIDs'], 'The product IDs should remain unchanged for a non-matching publication.' );
		$this->assertSame( 'contributions', $settings['paymentOption'], 'The payment option should remain unchanged for a non-matching publication.' );
		$this->assertFalse( wp_next_scheduled( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION ), 'The synchronization cron should not be scheduled for a non-matching publication.' );
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
		$module = $this->get_module();
		$client = $module->get_client();

		$datapoint = $this->get_datapoint(
			$module,
			function () use ( $client ) {
				return new Webcontentpublisher( $client );
			}
		);

		$publications = $datapoint->parse_response( new ListPublicationsResponse(), $this->get_data_request() );

		$this->assertSame( array(), $publications, 'An empty API response should return an empty publications array.' );
	}

	private function get_module() {
		$module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module->get_client()->withDefer( true );

		return $module;
	}

	private function get_datapoint( Reader_Revenue_Manager $module, callable $service, $property_id = 'https://example.com' ) {
		$search_console_settings = new Search_Console_Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$search_console_settings->set( array( 'propertyID' => $property_id ) );

		return new Get_Publications(
			array(
				'search_console_settings' => $search_console_settings,
				'service'                 => $service,
				'settings'                => $module->get_settings(),
			)
		);
	}

	private function get_data_request() {
		return new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'publications', array() );
	}
}
