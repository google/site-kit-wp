<?php
/**
 * Class Google\Site_Kit\Tests\Core\Site_Health\Debug_DataTest
 *
 * @package   Google\Site_Kit\Tests\Core\Site_Health
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
namespace Google\Site_Kit\Tests\Core\Site_Health;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Content_Events;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Settings;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed_By;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Settings;
use Google\Site_Kit\Core\Site_Health\Debug_Data;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway;
use Google\Site_Kit\Tests\Core\Modules\FakeModule;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Debug_DataTest extends TestCase {

	public function new_debug_data( $context = null, $user_options = null ) {
		$context         = $context ? $context : new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options         = new Options( $context );
		$user_options    = $user_options ? $user_options : new User_Options( $context );
		$authentication  = new Authentication( $context, $options, $user_options );
		$modules         = new Modules( $context, $options, $user_options, $authentication );
		$dismissed_items = new Dismissed_Items( $user_options );
		$permissions     = new Permissions( $context, $authentication, $modules, $user_options, $dismissed_items );

		$fake_module = new FakeModule( $context, $options, $user_options );
		$fake_module->set_force_active( true ); // necessary to add sharing fields.
		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );

		// Ensure email reporting settings are registered so defaults are available.
		$email_reporting_settings = new Email_Reporting_Settings( $options );
		$email_reporting_settings->register();

		return new Debug_Data( $context, $options, $user_options, $authentication, $modules, $permissions );
	}

	public function test_register() {
		remove_all_filters( 'debug_information' );
		$debug_data = $this->new_debug_data();
		$debug_data->register();

		$this->assertTrue(
			has_filter( 'debug_information' ),
			'Site Kit debug data should be registered with WordPress Site Health.'
		);
	}

	public function test_registered_debug_information() {
		remove_all_filters( 'debug_information' );
		$debug_data = $this->new_debug_data();
		$debug_data->register();

		$info = apply_filters( 'debug_information', array() );
		$this->assertArrayHasKey( 'google-site-kit', $info, 'Debug information should include a Site Kit section.' );

		$this->assertNonConditionalFields( $info );
		$this->assertArrayHasKey( 'recoverable_modules', $info['google-site-kit']['fields'], 'Debug information should identify recoverable modules.' );
		$this->assertHasDashboardSharingModuleFields( 'fake-module', $info );

		$this->assertArrayHasKey( 'consent_mode', $info['google-site-kit']['fields'], 'Debug information should include consent mode status.' );
		$this->assertArrayHasKey( 'consent_api', $info['google-site-kit']['fields'], 'Debug information should include consent API status.' );
	}

	public function test_email_reports_fields__present_by_default() {
		remove_all_filters( 'debug_information' );

		$debug_data = $this->new_debug_data();
		$debug_data->register();

		$info   = apply_filters( 'debug_information', array() );
		$fields = $info['google-site-kit']['fields'];

		$this->assertArrayHasKey(
			'email_reports_status',
			$fields,
			'Email Reports status field should be present.'
		);
		$this->assertArrayHasKey(
			'email_reports_subscribers',
			$fields,
			'Email Reports subscribers field should be present.'
		);
		$this->assertArrayHasKey(
			'email_reports_deliverability',
			$fields,
			'Email Reports deliverability field should be present.'
		);
		$this->assertArrayHasKey(
			'email_reports_last_sent',
			$fields,
			'Email Reports last sent field should be present.'
		);
	}

	/**
	 * @dataProvider redacted_debug_value_provider
	 */
	public function test_redact_debug_value( $input, $expected, $mask_start ) {
		$this->assertEquals(
			$expected,
			Debug_Data::redact_debug_value( $input, $mask_start ),
			'Debug values should be redacted according to the requested visible portion.'
		);
	}

	public function redacted_debug_value_provider() {
		return array(
			array(
				'test-value-to-redact',
				'••••••••••••••••dact',
				-4,
			),
			array(
				'test-value-to-redact',
				'test••••••••••••••••',
				4,
			),
			array(
				'test-value-to-redact',
				'••••••••••••••••••••',
				0,
			),
			array(
				array(), // non-scalar.
				'',
				-4,
			),
		);
	}

	protected function assertNonConditionalFields( $debug_information ) {
		$non_conditional_keys = array(
			'version',
			'php_version',
			'wp_version',
			'amp_mode',
			'site_status',
			'user_status',
			'verification_status',
			'connected_user_count',
			'active_modules',
			'reference_url',
			'required_scopes',
			'capabilities',
			'enabled_features',
			'consent_mode',
			'consent_api',
			'active_conversion_event_providers',
			'content_events',
			'conversion_tracking',
		);
		$actual_keys          = array_keys( $debug_information['google-site-kit']['fields'] );

		$this->assertEqualSets(
			$non_conditional_keys,
			array_intersect( $non_conditional_keys, $actual_keys ),
			'Failed to assert all non-conditional debug info fields are present'
		);
	}

	protected function assertHasDashboardSharingModuleFields( $module_slug, $debug_information ) {
		$sharing_keys = array(
			"{$module_slug}_shared_roles",
			"{$module_slug}_management",
		);
		$actual_keys  = array_keys( $debug_information['google-site-kit']['fields'] );

		$this->assertEqualSets(
			$sharing_keys,
			array_intersect( $sharing_keys, $actual_keys ),
			"Failed to assert that dashboard sharing fields were present for $module_slug"
		);
	}

	public function test_key_metrics_fields__not_setup() {
		remove_all_filters( 'debug_information' );
		$debug_data = $this->new_debug_data();
		$debug_data->register();

		$info = apply_filters( 'debug_information', array() );
		$this->assertArrayHasKey( 'google-site-kit', $info, 'Debug information should include a Site Kit section.' );
		$this->assertEquals( 'Not setup', $info['google-site-kit']['fields']['key_metrics_status']['value'], 'Key Metrics should be reported as not set up by default.' );
	}

	public function test_key_metrics_fields__setup_and_enabled_tailored() {
		update_option( Key_Metrics_Setup_Completed_By::OPTION, true );

		remove_all_filters( 'debug_information' );
		$debug_data = $this->new_debug_data();
		$debug_data->register();

		$info = apply_filters( 'debug_information', array() );
		$this->assertArrayHasKey( 'google-site-kit', $info, 'Debug information should include a Site Kit section.' );
		$this->assertEquals( 'Setup and Enabled', $info['google-site-kit']['fields']['key_metrics_status']['value'], 'Configured Key Metrics should be reported as enabled.' );
		$this->assertEquals( 'Tailored Metrics', $info['google-site-kit']['fields']['key_metrics_source']['value'], 'Key Metrics without manual selections should be reported as tailored.' );
	}

	public function test_key_metrics_fields__setup_and_enabled_manual() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context );

		update_option( Key_Metrics_Setup_Completed_By::OPTION, true );
		$user_options->set( Key_Metrics_Settings::OPTION, array( 'widgetSlugs' => array( 'widget1', 'widget2' ) ) );

		remove_all_filters( 'debug_information' );
		$debug_data = $this->new_debug_data( $context, $user_options );
		$debug_data->register();

		$info = apply_filters( 'debug_information', array() );
		$this->assertArrayHasKey( 'google-site-kit', $info, 'Debug information should include a Site Kit section.' );
		$this->assertEquals( 'Setup and Enabled', $info['google-site-kit']['fields']['key_metrics_status']['value'], 'Configured Key Metrics should be reported as enabled.' );
		$this->assertEquals( 'Manual Selection', $info['google-site-kit']['fields']['key_metrics_source']['value'], 'Explicit widget selections should be reported as manual Key Metrics.' );
	}

	public function test_key_metrics_fields__setup_and_disabled() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context );

		update_option( Key_Metrics_Setup_Completed_By::OPTION, true );
		$user_options->set( Key_Metrics_Settings::OPTION, array( 'isWidgetHidden' => true ) );

		remove_all_filters( 'debug_information' );
		$debug_data = $this->new_debug_data( $context, $user_options );
		$debug_data->register();

		$info = apply_filters( 'debug_information', array() );
		$this->assertArrayHasKey( 'google-site-kit', $info, 'Debug information should include a Site Kit section.' );
		$this->assertEquals( 'Setup and Disabled', $info['google-site-kit']['fields']['key_metrics_status']['value'], 'Hidden Key Metrics widget area should be reported as disabled.' );
	}

	public function test_gtg_fields() {
		$this->enable_feature( 'googleTagGateway' );
		( new Google_Tag_Gateway( new Context( __FILE__ ) ) )->register();

		remove_all_filters( 'debug_information' );
		$debug_data = $this->new_debug_data();
		$debug_data->register();

		$info = apply_filters( 'debug_information', array() );

		$this->assertListIntersection(
			array(
				'google_tag_gateway_is_enabled',
				'google_tag_gateway_is_gtg_healthy',
				'google_tag_gateway_is_script_access_enabled',
			),
			array_keys( $info['google-site-kit']['fields'] ),
			'Failed to assert one or more GTG fields were included in the list of Site Kit fields'
		);
	}

	/**
	 * Returns the Site Kit debug fields, with Conversion Tracking left at its
	 * default, enabled or disabled.
	 *
	 * @param bool|null $conversion_tracking_enabled Null leaves the option unset.
	 * @return array Site Kit debug fields.
	 */
	private function get_site_kit_fields( $conversion_tracking_enabled = null ) {
		remove_all_filters( 'debug_information' );

		$context                      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$conversion_tracking_settings = new Conversion_Tracking_Settings( new Options( $context ) );
		$conversion_tracking_settings->register();

		if ( null !== $conversion_tracking_enabled ) {
			$conversion_tracking_settings->set( array( 'enabled' => $conversion_tracking_enabled ) );
		}

		$debug_data = $this->new_debug_data( $context );
		$debug_data->register();

		$info = apply_filters( 'debug_information', array() );

		return $info['google-site-kit']['fields'];
	}

	public function test_active_conversion_event_providers__carries_the_content_events_entry() {
		$fields = $this->get_site_kit_fields();

		$this->assertArrayHasKey(
			Content_Events::CONVERSION_EVENT_PROVIDER_SLUG,
			$fields['active_conversion_event_providers']['value'],
			'Active conversion event providers should list the content events provider.'
		);
		$this->assertNotEmpty(
			$fields['active_conversion_event_providers']['value'][ Content_Events::CONVERSION_EVENT_PROVIDER_SLUG ],
			'The content events provider should name the events it can send.'
		);
	}

	public function test_content_events_field__lists_every_eligible_event_in_order() {
		$fields = $this->get_site_kit_fields();

		$this->assertSame(
			array(
				'read_article',
				'pagination_click',
				'contact_link_click',
				'outbound_link_click',
				'video_start, video_progress, video_complete',
			),
			array_keys( $fields['content_events']['value'] ),
			'The content events field should carry one entry per eligible event, in order.'
		);

		foreach ( $fields['content_events']['value'] as $event => $description ) {
			$this->assertNotEmpty( $description, "The $event entry should name where it can fire." );
		}
	}

	/**
	 * @dataProvider data_conversion_tracking_states
	 *
	 * @param bool|null $enabled        Setting value; null leaves the option unset.
	 * @param string    $expected_value Expected field value.
	 * @param string    $expected_debug Expected field debug value.
	 */
	public function test_conversion_tracking_field__reports_the_setting( $enabled, $expected_value, $expected_debug ) {
		$fields = $this->get_site_kit_fields( $enabled );

		$this->assertSame( $expected_value, $fields['conversion_tracking']['value'], 'Conversion Tracking should report the setting.' );
		$this->assertSame( $expected_debug, $fields['conversion_tracking']['debug'], 'Conversion Tracking debug value should match the setting.' );

		// The content events entry and field are listed either way.
		$this->assertArrayHasKey(
			Content_Events::CONVERSION_EVENT_PROVIDER_SLUG,
			$fields['active_conversion_event_providers']['value'],
			'The content events provider should be listed whether or not Conversion Tracking is on.'
		);
		$this->assertNotEmpty( $fields['content_events']['value'], 'The content events field should be present whether or not Conversion Tracking is on.' );
	}

	public function data_conversion_tracking_states() {
		return array(
			'enabled'       => array(
				true,
				'Enabled (requires a Google Analytics or Google Ads web tag on the page)',
				'enabled',
			),
			'disabled'      => array(
				false,
				'Disabled',
				'disabled',
			),
			'option absent' => array(
				null,
				'Disabled',
				'disabled',
			),
		);
	}
}
