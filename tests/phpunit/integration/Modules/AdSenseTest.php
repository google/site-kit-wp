<?php
/**
 * AdSenseTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag;
use Google\Site_Kit\Modules\AdSense\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Service_Entity_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\AdBlockingRecoveryTag;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\Alert;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\ListAlertsResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use ReflectionMethod;
use WP_REST_Request;

/**
 * @group Modules+
 * @group AdSense
 */
class AdSenseTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Settings_ContractTests;
	use Module_With_Owner_ContractTests;
	use Module_With_Service_Entity_ContractTests;

	public function test_register() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$this->assertEmpty( apply_filters( 'googlesitekit_auth_scopes', array() ) );

		$adsense->register();

		$this->assertNotEmpty( apply_filters( 'googlesitekit_auth_scopes', array() ) );
	}

	public function test_register_template_redirect_amp() {
		$context = $this->get_amp_primary_context();
		$adsense = new AdSense( $context );

		remove_all_actions( 'template_redirect' );
		$adsense->register();

		remove_all_actions( 'wp_body_open' );
		remove_all_filters( 'the_content' );
		remove_all_filters( 'amp_post_template_data' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_body_open' ) );
		$this->assertFalse( has_filter( 'the_content' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );

		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_body_open' ) );
		$this->assertTrue( has_filter( 'the_content' ) );
		$this->assertTrue( has_filter( 'amp_post_template_data' ) );

		// Tag not hooked when blocked.
		remove_all_actions( 'wp_body_open' );
		remove_all_filters( 'the_content' );
		remove_all_filters( 'amp_post_template_data' );
		add_filter( 'googlesitekit_adsense_tag_amp_blocked', '__return_true' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_body_open' ) );
		$this->assertFalse( has_filter( 'the_content' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );

		// Tag hooked when AMP specifically not blocked.
		add_filter( 'googlesitekit_adsense_tag_amp_blocked', '__return_false' );

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_body_open' ) );
		$this->assertTrue( has_filter( 'the_content' ) );
		$this->assertTrue( has_filter( 'amp_post_template_data' ) );
	}

	public function test_register_template_redirect_non_amp() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$adsense = new AdSense( $context );

		remove_all_actions( 'template_redirect' );
		$adsense->register();

		remove_all_actions( 'wp_head' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_head' ) );

		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_head' ) );

		// Tag not hooked when blocked.
		remove_all_actions( 'wp_head' );
		add_filter( 'googlesitekit_adsense_tag_blocked', '__return_true' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_head' ) );

		// Tag hooked when only AMP blocked.
		remove_all_actions( 'wp_head' );
		add_filter( 'googlesitekit_adsense_tag_blocked', '__return_false' );
		add_filter( 'googlesitekit_adsense_tag_amp_blocked', '__return_true' );

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_head' ) );
	}

	/**
	 * @dataProvider block_on_consent_provider
	 * @param bool $enabled
	 */
	public function test_block_on_consent_non_amp( $enabled ) {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_head' );
		$adsense->register();

		do_action( 'template_redirect' );

		if ( $enabled ) {
			add_filter( 'googlesitekit_adsense_tag_block_on_consent', '__return_true' );
		}

		$output = $this->capture_action( 'wp_head' );

		$this->assertStringContainsString( 'Google AdSense snippet added by Site Kit', $output );

		$this->assertStringContainsString( 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-12345678&amp;host=ca-host-pub-2644536267352236', $output );

		if ( $enabled ) {
			$this->assertMatchesRegularExpression( '/\sdata-block-on-consent\b/', $output );
		} else {
			$this->assertDoesNotMatchRegularExpression( '/\sdata-block-on-consent\b/', $output );
		}
	}

	public function test_adsense_platform_tags() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_head' );

		$adsense->register();

		do_action( 'template_redirect' );

		$output = $this->capture_action( 'wp_head' );

		$this->assertStringContainsString( 'google-adsense-platform-account', $output );
		$this->assertStringContainsString( 'ca-host-pub-2644536267352236', $output );

		$this->assertStringContainsString( 'google-adsense-platform-domain', $output );
		$this->assertStringContainsString( 'sitekit.withgoogle.com', $output );

	}

	/**
	 * @dataProvider block_on_consent_provider
	 * @param bool $enabled
	 */
	public function test_block_on_consent_amp( $enabled ) {
		$adsense = new AdSense( $this->get_amp_primary_context() );
		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_body_open' );
		$adsense->register();

		do_action( 'template_redirect' );

		if ( $enabled ) {
			add_filter( 'googlesitekit_adsense_tag_amp_block_on_consent', '__return_true' );
		}

		$output = $this->capture_action( 'wp_body_open' );

		$this->assertStringContainsString( 'Google AdSense AMP snippet added by Site Kit', $output );

		$this->assertStringContainsString( 'data-ad-client="ca-pub-12345678"', $output );

		if ( $enabled ) {
			$this->assertMatchesRegularExpression( '/\sdata-block-on-consent\b/', $output );
		} else {
			$this->assertDoesNotMatchRegularExpression( '/\sdata-block-on-consent\b/', $output );
		}
	}

	/**
	 * @dataProvider block_on_consent_provider
	 * @param bool $enabled
	 */
	public function test_block_on_consent_amp_content( $enabled ) {
		$adsense = new AdSense( $this->get_amp_primary_context() );
		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'the_content' );
		$adsense->register();

		do_action( 'template_redirect' );

		if ( $enabled ) {
			add_filter( 'googlesitekit_adsense_tag_amp_block_on_consent', '__return_true' );
		}

		// We need to fake the global to allow the hook to add the tag.
		global $wp_query;
		$wp_query->in_the_loop = true;

		$output = apply_filters( 'the_content', 'test content' );

		$this->assertStringContainsString( 'Google AdSense AMP snippet added by Site Kit', $output );

		$this->assertStringContainsString( 'data-ad-client="ca-pub-12345678"', $output );

		if ( $enabled ) {
			$this->assertMatchesRegularExpression( '/\sdata-block-on-consent\b/', $output );
		} else {
			$this->assertDoesNotMatchRegularExpression( '/\sdata-block-on-consent\b/', $output );
		}
	}

	public function block_on_consent_provider() {
		return array(
			'default (disabled)' => array(
				false,
			),
			'enabled'            => array(
				true,
			),
		);
	}

	/**
	 * @dataProvider data_amp_auto_ads_tag_in_the_loop
	 * @param Context $context
	 */
	public function test_amp_auto_ads_tag_in_the_loop( $context ) {
		$adsense = new AdSense( $context );
		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'the_content' );
		$adsense->register();

		do_action( 'template_redirect' );

		// Confirm that the tag is not added if we're not in the loop.
		$output = apply_filters( 'the_content', 'test content' );
		$this->assertStringNotContainsString( 'data-ad-client="ca-pub-12345678"', $output );

		// We need to fake the global to allow the hook to add the tag.
		global $wp_query;
		$wp_query->in_the_loop = true;

		// Confirm that the tag is added when in the loop.
		$output = apply_filters( 'the_content', 'test content' );
		$this->assertStringContainsString( 'data-ad-client="ca-pub-12345678"', $output );
	}

	public function data_amp_auto_ads_tag_in_the_loop() {
		return array(
			'primary'   => array(
				$this->get_amp_primary_context(),
			),
			'secondary' => array(
				$this->get_amp_secondary_context(),
			),
		);
	}

	public function test_get_module_scope() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertContains(
			'https://www.googleapis.com/auth/adsense.readonly',
			$adsense->get_scopes()
		);
	}

	public function test_set_data__sync_ad_blocking_recovery_tags() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $user->ID );
		$authentication = new Authentication( $context, $options, $user_options );
		$adsense        = new AdSense( $context, $options, $user_options, $authentication );

		$authentication->get_oauth_client()->set_granted_scopes(
			$adsense->get_scopes()
		);

		$adsense->get_settings()->merge( array( 'accountID' => 'pub-1234567890' ) );

		FakeHttp::fake_google_http_handler(
			$adsense->get_client(),
			function() {
				$response = new AdBlockingRecoveryTag();
				$response->setTag( 'test-recovery-tag' );
				$response->setErrorProtectionCode( 'test-error-protection-code' );

				return new Response( 200, array(), json_encode( $response ) );
			}
		);

		// Assert that the tags are not available in database before fetching.
		$this->assertOptionNotExists( Ad_Blocking_Recovery_Tag::OPTION );

		$response = $adsense->set_data( 'sync-ad-blocking-recovery-tags', array() );

		// Assert API response.
		$this->assertNotWPError( $response );
		$this->assertEqualSetsWithIndex( array( 'success' => true ), $response->get_data() );

		// Assert that the tags are available in database after fetching.
		$this->assertOptionExists( Ad_Blocking_Recovery_Tag::OPTION );
	}

	public function test_get_data__notifications() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $user->ID );
		$authentication = new Authentication( $context, $options, $user_options );
		$adsense        = new AdSense( $context, $options, $user_options, $authentication );

		$authentication->get_oauth_client()->set_granted_scopes(
			$adsense->get_scopes()
		);

		FakeHttp::fake_google_http_handler(
			$adsense->get_client(),
			function() {
				$mock_alert_severe = new Alert();
				$mock_alert_severe->setSeverity( 'SEVERE' );

				$mock_alert_warning = new Alert();
				$mock_alert_warning->setSeverity( 'WARNING' );

				$response = new ListAlertsResponse();
				$response->setAlerts( array( $mock_alert_severe, $mock_alert_warning ) );

				return new Response( 200, array(), json_encode( $response ) );
			}
		);

		// Should return empty array when account ID is not available in settings.
		$response = $adsense->get_data( 'notifications' );
		$this->assertCount( 0, $response );

		// Should return an array of `adsense-notification` with `SEVERE` severity when account ID is available.
		$adsense->get_settings()->merge( array( 'accountID' => 'pub-1234567890' ) );

		$response = $adsense->get_data( 'notifications' );
		$this->assertNotWPError( $response );
		$this->assertCount( 1, $response );
	}

	public function test_get_data__alerts() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $user->ID );
		$authentication = new Authentication( $context, $options, $user_options );
		$adsense        = new AdSense( $context, $options, $user_options, $authentication );

		$authentication->get_oauth_client()->set_granted_scopes(
			$adsense->get_scopes()
		);

		FakeHttp::fake_google_http_handler(
			$adsense->get_client(),
			function() {
				$mock_alert_severe = new Alert();
				$mock_alert_severe->setSeverity( 'SEVERE' );

				$mock_alert_warning = new Alert();
				$mock_alert_warning->setSeverity( 'WARNING' );

				$response = new ListAlertsResponse();
				$response->setAlerts( array( $mock_alert_severe, $mock_alert_warning ) );

				return new Response( 200, array(), json_encode( $response ) );
			}
		);

		// Should return WP Error when account ID is not provided.
		$response = $adsense->get_data( 'alerts' );
		$this->assertWPError( $response );

		// Should return an array of alerts when account ID is provided.
		$response = $adsense->get_data( 'alerts', array( 'accountID' => 'pub-1234567890' ) );
		$this->assertNotWPError( $response );
		$this->assertCount( 2, $response );
		$this->assertInstanceOf( 'Google\Site_Kit_Dependencies\Google\Service\Adsense\Alert', $response[0] );
		$this->assertInstanceOf( 'Google\Site_Kit_Dependencies\Google\Service\Adsense\Alert', $response[1] );
	}

	public function test_is_connected() {
		$adsense  = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$settings = $options->get( Settings::OPTION );

		$this->assertFalse( $settings['accountSetupComplete'] );
		$this->assertFalse( $settings['siteSetupComplete'] );
		$this->assertFalse( $adsense->is_connected() );

		$options->set(
			Settings::OPTION,
			array(
				'accountSetupComplete' => true,
				'siteSetupComplete'    => true,
			)
		);
		$this->assertTrue( $adsense->is_connected() );
	}

	public function test_on_deactivation() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$options->set( Settings::OPTION, 'test-value-settings' );
		$options->set( Ad_Blocking_Recovery_Tag::OPTION, 'test-value-ad-blocking-recovery-tag' );
		$this->assertOptionExists( Settings::OPTION );
		$this->assertOptionExists( Ad_Blocking_Recovery_Tag::OPTION );

		$adsense->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
		$this->assertOptionNotExists( Ad_Blocking_Recovery_Tag::OPTION );
	}

	public function test_get_datapoints() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'notifications',
				'accounts',
				'alerts',
				'clients',
				'urlchannels',
				'report',
				'adunits',
				'sites',
				'sync-ad-blocking-recovery-tags',
			),
			$adsense->get_datapoints()
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module|Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Service_Entity
	 */
	protected function get_module_with_service_entity() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	protected function set_up_check_service_entity_access( Module $module ) {
		$module->get_settings()->merge(
			array(
				'accountID' => 'pub-12345678',
			)
		);
	}

	public function test_parse_earnings_orderby() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$reflected_parse_earnings_orderby_method = new ReflectionMethod( 'Google\Site_Kit\Modules\AdSense', 'parse_earnings_orderby' );
		$reflected_parse_earnings_orderby_method->setAccessible( true );

		// When there is no orderby in the request.
		$result = $reflected_parse_earnings_orderby_method->invoke( $adsense, array() );
		$this->assertTrue( is_array( $result ) );
		$this->assertEmpty( $result );

		// When a single order object is used.
		$order  = array(
			'fieldName' => 'views',
			'sortOrder' => 'ASCENDING',
		);
		$result = $reflected_parse_earnings_orderby_method->invoke( $adsense, $order );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 1, count( $result ) );
		$this->assertEquals( '+views', $result[0] );

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
		$result = $reflected_parse_earnings_orderby_method->invoke( $adsense, $orders );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 2, count( $result ) );
		$this->assertEquals( '-pages', $result[0] );
		$this->assertEquals( '+sessions', $result[1] );

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
		$result = $reflected_parse_earnings_orderby_method->invoke( $adsense, $orders );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 2, count( $result ) );
		$this->assertEquals( '-pages', $result[0] );
		$this->assertEquals( '+sessions', $result[1] );
	}

	public function test_get_sites_no_account_id_from_rest_api() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $user->ID );
		$authentication = new Authentication( $context, $options, $user_options );
		$adsense        = new AdSense( $context, $options, $user_options, $authentication );
		$adsense->register();

		$authentication->get_oauth_client()->set_granted_scopes(
			$adsense->get_scopes()
		);
		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'adsense' ) );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/adsense/data/sites' );
		$response = rest_get_server()->dispatch( $request );

		// Confirm the request returns 400 status code.
		$this->assertEquals( 400, $response->get_status() );
	}

	public function test_get_debug_fields() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'adsense_account_id',
				'adsense_client_id',
				'adsense_account_status',
				'adsense_site_status',
				'adsense_use_snippet',
				'adsense_web_stories_adunit_id',
				'adsense_setup_completed_timestamp',
				'adsense_abr_use_snippet',
				'adsense_abr_use_error_protection_snippet',
				'adsense_abr_setup_status',
			),
			array_keys( $adsense->get_debug_fields() )
		);
	}
}
