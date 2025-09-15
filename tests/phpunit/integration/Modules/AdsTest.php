<?php
/**
 * AdsTest
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client_Base;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Ads
 */
class AdsTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Settings_ContractTests;

	/**
	 * Ads object.
	 *
	 * @var Ads
	 */
	private $ads;

	/**
	 * Plugin context.
	 *
	 * @var Context
	 */
	private $context;

	public function set_up() {
		parent::set_up();

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->ads     = new Ads( $this->context );

		$this->ads->get_settings()->register();
	}

	public function test_magic_methods() {
		$this->assertEquals( 'ads', $this->ads->slug, 'Ads module slug should be correct.' );
		$this->assertEquals( 'Ads', $this->ads->name, 'Ads module name should be correct.' );
		$this->assertEquals( 'https://google.com/ads', $this->ads->homepage, 'Ads module homepage should be correct.' );
	}

	public function test_register() {
		remove_all_actions( 'template_redirect' );
		remove_all_filters( 'googlesitekit_inline_modules_data' );
		remove_all_filters( 'googlesitekit_ads_measurement_connection_checks' );
		remove_all_filters( 'googlesitekit_feature_metrics' );

		$this->ads->register();

		$this->assertTrue( has_action( 'template_redirect' ), 'template_redirect action should be registered.' );
		$this->assertTrue( has_filter( 'googlesitekit_inline_modules_data' ), 'inline_modules_data filter should be registered.' );
		$this->assertTrue( has_filter( 'googlesitekit_ads_measurement_connection_checks' ), 'ads_measurement_connection_checks filter should be registered.' );
		$this->assertTrue( has_filter( 'googlesitekit_feature_metrics' ), 'googlesitekit_feature_metrics filter should be registered.' );
	}

	public function test_register__googlesitekit_ads_measurement_connection_checks() {
		remove_all_filters( 'googlesitekit_ads_measurement_connection_checks' );

		$this->ads->register();

		$this->assertEquals(
			array(
				array( $this->ads, 'check_ads_measurement_connection' ),
			),
			apply_filters( 'googlesitekit_ads_measurement_connection_checks', array() ),
			'Ads measurement connection check should be registered.'
		);
	}

	public function test_is_connected__when_ads_conversion_id_is_set() {
		$this->assertFalse( $this->ads->is_connected(), 'Ads module should not be connected without conversion ID.' );

		$this->ads->get_settings()->merge(
			array( 'conversionID' => 'AW-123456789' )
		);

		$this->assertTrue( $this->ads->is_connected(), 'Ads module should be connected with conversion ID.' );
	}

	public function test_is_connected__when_pax_conversion_id_is_set() {
		$this->assertFalse( $this->ads->is_connected(), 'Ads module should not be connected without paxConversionID.' );

		self::enable_feature( 'adsPax' );

		$this->ads->get_settings()->merge(
			array( 'paxConversionID' => 'AW-123456789' )
		);

		$this->assertTrue( $this->ads->is_connected(), 'Ads module should be connected with paxConversionID.' );
	}

	public function test_is_connected__when_ext_customer_id_is_set() {
		$this->assertFalse( $this->ads->is_connected(), 'Ads module should not be connected without extCustomerID.' );

		self::enable_feature( 'adsPax' );

		$this->ads->get_settings()->merge(
			array( 'extCustomerID' => '123456789' )
		);

		$this->assertTrue( $this->ads->is_connected(), 'Ads module should be connected with extCustomerID.' );
	}

	public function test_is_connected__feature_flag_is_disabled_but_pax_conversion_id_or_ext_customer_id_are_set() {
		$this->assertFalse( $this->ads->is_connected(), 'Ads module should not be connected without feature flag and paxConversionID.' );

		$this->ads->get_settings()->merge(
			array( 'paxConversionID' => 'AW-123456789' )
		);

		$this->assertFalse( $this->ads->is_connected(), 'Ads module should not be connected without feature flag and extCustomerID.' );
	}

	public function test_inline_modules_data__module_not_connected__with_pax() {
		remove_all_filters( 'googlesitekit_inline_modules_data' );
		self::enable_feature( 'adsPax' );

		$this->ads->register();

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayIntersection(
			array(
				'supportedConversionEvents' => array(),
			),
			$inline_modules_data['ads'],
			'Inline modules data for Ads should include supportedConversionEvents when module not connected with adsPax.'
		);
	}

	public function test_inline_modules_data__module_not_connected__without_pax() {
		remove_all_filters( 'googlesitekit_inline_modules_data' );
		$this->ads->register();

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayNotHasKey( 'ads', $inline_modules_data, 'Inline modules data should not include Ads when module not connected and adsPax disabled.' );
	}

	public function test_inline_modules_data__module_connected() {
		remove_all_filters( 'googlesitekit_inline_modules_data' );
		self::enable_feature( 'adsPax' );

		$this->ads->register();

		// Ensure the module is connected.
		$this->ads->get_settings()->merge(
			array( 'conversionID' => 'AW-123456789' )
		);

		$this->assertTrue( $this->ads->is_connected(), 'Ads module should be connected after setting conversionID.' );

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayIntersection(
			array(
				'supportedConversionEvents' => array(),
			),
			$inline_modules_data['ads'],
			'Inline modules data for Ads should include supportedConversionEvents when module connected.'
		);
	}

	public function test_settings__reset_on_deactivation() {
		$this->ads->get_settings()->set( array( 'conversionID' => 'AW-123456789' ) );

		$this->ads->on_deactivation();

		$this->assertFalse( $this->ads->get_settings()->has(), 'Ads settings should be cleared on deactivation.' );
	}

	public function test_get_scopes__no_scope_and_no_extCustomerID() {
		self::enable_feature( 'adsPax' );

		$this->ads->register();

		$required_scopes = apply_filters( 'googlesitekit_auth_scopes', array() );

		$this->assertNotContains( Ads::SCOPE, $required_scopes, 'Ads scope should not be required without scope and extCustomerID.' );
	}

	public function test_get_scopes__already_has_adwords_scope() {
		self::enable_feature( 'adsPax' );
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		// Authentication needs to inherit current user, hence new instance here.
		$this->ads = new Ads( $this->context );

		$granted_scopes = array( Ads::SCOPE );
		update_user_option( $user_id, OAuth_Client_Base::OPTION_AUTH_SCOPES, $granted_scopes );

		$this->ads->register();

		$required_scopes = apply_filters( 'googlesitekit_auth_scopes', array() );

		$this->assertContains( Ads::SCOPE, $required_scopes, 'Ads scope should be present when already granted.' );
		$this->assertContains( Ads::SUPPORT_CONTENT_SCOPE, $required_scopes, 'Support content scope should be present when Ads scope already granted.' );
	}

	public function test_get_scopes__already_has_extCustomerID_setting() {
		self::enable_feature( 'adsPax' );

		$this->ads->get_settings()->merge( array( 'extCustomerID' => '123456789' ) );
		$this->ads->register();

		$module_scopes = apply_filters( 'googlesitekit_auth_scopes', array() );

		$this->assertContains( Ads::SCOPE, $module_scopes, 'Ads scope should be present when extCustomerID setting exists.' );
		$this->assertContains( Ads::SUPPORT_CONTENT_SCOPE, $module_scopes, 'Support content scope should be present when extCustomerID setting exists.' );
	}

	public function test_get_debug_fields() {
		$this->ads->get_settings()->merge( array( 'conversionID' => 'AW-123456789' ) );

		$this->assertEqualSets(
			array(
				'ads_conversion_tracking_id',
			),
			array_keys( $this->ads->get_debug_fields() ),
			'Ads debug fields should contain conversion tracking ID.'
		);

		$this->assertEquals(
			array(
				'ads_conversion_tracking_id' => array(
					'label' => 'Ads: Conversion ID',
					'value' => 'AW-123456789',
					'debug' => 'AW-1••••••••',
				),
			),
			$this->ads->get_debug_fields(),
			'Ads debug fields should match expected structure.'
		);
	}

	/**
	 * @dataProvider template_redirect_data_provider
	 *
	 * @param array $settings
	 */
	public function test_template_redirect( $settings ) {
		remove_all_actions( 'wp_enqueue_scripts' );
		( new GTag( new Options( $this->context ) ) )->register();

		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		remove_all_actions( 'template_redirect' );
		$this->ads->register();
		$this->ads->get_settings()->set( $settings );

		do_action( 'template_redirect' );

		$head_html = $this->capture_action( 'wp_head' );
		$this->assertNotEmpty( $head_html, 'Head output should not be empty after template_redirect.' );

		if ( empty( $settings['conversionID'] ) ) {
			$this->assertFalse( has_action( 'googlesitekit_setup_gtag' ), 'gtag setup action should not be present when conversionID is empty.' );
			$this->assertStringNotContainsString(
				'gtag("config", "AW-123456789")',
				$head_html,
				'Head output should not contain gtag config for Ads conversion ID'
			);
		} else {
			$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ), 'gtag setup action should be present when conversionID is set.' );

			$this->assertStringContainsString(
				'gtag("config", "AW-123456789")',
				$head_html,
				'Head output should contain gtag config for Ads conversion ID.'
			);
		}
	}

	/**
	 * @dataProvider template_redirect_with_pax_data_provider
	 *
	 * @param array $settings
	 */
	public function test_template_redirect__with_pax_flag_and_pax_conversion_id_setting( $feature_flag, $settings ) {
		if ( ! empty( $feature_flag ) ) {
			self::enable_feature( $feature_flag );
		}

		remove_all_actions( 'wp_enqueue_scripts' );
		( new GTag( new Options( $this->context ) ) )->register();

		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		remove_all_actions( 'template_redirect' );
		$this->ads->register();
		$this->ads->get_settings()->set( $settings );

		do_action( 'template_redirect' );

		$head_html = $this->capture_action( 'wp_head' );
		$this->assertNotEmpty( $head_html, 'Head output should not be empty after template_redirect.' );

		$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ), 'gtag setup action should be present when template_redirect runs.' );

		if ( empty( $settings['paxConversionID'] ) || empty( $feature_flag ) ) {
			$this->assertStringContainsString(
				'gtag("config", "AW-123456789")',
				$head_html,
				'Head output should contain Ads conversion ID when paxConversionID is empty or feature flag disabled.'
			);
		} else {
			$this->assertStringContainsString(
				'gtag("config", "AW-987654321")',
				$head_html,
				'Head output should contain paxConversionID when feature flag enabled.'
			);
		}
	}

	/**
	 * @dataProvider data_ads_measurement_connection_settings
	 */
	public function test_check_ads_measurement_connection( $settings_input, $pax_enabled, $expected ) {
		if ( $pax_enabled ) {
			$this->enable_feature( 'adsPax' );
		}

		$this->ads->get_settings()->merge( $settings_input );

		$this->assertSame( $expected, $this->ads->check_ads_measurement_connection(), 'Ads measurement connection check result should match expected.' );
	}

	public function data_ads_measurement_connection_settings() {
		return array(
			'connected manually'                 => array(
				array( 'conversionID' => 'AW-123456789' ),
				false,
				true,
			),
			'not connected'                      => array(
				array( 'conversionID' => '' ),
				false,
				false,
			),
			'connected manually, adsPax enabled' => array(
				array( 'conversionID' => 'AW-123456789' ),
				true,
				true,
			),
			'connected via PAX, adsPax enabled'  => array(
				array( 'paxConversionID' => 'AW-987654321' ),
				true,
				true,
			),
			'not connected, adsPax enabled'      => array(
				array(
					'conversionID'    => '',
					'paxConversionID' => '',
					'extCustomerID'   => '',
				),
				true,
				false,
			),
		);
	}

	public function template_redirect_data_provider() {
		return array(
			'empty ads conversion ID' => array(
				array(
					'conversionID'    => '',
					'paxConversionID' => '',
				),
			),
			'valid ads conversion ID' => array(
				array(
					'conversionID'    => 'AW-123456789',
					'paxConversionID' => '',
				),
			),
		);
	}

	public function template_redirect_with_pax_data_provider() {
		return array(
			'empty pax conversion ID, valid ads conversion ID and adsPax feature flag enabled' => array(
				'adsPax',
				array(
					'conversionID'    => 'AW-123456789',
					'paxConversionID' => '',
				),
			),
			'valid pax conversion ID, valid ads conversion ID and adsPax feature flag enabled' => array(
				'adsPax',
				array(
					'conversionID'    => 'AW-123456789',
					'paxConversionID' => 'AW-987654321',
				),
			),
			'valid pax conversion ID, valid ads conversion ID and adsPax feature flag disabled' => array(
				false,
				array(
					'conversionID'    => 'AW-123456789',
					'paxConversionID' => 'AW-987654321',
				),
			),
		);
	}

	protected function get_module_with_scopes() {
		return $this->ads;
	}

	protected function get_module_with_settings() {
		return $this->ads;
	}

	public function test_get_feature_metrics__not_connected() {
		$expected_feature_metrics = array(
			'ads_connection' => '',
		);
		$feature_metrics          = $this->ads->get_feature_metrics();
		$this->assertEquals( $expected_feature_metrics, $feature_metrics, 'Feature metric for ads_connection should be blank when Ads is not connected.' );
	}

	public function test_get_feature_metrics__manual() {
		$this->ads->get_settings()->merge(
			array( 'conversionID' => 'AW-123456789' )
		);
		$expected_feature_metrics = array(
			'ads_connection' => 'manual',
		);
		$feature_metrics          = $this->ads->get_feature_metrics();
		$this->assertEquals( $expected_feature_metrics, $feature_metrics, 'Feature metric for ads_connection should be manual when conversionID is set.' );
	}

	public function test_get_feature_metrics__pax() {
		self::enable_feature( 'adsPax' );

		$this->ads->get_settings()->merge(
			array( 'paxConversionID' => 'AW-123456789' )
		);
		$expected_feature_metrics = array(
			'ads_connection' => 'pax',
		);
		$feature_metrics          = $this->ads->get_feature_metrics();
		$this->assertEquals( $expected_feature_metrics, $feature_metrics, 'Feature metric for ads_connection should be pax when paxConversionID is set.' );
	}
}
