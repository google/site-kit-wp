<?php
/**
 * Reader_Revenue_ManagerTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Service_Entity_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\ListPublicationsResponse;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class Reader_Revenue_ManagerTest extends TestCase {

	use Module_With_Owner_ContractTests;
	use Module_With_Scopes_ContractTests;
	use Module_With_Service_Entity_ContractTests;
	use Module_With_Settings_ContractTests;

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

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

		$this->context                = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options                = new Options( $this->context );
		$user                         = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options                 = new User_Options( $this->context, $user->ID );
		$this->authentication         = new Authentication( $this->context, $this->options, $user_options );
		$this->reader_revenue_manager = new Reader_Revenue_Manager( $this->context, $this->options, $user_options, $this->authentication );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$this->reader_revenue_manager->register();

		$this->assertEquals(
			$this->reader_revenue_manager->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
	}

	public function test_magic_methods() {
		$this->assertEquals( 'reader-revenue-manager', $this->reader_revenue_manager->slug );
		$this->assertEquals( 'Reader Revenue Manager', $this->reader_revenue_manager->name );
		$this->assertEquals( 'https://publishercenter.google.com', $this->reader_revenue_manager->homepage );
		$this->assertEquals( 'Reader Revenue Manager helps publishers grow, retain, and engage their audiences, creating new revenue opportunities', $this->reader_revenue_manager->description );
		$this->assertEquals( 5, $this->reader_revenue_manager->order );
	}

	public function test_get_scopes() {
		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/subscribewithgoogle.publications.readonly',
			),
			$this->reader_revenue_manager->get_scopes()
		);
	}

	public function test_service_classes_exist() {
		$this->assertTrue(
			class_exists( 'Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle' )
		);
	}

	public function test_get_datapoints() {
		$this->assertEqualSets(
			array(
				'publications',
				'sync-publication-onboarding-state',
			),
			$this->reader_revenue_manager->get_datapoints()
		);
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
						return new Response(
							200,
							array(),
							json_encode( $this->get_publications_list_response() )
						);
				}
			}
		);

		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$result = $this->reader_revenue_manager->get_data( 'publications' );

		$this->assertNotWPError( $result );
		$this->assertContainsOnlyInstancesOf( Publication::class, $result );

		$publication = $result[0];

		$this->assertEquals( 'Test Property', $publication->getDisplayName() );
		$this->assertEquals( 'ABCDEFGH', $publication->getPublicationId() );

		$expected_filter = 'filter=' . join(
			' OR ',
			array_map(
				function ( $url ) {
					return sprintf( 'site_url = "%s"', $url );
				},
				URL::permute_site_url( 'http://test.com' )
			)
		);

		$this->assertEquals( $expected_filter, urldecode( $filter ) );
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
						return new Response(
							200,
							array(),
							json_encode( $this->get_publications_list_response() )
						);
				}
			}
		);

		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$result = $this->reader_revenue_manager->get_data( 'publications' );

		$this->assertNotWPError( $result );
		$this->assertContainsOnlyInstancesOf( Publication::class, $result );

		$publication = $result[0];

		$this->assertEquals( 'Test Property', $publication->getDisplayName() );
		$this->assertEquals( 'ABCDEFGH', $publication->getPublicationId() );

		$expected_filter = 'filter=' . join(
			' OR ',
			array_map(
				function ( $domain ) {
					return sprintf( 'domain = "%s"', $domain );
				},
				URL::permute_site_hosts( 'example.com' )
			)
		);

		$this->assertEquals( $expected_filter, urldecode( $filter ) );
	}

	public function test_sync_publication_onboarding_state_returns_empty_object() {
		// Set the Search Console option.
		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'http://test.com' ) );

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( &$filter ) {
				$url    = parse_url( $request->getUri() );
				$filter = $url['query'];

				switch ( $url['path'] ) {
					case '/v1/publications':
						return new Response(
							200,
							array(),
							json_encode( $this->get_publications_list_response() )
						);
				}
			}
		);

		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$result = $this->reader_revenue_manager->set_data(
			'sync-publication-onboarding-state',
			array(
				'publicationID'              => 'ABCDEFGH',
				'publicationOnboardingState' => 'PENDING_VERIFICATION',
			)
		);

		$this->assertNotWPError( $result );
		$this->assertEquals( (object) array(), $result );
	}

	public function test_sync_publication_onboarding_state_returns_new_state() {
		// Set the Search Console option.
		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'http://test.com' ) );

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( &$filter ) {
				$url    = parse_url( $request->getUri() );
				$filter = $url['query'];

				switch ( $url['path'] ) {
					case '/v1/publications':
						return new Response(
							200,
							array(),
							json_encode( $this->get_publications_list_response( 'ABCDEFGH', 'ONBOARDING_COMPLETE' ) )
						);
				}
			}
		);

		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$this->reader_revenue_manager->get_settings()->set(
			array(
				'publicationID'              => 'ABCDEFGH',
				'publicationOnboardingState' => 'ONBOARDING_ACTION_REQUIRED',
			)
		);

		$result = $this->reader_revenue_manager->set_data(
			'sync-publication-onboarding-state',
			array(
				'publicationID'              => 'ABCDEFGH',
				'publicationOnboardingState' => 'ONBOARDING_ACTION_REQUIRED',
			)
		);

		$this->assertNotWPError( $result );
		$this->assertEquals( 'ONBOARDING_COMPLETE', $result->publicationOnboardingState );
		$this->assertEquals( 'ABCDEFGH', $result->publicationID );
	}

	public function test_sync_publication_onboarding_state_should_not_return_isSavedSetting_property() {
		// Set the Search Console option.
		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'http://test.com' ) );

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( &$filter ) {
				$url    = parse_url( $request->getUri() );
				$filter = $url['query'];

				switch ( $url['path'] ) {
					case '/v1/publications':
						return new Response(
							200,
							array(),
							json_encode( $this->get_publications_list_response( 'ABCDEFGH', 'ONBOARDING_COMPLETE' ) )
						);
				}
			}
		);

		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$this->reader_revenue_manager->get_settings()->set(
			array(
				'publicationID'              => 'PQRSTUVWX',
				'publicationOnboardingState' => 'ONBOARDING_ACTION_REQUIRED',
			)
		);

		$result = $this->reader_revenue_manager->set_data(
			'sync-publication-onboarding-state',
			array(
				'publicationID'              => 'ABCDEFGH',
				'publicationOnboardingState' => 'ONBOARDING_ACTION_REQUIRED',
			)
		);

		$this->assertNotWPError( $result );
		$this->assertEquals( 'ONBOARDING_COMPLETE', $result->publicationOnboardingState );
		$this->assertFalse( property_exists( $result, 'isSavedSetting' ) );
	}

	public function test_is_connected() {
		$options                = new Options( $this->context );
		$reader_revenue_manager = new Reader_Revenue_Manager( $this->context, $options );

		$this->assertFalse( $reader_revenue_manager->is_connected() );

		$options->set(
			Settings::OPTION,
			array(
				'publicationID' => 'ABCDEFGH',
			)
		);

		$this->assertTrue( $reader_revenue_manager->is_connected() );
	}

	public function test_on_deactivation() {
		$options = new Options( $this->context );
		$options->set( Settings::OPTION, 'test-value' );

		$reader_revenue_manager = new Reader_Revenue_Manager( $this->context, $options );
		$reader_revenue_manager->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_template_redirect() {
		$publication_id = 'ABCDEFGH';

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();

		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		remove_all_actions( 'template_redirect' );

		$this->reader_revenue_manager->register();
		$this->reader_revenue_manager->get_settings()->set(
			array(
				'publicationID' => $publication_id,
			)
		);

		// Navigate to a singular post.
		$post_ID = $this->factory()->post->create();
		$this->go_to( get_permalink( $post_ID ) );

		do_action( 'template_redirect' );
		do_action( 'wp_enqueue_scripts' );

		$footer_html = $this->capture_action( 'wp_footer' );

		$this->assertStringContainsString( 'Google Reader Revenue Manager snippet added by Site Kit', $footer_html );
		$this->assertStringContainsString( '<script type="text/javascript" src="https://news.google.com/swg/js/v1/swg-basic.js" id="google_swgjs-js" async="async" data-wp-strategy="async"></script>', $footer_html ); // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
		$this->assertStringContainsString( '(self.SWG_BASIC=self.SWG_BASIC||[]).push(basicSubscriptions=>{basicSubscriptions.init({"type":"NewsArticle","isPartOfType":["Product"],"isPartOfProductId":"' . $publication_id . ':openaccess","clientOptions":{"theme":"light","lang":"en-US"}});});', $footer_html );
	}

	public function test_get_debug_fields() {
		$this->reader_revenue_manager->get_settings()->register();

		$this->assertEqualSets(
			array(
				'reader_revenue_manager_publication_id',
				'reader_revenue_manager_publication_onboarding_state',
			),
			array_keys( $this->reader_revenue_manager->get_debug_fields() )
		);
	}

	public function test_check_service_entity_access_no_access_unavailable_publication() {
		$module = $this->get_module_with_service_entity();

		$this->mock_service_entity_access( $module, 200 );
		$this->set_up_check_service_entity_access( $module );

		// Change saved publication to one that is not available.
		$module->get_settings()->merge(
			array(
				'publicationID' => 'IJKLMNOP',
			)
		);

		$access = $module->check_service_entity_access();

		$this->assertNotWPError( $access );
		$this->assertEquals( false, $access );
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return $this->reader_revenue_manager;
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return $this->reader_revenue_manager;
	}

	/**
	 * @return Module_With_Settings
	 */
	public function get_module_with_settings() {
		return $this->reader_revenue_manager;
	}

	/**
	 * @return Module|Module_With_Service_Entity|Module_With_Settings
	 */
	protected function get_module_with_service_entity() {
		return $this->reader_revenue_manager;
	}

	protected function set_up_check_service_entity_access( Module_With_Settings $module ) {
		$module->get_settings()->set(
			array(
				'publicationID' => 'ABCDEFGH',
			)
		);
	}

	protected function mock_service_entity_access( Module $module, $status_code ) {
		FakeHttp::fake_google_http_handler(
			$module->get_client(),
			function () use ( $status_code ) {
				if ( 200 === $status_code ) {
					return new Response(
						200,
						array(),
						json_encode( $this->get_publications_list_response() )
					);
				}

				return new Response( $status_code );
			}
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
}
