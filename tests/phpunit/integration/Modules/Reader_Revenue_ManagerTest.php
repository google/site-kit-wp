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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
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
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
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
		$this->assertEquals( 10, $this->reader_revenue_manager->order ); // Since order is not set, it uses the default value.
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

	public function test_sync_publication_onboarding_state_onboarding_state_unchanged() {
		// Set the Search Console option.
		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'http://test.com' ) );

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( &$filter ) {
				$url    = parse_url( $request->getUri() );
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

	public function test_sync_publication_onboarding_state_onboarding_state_changed() {
		// Set the Search Console option.
		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'http://test.com' ) );

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( &$filter ) {
				$url    = parse_url( $request->getUri() );
				$filter = $url['query'];

				switch ( $url['path'] ) {
					case '/v1/publications':
						return new FulfilledPromise(
							new Response(
								200,
								array(),
								json_encode( $this->get_publications_list_response( 'ABCDEFGH', 'ONBOARDING_COMPLETE' ) )
							)
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

	public function test_sync_publication_onboarding_state_publication_not_found() {
		// Set the Search Console option.
		$this->options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'http://test.com' ) );

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( &$filter ) {
				$url    = parse_url( $request->getUri() );
				$filter = $url['query'];

				switch ( $url['path'] ) {
					case '/v1/publications':
						return new FulfilledPromise(
							new Response(
								200,
								array(),
								json_encode( array() )
							)
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
				'publicationID'              => 'IJKLMNOP',
				'publicationOnboardingState' => 'PENDING_VERIFICATION',
			)
		);

		$this->assertWPError( $result );
		$this->assertEquals( 'publication_not_found', $result->get_error_code() );
	}

	public function test_sync_publication_onboarding_state_no_publication_id() {
		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$result = $this->reader_revenue_manager->set_data(
			'sync-publication-onboarding-state',
			array(
				'publicationOnboardingState' => 'PENDING_VERIFICATION',
			)
		);

		$this->assertWPError( $result );
		$this->assertEquals( 'missing_required_param', $result->get_error_code() );
		$this->assertEquals( 'Request parameter is empty: publicationID.', $result->get_error_message() );
	}

	public function test_sync_publication_onboarding_state_no_publication_onboarding_state() {
		$this->reader_revenue_manager->register();

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$result = $this->reader_revenue_manager->set_data(
			'sync-publication-onboarding-state',
			array(
				'publicationID' => 'ABCDEFGH',
			)
		);

		$this->assertWPError( $result );
		$this->assertEquals( 'missing_required_param', $result->get_error_code() );
		$this->assertEquals( 'Request parameter is empty: publicationOnboardingState.', $result->get_error_message() );
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
		$this->assertStringContainsString( 'https://news.google.com/swg/js/v1/swg-basic.js', $footer_html );
		$this->assertStringContainsString( '(self.SWG_BASIC=self.SWG_BASIC||[]).push(basicSubscriptions=>{basicSubscriptions.init({"type":"NewsArticle","isPartOfType":["Product"],"isPartOfProductId":"' . $publication_id . ':openaccess","clientOptions":{"theme":"light","lang":"en-US"}});});', $footer_html );
	}

	public function data_product_ids__singular() {
		return array(
			'with no product ID configured'            => array(
				array(),
				'',
				'openaccess',
			),
			'with product ID set in settings'          => array(
				array(
					'productID' => 'ABDCEFGH:advanced',
				),
				'',
				'advanced',
			),
			'with product ID set in settings and post' => array(
				array(
					'productID' => 'ABDCEFGH:advanced',
				),
				'openaccess',
				'openaccess',
			),
			'with product ID set in post to none'      => array(
				array(
					'productID' => 'ABDCEFGH:advanced',
				),
				'none',
				'',
			),
		);
	}

	/**
	 * @dataProvider data_product_ids__singular
	 */
	public function test_template_redirect__singular__rrmModuleV2( $settings, $post_product_id, $expected_product_id ) {
		$this->enable_feature( 'rrmModuleV2' );

		$publication_id = 'ABCDEFGH';

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();

		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		remove_all_actions( 'template_redirect' );

		$this->reader_revenue_manager->register();
		$this->reader_revenue_manager->get_settings()->register();
		$this->reader_revenue_manager->get_settings()->merge(
			array_merge(
				array( 'publicationID' => $publication_id ),
				$settings
			)
		);

		// Navigate to a singular post.
		$post_ID = $this->factory()->post->create();
		$this->go_to( get_permalink( $post_ID ) );

		// Set post product ID.
		if ( $post_product_id ) {
			update_post_meta(
				$post_ID,
				'googlesitekit_rrm_' . $publication_id . ':productID',
				$post_product_id
			);
		}

		do_action( 'template_redirect' );
		do_action( 'wp_enqueue_scripts' );

		$footer_html = $this->capture_action( 'wp_footer' );

		if ( $expected_product_id ) {
			$this->assertStringContainsString( 'Google Reader Revenue Manager snippet added by Site Kit', $footer_html );
			$this->assertStringContainsString( 'https://news.google.com/swg/js/v1/swg-basic.js', $footer_html ); // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
			$this->assertStringContainsString( '(self.SWG_BASIC=self.SWG_BASIC||[]).push(basicSubscriptions=>{basicSubscriptions.init({"type":"NewsArticle","isPartOfType":["Product"],"isPartOfProductId":"' . $publication_id . ':' . $expected_product_id . '","clientOptions":{"theme":"light","lang":"en-US"}});});', $footer_html );
		} else {
			$this->assertStringNotContainsString( 'Google Reader Revenue Manager snippet added by Site Kit', $footer_html );
		}
	}

	public function data_product_ids__non_singular() {
		return array(
			'with no product ID configured' => array(
				array(),
				'',
			),
			'with no product ID configured and snippet mode of site wide' => array(
				array(
					'snippetMode' => 'sitewide',
				),
				'openaccess',
			),
			'with product ID set in settings and snippet mode of post_types' => array(
				array(
					'productID' => 'ABDCEFGH:advanced',
				),
				'',
			),
			'with product ID set in settings and snippet mode of site wide' => array(
				array(
					'productID'   => 'ABDCEFGH:advanced',
					'snippetMode' => 'sitewide',
				),
				'advanced',
			),
		);
	}

	/**
	 * @dataProvider data_product_ids__non_singular
	 */
	public function test_template_redirect__non_singular__rrmModuleV2( $settings, $expected_product_id ) {
		$this->enable_feature( 'rrmModuleV2' );

		$publication_id = 'ABCDEFGH';

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();

		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		remove_all_actions( 'template_redirect' );

		$this->reader_revenue_manager->register();
		$this->reader_revenue_manager->get_settings()->register();
		$this->reader_revenue_manager->get_settings()->merge(
			array_merge(
				array( 'publicationID' => $publication_id ),
				$settings
			)
		);

		do_action( 'template_redirect' );
		do_action( 'wp_enqueue_scripts' );

		$footer_html = $this->capture_action( 'wp_footer' );

		if ( $expected_product_id ) {
			$this->assertStringContainsString( 'Google Reader Revenue Manager snippet added by Site Kit', $footer_html );
			$this->assertStringContainsString( 'https://news.google.com/swg/js/v1/swg-basic.js', $footer_html );
			$this->assertStringContainsString( '(self.SWG_BASIC=self.SWG_BASIC||[]).push(basicSubscriptions=>{basicSubscriptions.init({"type":"NewsArticle","isPartOfType":["Product"],"isPartOfProductId":"' . $publication_id . ':' . $expected_product_id . '","clientOptions":{"theme":"light","lang":"en-US"}});});', $footer_html );
		} else {
			$this->assertStringNotContainsString( 'Google Reader Revenue Manager snippet added by Site Kit', $footer_html );
		}
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

		$this->enable_feature( 'rrmModuleV2' );
		$this->reader_revenue_manager->get_settings()->register();

		// Verify `postTypes` field appears when the `snippetMode` is `post_types`.
		$this->assertEqualSets(
			array(
				'reader_revenue_manager_publication_id',
				'reader_revenue_manager_publication_onboarding_state',
				'reader_revenue_manager_snippet_mode',
				'reader_revenue_manager_post_types',
				'reader_revenue_manager_product_id',
				'reader_revenue_manager_available_product_ids',
				'reader_revenue_manager_payment_option',
			),
			array_keys( $this->reader_revenue_manager->get_debug_fields() )
		);

		// Set `snippetMode` to `per_post`.
		$this->reader_revenue_manager->get_settings()->set(
			array(
				'snippetMode' => 'per_post',
			)
		);

		// Verify `postTypes` field does not appear when the `snippetMode` is not `post_types`.
		$this->assertEqualSets(
			array(
				'reader_revenue_manager_publication_id',
				'reader_revenue_manager_publication_onboarding_state',
				'reader_revenue_manager_snippet_mode',
				'reader_revenue_manager_product_id',
				'reader_revenue_manager_available_product_ids',
				'reader_revenue_manager_payment_option',
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

	public function test_product_id_setting_registered() {
		$publication_id = 'ABCDEFGH';
		$this->enable_feature( 'rrmModuleV2' );

		$this->reader_revenue_manager->get_settings()->set(
			array(
				'publicationID' => $publication_id,
			)
		);

		$this->reader_revenue_manager->register();

		$registered = registered_meta_key_exists( 'post', 'googlesitekit_rrm_' . $publication_id . ':productID' );

		$this->assertTrue( $registered );
	}

	public function test_publication_id_empty_product_id_setting_not_registered() {
		$publication_id = 'ABCDEFGH';
		$this->enable_feature( 'rrmModuleV2' );

		$this->reader_revenue_manager->get_settings()->set(
			array(
				'publicationID' => '',
			)
		);

		$this->reader_revenue_manager->register();

		$registered = registered_meta_key_exists( 'post', 'googlesitekit_rrm_' . $publication_id . ':productID' );

		$this->assertFalse( $registered );
	}

	public function test_feature_disabled_product_id_setting_not_registered() {
		$publication_id = 'ABCDEFGH';

		$this->reader_revenue_manager->get_settings()->set(
			array(
				'publicationID' => $publication_id,
			)
		);

		$this->reader_revenue_manager->register();

		$registered = registered_meta_key_exists( 'post', 'googlesitekit_rrm_' . $publication_id . ':productID' );

		$this->assertFalse( $registered );
	}

	public function test_block_editor_script_enqueued() {
		if ( version_compare( get_bloginfo( 'version' ), '5.8', '<' ) ) {
			$this->markTestSkipped( 'This test only runs on WordPress 5.8 and above.' );
		}

		$this->enable_feature( 'rrmModuleV2' );

		$registerable_asset_handles = array_map(
			function ( $asset ) {
				return $asset->get_handle();
			},
			$this->reader_revenue_manager->get_assets()
		);

		$rrm_block_asset_handles = array(
			'blocks-reader-revenue-manager-block-editor-plugin',
			'blocks-reader-revenue-manager-block-editor-plugin-styles',
			'blocks-contribute-with-google',
			'blocks-subscribe-with-google',
			'blocks-reader-revenue-manager-common-editor-styles',
		);

		$missing_handles = array_diff( $rrm_block_asset_handles, $registerable_asset_handles );

		$this->assertEmpty(
			$missing_handles,
			'The following expected asset handles are missing: ' . implode( ', ', $missing_handles )
		);
	}

	/**
	 * @dataProvider data_block_editor_script_not_enqueued
	 */
	public function test_block_editor_script_not_enqueued( $data ) {
		$wp_version_condition = $data['wpVersionCondition'];

		if ( $wp_version_condition && version_compare( get_bloginfo( 'version' ), $wp_version_condition['version'], $wp_version_condition['operator'] ) === false ) {
			$this->markTestSkipped( 'This test only runs on WordPress ' . $wp_version_condition['operator'] . ' ' . $wp_version_condition['version'] . '.' );
		}

		$feature_flag = $data['featureFlag'];

		if ( $feature_flag ) {
			$this->enable_feature( $feature_flag );
		}

		$registerable_asset_handles = array_map(
			function ( $asset ) {
				return $asset->get_handle();
			},
			$this->reader_revenue_manager->get_assets()
		);

		$rrm_block_asset_handles = array(
			'blocks-reader-revenue-manager-block-editor-plugin',
			'blocks-reader-revenue-manager-block-editor-plugin-styles',
			'blocks-contribute-with-google',
			'blocks-subscribe-with-google',
		);

		$present_handles = array_intersect( $rrm_block_asset_handles, $registerable_asset_handles );

		$this->assertEmpty(
			$present_handles,
			'The following block editor handles should not be present: ' . implode( ', ', $present_handles )
		);
	}

	public function data_block_editor_script_not_enqueued() {
		return array(
			'feature flag disabled'                  => array(
				array(
					'featureFlag'        => null,
					'wpVersionCondition' => null,
				),
			),
			'feature flag enabled, WP version < 5.8' => array(
				array(
					'featureFlag'        => 'rrmModuleV2',
					'wpVersionCondition' => array(
						'version'  => '5.8',
						'operator' => '<',
					),
				),
			),
		);
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
					return new FulfilledPromise(
						new Response(
							200,
							array(),
							json_encode( $this->get_publications_list_response() )
						)
					);
				}

				return new FulfilledPromise( new Response( $status_code ) );
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
