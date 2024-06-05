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
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Modules\Ads\Settings;
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
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var Authentication
	 */
	protected $authentication;

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
		$this->assertEquals( 'ads', $this->ads->slug );
		$this->assertEquals( 'Ads', $this->ads->name );
		$this->assertEquals( 'https://google.com/ads', $this->ads->homepage );
	}

	public function test_register() {
		remove_all_actions( 'template_redirect' );
		remove_all_filters( 'googlesitekit_inline_modules_data' );

		$this->ads->register();

		$this->assertTrue( has_action( 'template_redirect' ) );
		$this->assertTrue( has_filter( 'googlesitekit_inline_modules_data' ) );
	}

	public function test_is_connected__when_ads_conversion_id_is_set() {
		$this->assertFalse( $this->ads->is_connected() );

		$this->ads->get_settings()->merge(
			array( 'conversionID' => 'AW-123456789' )
		);

		$this->assertTrue( $this->ads->is_connected() );
	}

	public function test_is_connected__when_pax_conversion_id_is_set() {
		$this->assertFalse( $this->ads->is_connected() );

		self::enable_feature( 'adsPax' );

		$this->ads->get_settings()->merge(
			array( 'paxConversionID' => 'AW-123456789' )
		);

		$this->assertTrue( $this->ads->is_connected() );
	}

	public function test_is_connected__when_ext_customer_id_is_set() {
		$this->assertFalse( $this->ads->is_connected() );

		self::enable_feature( 'adsPax' );

		$this->ads->get_settings()->merge(
			array( 'extCustomerID' => '123456789' )
		);

		$this->assertTrue( $this->ads->is_connected() );
	}

	public function test_is_connected__feature_flag_is_disabled_but_pax_conversion_id_or_ext_customer_id_are_set() {
		$this->assertFalse( $this->ads->is_connected() );

		$this->ads->get_settings()->merge(
			array( 'paxConversionID' => 'AW-123456789' )
		);

		$this->assertFalse( $this->ads->is_connected() );

		$this->ads->get_settings()->merge(
			array( 'extCustomerID' => '123456789' )
		);

		$this->assertFalse( $this->ads->is_connected() );
	}


	public function test_inline_modules_data__module_not_connected() {
		self::enable_feature( 'adsPax' );

		$this->ads->register();

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayNotHasKey( 'ads', $inline_modules_data );
	}

	public function test_inline_modules_data__module_connected() {
		self::enable_feature( 'adsPax' );

		$this->ads->register();

		// Ensure the module is connected.
		$this->ads->get_settings()->merge(
			array( 'conversionID' => 'AW-123456789' )
		);

		$this->assertTrue( $this->ads->is_connected() );

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertEquals(
			array(
				'supportedConversionEvents' => array(),
			),
			$inline_modules_data['ads']
		);
	}

	public function test_settings__reset_on_deactivation() {
		$this->ads->get_settings()->set( array( 'conversionID' => 'AW-123456789' ) );

		$this->ads->on_deactivation();

		$this->assertFalse( $this->ads->get_settings()->has() );
	}

	public function test_get_scopes__no_scope_and_no_extCustomerID() {
		self::enable_feature( 'adsPax' );

		$this->ads->register();

		$required_scopes = apply_filters( 'googlesitekit_auth_scopes', array() );

		$this->assertNotContains( Ads::SCOPE, $required_scopes );
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

		$this->assertContains( Ads::SCOPE, $required_scopes );
		$this->assertContains( Ads::SUPPORT_CONTENT_SCOPE, $required_scopes );
	}

	public function test_get_scopes__already_has_extCustomerID_setting() {
		self::enable_feature( 'adsPax' );

		$this->ads->get_settings()->merge( array( 'extCustomerID' => '123456789' ) );
		$this->ads->register();

		$module_scopes = apply_filters( 'googlesitekit_auth_scopes', array() );

		$this->assertContains( Ads::SCOPE, $module_scopes );
		$this->assertContains( Ads::SUPPORT_CONTENT_SCOPE, $module_scopes );
	}

	public function test_get_debug_fields() {
		$this->ads->get_settings()->merge( array( 'conversionID' => 'AW-123456789' ) );

		$this->assertEqualSets(
			array(
				'ads_conversion_tracking_id',
			),
			array_keys( $this->ads->get_debug_fields() )
		);

		$this->assertEquals(
			array(
				'ads_conversion_tracking_id' => array(
					'label' => 'Ads Conversion Tracking ID',
					'value' => 'AW-123456789',
					'debug' => 'AW-1••••••••',
				),
			),
			$this->ads->get_debug_fields()
		);
	}

	/**
	 * @dataProvider template_redirect_data_provider
	 *
	 * @param array $settings
	 */
	public function test_template_redirect( $settings ) {
		remove_all_actions( 'wp_enqueue_scripts' );
		( new GTag() )->register();

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();

		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		remove_all_actions( 'template_redirect' );
		$this->ads->register();
		$this->ads->get_settings()->set( $settings );

		do_action( 'template_redirect' );

		$head_html = $this->capture_action( 'wp_head' );
		$this->assertNotEmpty( $head_html );

		if ( empty( $settings['conversionID'] ) ) {
			$this->assertFalse( has_action( 'googlesitekit_setup_gtag' ) );
			$this->assertStringNotContainsString(
				'gtag("config", "AW-123456789")',
				$head_html
			);
		} else {
			$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ) );

			$this->assertStringContainsString(
				'gtag("config", "AW-123456789")',
				$head_html
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

		$ads = new Ads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		remove_all_actions( 'wp_enqueue_scripts' );
		( new GTag() )->register();

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();

		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		remove_all_actions( 'template_redirect' );
		$ads->register();
		$ads->get_settings()->set( $settings );

		do_action( 'template_redirect' );

		$head_html = $this->capture_action( 'wp_head' );
		$this->assertNotEmpty( $head_html );

		$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ) );

		if ( empty( $settings['paxConversionID'] ) || empty( $feature_flag ) ) {
			$this->assertStringContainsString(
				'gtag("config", "AW-123456789")',
				$head_html
			);
		} else {
			$this->assertStringContainsString(
				'gtag("config", "AW-987654321")',
				$head_html
			);
		}
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
}
