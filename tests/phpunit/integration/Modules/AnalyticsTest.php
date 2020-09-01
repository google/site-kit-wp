<?php
/**
 * AnalyticsTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\Analytics\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Screen_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit_Dependencies\Google_Service_Analytics;
use Google\Site_Kit_Dependencies\Google_Service_Analytics_Resource_ManagementWebproperties;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_OrderBy;
use Google\Site_Kit_Dependencies\Google_Service_Analytics_Webproperty;
use \ReflectionMethod;

/**
 * @group Modules
 */
class AnalyticsTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Screen_ContractTests;
	use Module_With_Settings_ContractTests;
	use Module_With_Owner_ContractTests;

	public function test_register() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_filters( 'googlesitekit_module_screens' );
		remove_all_filters( 'googlesitekit_analytics_adsense_linked' );
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'web_stories_story_head' );

		$analytics->register();

		// Test registers scopes.
		$this->assertEquals(
			$analytics->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);

		// Test registers screen.
		$this->assertContains(
			$analytics->get_screen(),
			apply_filters( 'googlesitekit_module_screens', array() )
		);

		$this->assertFalse( get_option( 'googlesitekit_analytics_adsense_linked' ) );
		$this->assertFalse( $analytics->is_connected() );

		// Test actions for tracking opt-out are added.
		$this->assertTrue( has_action( 'wp_head' ) );
		$this->assertTrue( has_action( 'web_stories_story_head' ) );
	}

	public function test_register_template_redirect_amp() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$mock_context = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'is_amp', 'input' ) )->getMock();
		$mock_context->method( 'input' )->will( $this->returnValue( $context->input() ) );
		$mock_context->method( 'is_amp' )->will( $this->returnValue( true ) );

		$analytics = new Analytics( $context );
		$this->force_set_property( $analytics, 'context', $mock_context );

		remove_all_actions( 'template_redirect' );
		$analytics->register();

		remove_all_actions( 'amp_print_analytics' );
		remove_all_actions( 'wp_footer' );
		remove_all_actions( 'amp_post_template_footer' );
		remove_all_actions( 'web_stories_print_analytics' );
		remove_all_filters( 'amp_post_template_data' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'amp_print_analytics' ) );
		$this->assertFalse( has_action( 'wp_footer' ) );
		$this->assertFalse( has_action( 'amp_post_template_footer' ) );
		$this->assertFalse( has_action( 'web_stories_print_analytics' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );

		$analytics->set_data( 'use-snippet', array( 'useSnippet' => true ) );
		$analytics->set_data( 'property-id', array( 'propertyID' => '12345678' ) );

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'amp_print_analytics' ) );
		$this->assertTrue( has_action( 'wp_footer' ) );
		$this->assertTrue( has_action( 'amp_post_template_footer' ) );
		$this->assertTrue( has_action( 'web_stories_print_analytics' ) );
		$this->assertTrue( has_filter( 'amp_post_template_data' ) );
	}

	public function test_register_template_redirect_non_amp() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$mock_context = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'is_amp', 'input' ) )->getMock();
		$mock_context->method( 'input' )->will( $this->returnValue( $context->input() ) );
		$mock_context->method( 'is_amp' )->will( $this->returnValue( false ) );

		$analytics = new Analytics( $context );
		$this->force_set_property( $analytics, 'context', $mock_context );

		remove_all_actions( 'template_redirect' );
		$analytics->register();

		remove_all_actions( 'wp_enqueue_scripts' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_enqueue_scripts' ) );

		$analytics->set_data( 'use-snippet', array( 'useSnippet' => true ) );
		$analytics->set_data( 'property-id', array( 'propertyID' => '12345678' ) );

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_enqueue_scripts' ) );
	}

	public function test_prepare_info_for_js() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$info = $analytics->prepare_info_for_js();

		$this->assertEqualSets(
			array(
				'slug',
				'name',
				'description',
				'cta',
				'sort',
				'homepage',
				'learnMore',
				'group',
				'feature',
				'module_tags',
				'required',
				'autoActivate',
				'internal',
				'screenID',
				'settings',
				'provides',
			),
			array_keys( $info )
		);

		$this->assertEquals( 'analytics', $info['slug'] );
		$this->assertArrayHasKey( 'accountID', $info['settings'] );
		$this->assertArrayHasKey( 'propertyID', $info['settings'] );
		$this->assertArrayHasKey( 'profileID', $info['settings'] );
		$this->assertArrayHasKey( 'internalWebPropertyID', $info['settings'] );
		$this->assertArrayHasKey( 'useSnippet', $info['settings'] );
		$this->assertArrayHasKey( 'trackingDisabled', $info['settings'] );
	}

	public function test_is_connected() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Requires get_data to be connected.
		$this->assertFalse( $analytics->is_connected() );
	}

	public function test_scopes() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/analytics.readonly',
			),
			$analytics->get_scopes()
		);
	}

	public function test_on_deactivation() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options   = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Settings::OPTION, 'test-value' );
		$options->set( 'googlesitekit_analytics_adsense_linked', 'test-linked-value' );

		$analytics->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
		$this->assertOptionNotExists( 'googlesitekit_analytics_adsense_linked' );
	}

	public function test_get_datapoints() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'connection',
				'account-id',
				'property-id',
				'profile-id',
				'internal-web-property-id',
				'use-snippet',
				'create-account-ticket',
				'goals',
				'accounts-properties-profiles',
				'properties-profiles',
				'profiles',
				'tag-permission',
				'report',
				'tracking-disabled',
				'anonymize-ip',
				'create-property',
				'create-profile',
			),
			$analytics->get_datapoints()
		);
	}

	public function test_handle_provisioning_callback() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() ) );

		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		// Ensure admin user has Permissions::MANAGE_OPTIONS cap regardless of authentication.
		add_filter(
			'map_meta_cap',
			function( $caps, $cap ) {
				if ( Permissions::MANAGE_OPTIONS === $cap ) {
					return array( 'manage_options' );
				}
				return $caps;
			},
			99,
			2
		);

		$analytics_module_page_url   = add_query_arg( 'page', 'googlesitekit-module-analytics', admin_url( 'admin.php' ) );
		$account_ticked_id_transient = Analytics::PROVISION_ACCOUNT_TICKET_ID . '::' . get_current_user_id();

		$_GET['gatoscallback']   = '1';
		$_GET['accountTicketId'] = '123456';

		$class  = new \ReflectionClass( Analytics::class );
		$method = $class->getMethod( 'handle_provisioning_callback' );
		$method->setAccessible( true );

		// Results in an error for a mismatch (or no account ticket ID stored from before at all).
		try {
			$method->invokeArgs( $analytics, array() );
			$this->fail( 'Expected redirect to module page with "account_ticket_id_mismatch" error' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				add_query_arg( 'error_code', 'account_ticket_id_mismatch', $analytics_module_page_url ),
				$redirect->get_location()
			);
		}

		// Results in an error when there is an error parameter.
		set_transient( $account_ticked_id_transient, $_GET['accountTicketId'] );
		$_GET['error'] = 'user_cancel';
		try {
			$method->invokeArgs( $analytics, array() );
			$this->fail( 'Expected redirect to module page with "user_cancel" error' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				add_query_arg( 'error_code', 'user_cancel', $analytics_module_page_url ),
				$redirect->get_location()
			);
			// Ensure transient was deleted by the method despite error.
			$this->assertFalse( get_transient( $account_ticked_id_transient ) );
		}
		unset( $_GET['error'] );

		// Results in an error when a parameter (here profileId) is missing.
		set_transient( $account_ticked_id_transient, $_GET['accountTicketId'] );
		$_GET['accountId']     = '12345678';
		$_GET['webPropertyId'] = 'UA-12345678-1';
		try {
			$method->invokeArgs( $analytics, array() );
			$this->fail( 'Expected redirect to module page with "callback_missing_parameter" error' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				add_query_arg( 'error_code', 'callback_missing_parameter', $analytics_module_page_url ),
				$redirect->get_location()
			);
			// Ensure transient was deleted by the method despite error.
			$this->assertFalse( get_transient( $account_ticked_id_transient ) );
		}

		// Set up mock for Analytics web properties API request handler for success case below.
		$webproperties_mock = $this->getMockBuilder( Google_Service_Analytics_Resource_ManagementWebproperties::class )
			->disableOriginalConstructor()
			->setMethods( array( 'get' ) )
			->getMock();

		$analytics_service_mock = $this->getMockBuilder( Google_Service_Analytics::class )
			->disableOriginalConstructor()
			->getMock();

		$analytics_service_mock->management_webproperties = $webproperties_mock;

		$google_services = $class->getParentClass()->getProperty( 'google_services' );
		$google_services->setAccessible( true );
		$google_services->setValue( $analytics, array( 'analytics' => $analytics_service_mock ) );

		// Results in an dashboard redirect on success, with new data being stored.
		set_transient( $account_ticked_id_transient, $_GET['accountTicketId'] );
		$_GET['accountId']     = '12345678';
		$_GET['webPropertyId'] = 'UA-12345678-1';
		$_GET['profileId']     = '987654';
		$expected_internal_id  = '13579';
		$expected_webproperty  = new Google_Service_Analytics_Webproperty();
		$expected_webproperty->setAccountId( $_GET['accountId'] );
		$expected_webproperty->setId( $_GET['webPropertyId'] );
		$expected_webproperty->setDefaultProfileId( $_GET['profileId'] );
		$expected_webproperty->setInternalWebPropertyId( $expected_internal_id );
		$webproperties_mock->expects( $this->once() )
			->method( 'get' )
			->with( $_GET['accountId'], $_GET['webPropertyId'] )
			->willReturn( $expected_webproperty );
		try {
			$method->invokeArgs( $analytics, array() );
			$this->fail( 'Expected redirect to module page with "authentication_success" notification' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				add_query_arg(
					array(
						'page'         => 'googlesitekit-dashboard',
						'notification' => 'authentication_success',
						'slug'         => 'analytics',
					),
					admin_url( 'admin.php' )
				),
				$redirect->get_location()
			);
			// Ensure transient was deleted by the method.
			$this->assertFalse( get_transient( $account_ticked_id_transient ) );
			// Ensure settings were set correctly.
			$this->assertEqualSetsWithIndex(
				array(
					'accountID'             => $_GET['accountId'],
					'propertyID'            => $_GET['webPropertyId'],
					'profileID'             => $_GET['profileId'],
					'internalWebPropertyID' => $expected_internal_id,
					'useSnippet'            => true,
					'anonymizeIP'           => true,
					'adsenseLinked'         => false,
					'trackingDisabled'      => array( 'loggedinUsers' ),
					'ownerID'               => $admin_id,
				),
				$analytics->get_settings()->get()
			);
		}
	}

	/**
	 * @dataProvider tracking_disabled_provider
	 *
	 * @param array $settings
	 * @param bool $logged_in
	 * @param \Closure $assert_opt_out_presence
	 */
	public function test_tracking_disabled( $settings, $logged_in, $assert_opt_out_presence ) {
		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();
		remove_all_actions( 'wp_enqueue_scripts' );
		// Remove irrelevant script from throwing errors in CI from readfile().
		remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
		// Set the current user (can be 0 for no user)
		wp_set_current_user( $logged_in ? $this->factory()->user->create() : 0 );

		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$analytics->get_settings()->set( $settings );

		remove_all_actions( 'template_redirect' );
		$analytics->register();
		do_action( 'template_redirect' );

		$head_html = $this->capture_action( 'wp_head' );
		// Sanity check.
		$this->assertNotEmpty( $head_html );
		// Whether or not tracking is disabled does not affect output of snippet.
		if ( $settings['useSnippet'] ) {
			$this->assertContains( "id={$settings['propertyID']}", $head_html );
		} else {
			$this->assertNotContains( "id={$settings['propertyID']}", $head_html );
		}

		$assert_opt_out_presence( $head_html );
	}

	public function tracking_disabled_provider() {
		$base_settings = array(
			'accountID'             => 123456789,
			'propertyID'            => 'UA-21234567-8',
			'internalWebPropertyID' => 212345678,
			'profileID'             => 321234567,
			'useSnippet'            => true,
			'trackingDisabled'      => array( 'loggedinUsers' ),
		);

		$assert_contains_opt_out     = function ( $html ) {
			$this->assertContains( 'ioo : function() { return true', $html );
		};
		$assert_not_contains_opt_out = function ( $html ) {
			$this->assertNotContains( 'ioo : function() { return true', $html );
		};

		return array(
			// Tracking is active by default for non-logged-in users.
			array(
				$base_settings,
				false,
				$assert_not_contains_opt_out,
			),
			// Tracking is not active for non-logged-in users if snippet is disabled,
			// but opt-out is not added because tracking is not disabled.
			array(
				array_merge( $base_settings, array( 'useSnippet' => false ) ),
				false,
				$assert_not_contains_opt_out,
			),
			// Tracking is not active for logged-in users by default (opt-out expected).
			array(
				$base_settings,
				true,
				$assert_contains_opt_out,
			),
			// Tracking is not active if snippet is disabled for logged in users,
			// but opt-out is not added because tracking is not disabled.
			array(
				array_merge( $base_settings, array( 'useSnippet' => false ) ),
				true,
				$assert_contains_opt_out,
			),
			// Tracking is active for logged-in users if enabled via settings.
			array(
				array_merge( $base_settings, array( 'trackingDisabled' => array() ) ),
				true,
				$assert_not_contains_opt_out,
			),
			// Tracking is still active for guests if disabled for logged in users.
			array(
				array_merge( $base_settings, array( 'trackingDisabled' => array( 'loggedinUsers' ) ) ),
				false,
				$assert_not_contains_opt_out,
			),
		);
	}

	/**
	 * @dataProvider data_parse_account_id
	 */
	public function test_parse_account_id( $property_id, $expected ) {
		$class  = new \ReflectionClass( Analytics::class );
		$method = $class->getMethod( 'parse_account_id' );
		$method->setAccessible( true );

		$result = $method->invokeArgs(
			new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ),
			array( $property_id )
		);
		$this->assertSame( $expected, $result );
	}

	public function data_parse_account_id() {
		return array(
			array(
				'UA-2358017-2',
				'2358017',
			),
			array(
				'UA-13572468-4',
				'13572468',
			),
			array(
				'UA-13572468',
				'',
			),
			array(
				'GTM-13572468',
				'',
			),
			array(
				'13572468',
				'',
			),
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Screen
	 */
	protected function get_module_with_screen() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function test_parse_reporting_orderby() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$reflected_parse_reporting_orderby_method = new ReflectionMethod( 'Google\Site_Kit\Modules\Analytics', 'parse_reporting_orderby' );
		$reflected_parse_reporting_orderby_method->setAccessible( true );

		// When there is no orderby in the request.
		$result = $reflected_parse_reporting_orderby_method->invoke( $analytics, array() );
		$this->assertTrue( is_array( $result ) );
		$this->assertEmpty( $result );

		// When a single order object is used.
		$order  = array(
			'fieldName' => 'views',
			'sortOrder' => 'ASCENDING',
		);
		$result = $reflected_parse_reporting_orderby_method->invoke( $analytics, $order );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 1, count( $result ) );
		$this->assertTrue( $result[0] instanceof Google_Service_AnalyticsReporting_OrderBy );
		$this->assertEquals( 'views', $result[0]->getFieldName() );
		$this->assertEquals( 'ASCENDING', $result[0]->getSortOrder() );

		// When multiple orders are passed.
		$orders = array(
			array(
				'fieldName' => 'pages',
				'sortOrder' => 'DESCENDING',
			),
			array(
				'fieldName' => 'sessions',
				'sortOrder' => 'ASCENDING',
			),
		);
		$result = $reflected_parse_reporting_orderby_method->invoke( $analytics, $orders );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 2, count( $result ) );
		$this->assertTrue( $result[0] instanceof Google_Service_AnalyticsReporting_OrderBy );
		$this->assertEquals( 'pages', $result[0]->getFieldName() );
		$this->assertEquals( 'DESCENDING', $result[0]->getSortOrder() );
		$this->assertTrue( $result[1] instanceof Google_Service_AnalyticsReporting_OrderBy );
		$this->assertEquals( 'sessions', $result[1]->getFieldName() );
		$this->assertEquals( 'ASCENDING', $result[1]->getSortOrder() );

		// Check that it skips invalid orders.
		$orders = array(
			array(
				'fieldName' => 'views',
				'sortOrder' => '',
			),
			array(
				'fieldName' => 'pages',
				'sortOrder' => 'DESCENDING',
			),
			array(
				'fieldName' => '',
				'sortOrder' => 'DESCENDING',
			),
			array(
				'fieldName' => 'sessions',
				'sortOrder' => 'ASCENDING',
			),
		);
		$result = $reflected_parse_reporting_orderby_method->invoke( $analytics, $orders );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 2, count( $result ) );
		$this->assertTrue( $result[0] instanceof Google_Service_AnalyticsReporting_OrderBy );
		$this->assertEquals( 'pages', $result[0]->getFieldName() );
		$this->assertEquals( 'DESCENDING', $result[0]->getSortOrder() );
		$this->assertTrue( $result[1] instanceof Google_Service_AnalyticsReporting_OrderBy );
		$this->assertEquals( 'sessions', $result[1]->getFieldName() );
		$this->assertEquals( 'ASCENDING', $result[1]->getSortOrder() );
	}

}
