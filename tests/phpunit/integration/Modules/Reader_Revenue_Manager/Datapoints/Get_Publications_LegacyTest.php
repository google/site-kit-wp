<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Get_Publications_LegacyTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Publication as Publication_Synchronization;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\ContentPolicyStatus;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\ListPublicationsResponse;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\PaymentOptions;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Product;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Get_Publications_LegacyTest extends TestCase {

	/**
	 * Authentication object.
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Reader_Revenue_Manager object.
	 *
	 * @var Reader_Revenue_Manager
	 */
	private $reader_revenue_manager;

	public function set_up() {
		parent::set_up();

		$context                      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options                = new Options( $context );
		$user                         = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options                 = new User_Options( $context, $user->ID );
		$this->authentication         = new Authentication( $context, $this->options, $user_options );
		$this->reader_revenue_manager = new Reader_Revenue_Manager( $context, $this->options, $user_options, $this->authentication );
	}

	public function test_get_publications__url() {
		$filter = '';

		// Set the Search Console option.
		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'http://test.com' ) );

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( &$filter ) {
				$url = parse_url( $request->getUri() );

				$filter = $url['query'];

				switch ( $url['path'] ) {
					case '/v1/publications':
						return new FulfilledPromise(
							new Response(
								200,
								array(),
								json_encode( $this->get_publications_list_response() )
							)
						);
				}
			}
		);

		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$result = $this->reader_revenue_manager->get_data( 'publications' );

		$this->assertNotWPError( $result, 'Publication lookup for a URL property should not return a WP_Error.' );
		$this->assertContainsOnlyInstancesOf( Publication::class, $result, 'Publications result should contain only Publication instances for URL-based property.' );

		$publication = $result[0];

		$this->assertEquals( 'Test Property', $publication->getDisplayName(), 'Publication display name should be correct.' );
		$this->assertEquals( 'ABCDEFGH', $publication->getPublicationId(), 'Publication ID should be correct.' );

		$expected_filter = 'filter=' . join(
			' OR ',
			array_map(
				function ( $url ) {
					return sprintf( 'site_url = "%s"', $url );
				},
				URL::permute_site_url( 'http://test.com' )
			)
		);

		$this->assertEquals( $expected_filter, urldecode( $filter ), 'URL filter should match expected format.' );
	}

	public function test_get_publications__domain() {
		$filter = '';

		// Set the Search Console option.
		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'sc-domain:example.com' ) );

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( &$filter ) {
				$url = parse_url( $request->getUri() );

				$filter = $url['query'];

				switch ( $url['path'] ) {
					case '/v1/publications':
						return new FulfilledPromise(
							new Response(
								200,
								array(),
								json_encode( $this->get_publications_list_response() )
							)
						);
				}
			}
		);

		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$result = $this->reader_revenue_manager->get_data( 'publications' );

		$this->assertNotWPError( $result, 'Publication lookup for a domain property should not return a WP_Error.' );
		$this->assertContainsOnlyInstancesOf( Publication::class, $result, 'Publications result should contain only Publication instances for domain-based property.' );

		$publication = $result[0];

		$this->assertEquals( 'Test Property', $publication->getDisplayName(), 'Publication display name should be correct for domain test.' );
		$this->assertEquals( 'ABCDEFGH', $publication->getPublicationId(), 'Publication ID should be correct for domain test.' );

		$expected_filter = 'filter=' . join(
			' OR ',
			array_map(
				function ( $domain ) {
					return sprintf( 'domain = "%s"', $domain );
				},
				URL::permute_site_hosts( 'example.com' )
			)
		);

		$this->assertEquals( $expected_filter, urldecode( $filter ), 'Domain filter should match expected format.' );
	}

	public function test_get_publications_synchronizes_settings() {
		$publication_id = 'ABCDEFGH';

		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'http://test.com' ) );

		$this->reader_revenue_manager->get_settings()->register();
		$this->reader_revenue_manager->get_settings()->set(
			array(
				'publicationID'              => $publication_id,
				'publicationOnboardingState' => 'ONBOARDING_ACTION_REQUIRED',
				'productIDs'                 => array(),
				'paymentOption'              => '',
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( $publication_id ) {
				$url = parse_url( $request->getUri() );

				if ( '/v1/publications' === $url['path'] ) {
					return new FulfilledPromise(
						new Response(
							200,
							array(),
							json_encode(
								$this->get_publications_list_response_with_details( $publication_id )
							)
						)
					);
				}

				return new FulfilledPromise( new Response( 200 ) );
			}
		);

		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$result = $this->reader_revenue_manager->get_data( 'publications' );

		$this->assertNotWPError( $result, 'Publication lookup used to synchronize settings should not return a WP_Error.' );

		$settings = $this->reader_revenue_manager->get_settings()->get();

		$this->assertEquals(
			'ONBOARDING_COMPLETE',
			$settings['publicationOnboardingState'],
			'Onboarding state should be updated after fetching publications.'
		);
		$this->assertTrue(
			$settings['publicationOnboardingStateChanged'],
			'Onboarding state changed flag should be true when state changes.'
		);
		$this->assertEquals(
			array( 'testpubID:basic', 'testpubID:advanced' ),
			$settings['productIDs'],
			'Product IDs should be updated after fetching publications.'
		);
		$this->assertEquals(
			'subscriptions',
			$settings['paymentOption'],
			'Payment option should be updated after fetching publications.'
		);
		$this->assertEquals(
			'CONTENT_POLICY_VIOLATION_ACTIVE',
			$settings['contentPolicyState'],
			'Content policy state should be synchronized after fetching publications.'
		);
		$this->assertEquals(
			'https://example.com/policy-info',
			$settings['policyInfoLink'],
			'Policy info link should be synchronized after fetching publications.'
		);
	}

	public function test_get_publications_reschedules_cron() {
		$publication_id = 'ABCDEFGH';

		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'http://test.com' ) );

		$this->reader_revenue_manager->get_settings()->register();
		$this->reader_revenue_manager->get_settings()->set(
			array(
				'publicationID'              => $publication_id,
				'publicationOnboardingState' => 'ONBOARDING_ACTION_REQUIRED',
			)
		);

		wp_schedule_single_event(
			time() + 600,
			Publication_Synchronization::CRON_SYNCHRONIZE_PUBLICATION
		);

		$original_schedule = wp_next_scheduled( Publication_Synchronization::CRON_SYNCHRONIZE_PUBLICATION );
		$this->assertNotFalse( $original_schedule, 'Cron should be scheduled before fetching publications.' );

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( $publication_id ) {
				$url = parse_url( $request->getUri() );

				if ( '/v1/publications' === $url['path'] ) {
					return new FulfilledPromise(
						new Response(
							200,
							array(),
							json_encode(
								$this->get_publications_list_response_with_details( $publication_id )
							)
						)
					);
				}

				return new FulfilledPromise( new Response( 200 ) );
			}
		);

		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$this->reader_revenue_manager->get_data( 'publications' );

		$new_schedule = wp_next_scheduled( Publication_Synchronization::CRON_SYNCHRONIZE_PUBLICATION );

		$this->assertNotFalse( $new_schedule, 'Cron should be rescheduled after fetching publications.' );
		$this->assertNotEquals(
			$original_schedule,
			$new_schedule,
			'Cron schedule should be updated to a new time.'
		);
		$this->assertGreaterThanOrEqual(
			time() + HOUR_IN_SECONDS - 1,
			$new_schedule,
			'Cron should be rescheduled approximately one hour from now.'
		);
	}

	public function test_get_publications_does_not_synchronize_for_non_matching_publication() {
		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'http://test.com' ) );

		$this->reader_revenue_manager->get_settings()->register();
		$this->reader_revenue_manager->get_settings()->set(
			array(
				'publicationID'              => 'NON_EXISTENT',
				'publicationOnboardingState' => 'ONBOARDING_ACTION_REQUIRED',
				'productIDs'                 => array(),
				'paymentOption'              => '',
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) {
				$url = parse_url( $request->getUri() );

				if ( '/v1/publications' === $url['path'] ) {
					return new FulfilledPromise(
						new Response(
							200,
							array(),
							json_encode(
								$this->get_publications_list_response_with_details( 'ABCDEFGH' )
							)
						)
					);
				}

				return new FulfilledPromise( new Response( 200 ) );
			}
		);

		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$this->reader_revenue_manager->get_data( 'publications' );

		$settings = $this->reader_revenue_manager->get_settings()->get();

		$this->assertEquals(
			'ONBOARDING_ACTION_REQUIRED',
			$settings['publicationOnboardingState'],
			'Onboarding state should remain unchanged for non-matching publication.'
		);
		$this->assertEmpty(
			$settings['productIDs'],
			'Product IDs should remain empty for non-matching publication.'
		);
		$this->assertEmpty(
			$settings['paymentOption'],
			'Payment option should remain empty for non-matching publication.'
		);
	}


	protected function get_publications_list_response( $publication_id = 'ABCDEFGH', $onboarding_state = 'PENDING_VERIFICATION' ) {
		$publication = new Publication();

		$publication->setPublicationId( $publication_id );
		$publication->setDisplayName( 'Test Property' );
		$publication->setOnboardingState( $onboarding_state );

		$response = new ListPublicationsResponse();
		$response->setPublications( array( $publication ) );

		return $response;
	}

	protected function get_publications_list_response_with_details( $publication_id = 'ABCDEFGH' ) {
		$basic_product = new Product();
		$basic_product->setName( 'testpubID:basic' );

		$advanced_product = new Product();
		$advanced_product->setName( 'testpubID:advanced' );

		$payment_options                = new PaymentOptions();
		$payment_options->subscriptions = true;

		$publication = new Publication();
		$publication->setPublicationId( $publication_id );
		$publication->setDisplayName( 'Test Property' );
		$publication->setOnboardingState( 'ONBOARDING_COMPLETE' );
		$publication->setProducts( array( $basic_product, $advanced_product ) );
		$publication->setPaymentOptions( $payment_options );

		$content_policy_status = new ContentPolicyStatus();
		$content_policy_status->setContentPolicyState( 'CONTENT_POLICY_VIOLATION_ACTIVE' );
		$content_policy_status->setPolicyInfoLink( 'https://example.com/policy-info' );
		$publication->setContentPolicyStatus( $content_policy_status );

		$response = new ListPublicationsResponse();
		$response->setPublications( array( $publication ) );

		return $response;
	}
}
