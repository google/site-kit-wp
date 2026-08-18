<?php
/**
 * Conversion_TrackingTest
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */
namespace Google\Tests\Core\Conversion_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Content_Events;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeContentEventProvider_Active;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeConversionEventProvider;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeConversionEventProvider_Active;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeEcommerceEventProvider_Active;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeEcommerceEventProvider_Active_Two;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeLeadEventProvider_Active;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

class Conversion_TrackingTest extends TestCase {

	/**
	 * Conversion_Tracking instance.
	 *
	 * @var Conversion_Tracking
	 */
	private $conversion_tracking;

	/**
	 * Conversion_Tracking_Settings instance.
	 *
	 * @var Conversion_Tracking_Settings
	 */
	private $conversion_tracking_settings;

	/**
	 * Default providers list.
	 *
	 * @var array
	 */
	private static $default_providers = array();

	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$default_providers = Conversion_Tracking::$providers;
	}

	public static function tear_down_after_class() {
		parent::tear_down_after_class();

		Conversion_Tracking::$providers = self::$default_providers;
	}

	public function set_up() {
		parent::set_up();

		$context                            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options                            = new Options( $context );
		$this->conversion_tracking          = new Conversion_Tracking( $context, $options );
		$this->conversion_tracking_settings = new Conversion_Tracking_Settings( $options );

		$this->conversion_tracking_settings->register();
		$this->conversion_tracking_settings->set( array( 'enabled' => true ) );

		Conversion_Tracking::$providers = array(
			FakeConversionEventProvider::CONVERSION_EVENT_PROVIDER_SLUG        => FakeConversionEventProvider::class,
			FakeConversionEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeConversionEventProvider_Active::class,
		);
	}

	public function tear_down() {
		parent::tear_down();

		Conversion_Tracking::$providers = self::$default_providers;
	}

	public function test_register__not_enqueued_when_no_snippet_inserted() {
		$this->conversion_tracking->register();

		do_action( 'wp_enqueue_scripts' );

		$this->assertFalse( wp_script_is( 'gsk-cep-' . FakeConversionEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG ), 'Active provider script should not enqueue without snippet.' );
		$this->assertFalse( wp_script_is( 'gsk-cep-' . FakeConversionEventProvider::CONVERSION_EVENT_PROVIDER_SLUG ), 'Inactive provider script should not enqueue without snippet.' );
	}

	public function test_register__not_enqueued_when_tracking_disabled() {
		$this->conversion_tracking_settings->set( array( 'enabled' => false ) );

		$this->conversion_tracking->register();

		do_action( 'googlesitekit_ads_init_tag' );
		do_action( 'wp_enqueue_scripts' );

		$this->assertFalse( wp_script_is( 'gsk-cep-' . FakeConversionEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG ), 'Provider script should not enqueue when tracking is disabled.' );
	}

	public function test_register__feature_metrics() {
		remove_all_filters( 'googlesitekit_feature_metrics' );

		$this->assertFalse( has_filter( 'googlesitekit_feature_metrics' ), 'There should be no filter for features metrics initially.' );

		$this->conversion_tracking->register();

		$this->assertTrue( has_filter( 'googlesitekit_feature_metrics' ), 'The filter for features metrics should be registered.' );
	}

	/**
	 * @dataProvider data_modules
	 */
	public function test_register__enqueued_when_snippet_inserted( $module_slug ) {
		$this->assertFalse( has_action( 'fake_provider_action' ), 'Provider hook should not exist before registration.' );

		$this->conversion_tracking->register();

		do_action( "googlesitekit_{$module_slug}_init_tag" );
		do_action( 'wp_enqueue_scripts' );

		$this->assertTrue( wp_script_is( 'gsk-cep-' . FakeConversionEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG ), 'Active provider script should enqueue after snippet.' );
		$this->assertFalse( wp_script_is( 'gsk-cep-' . FakeConversionEventProvider::CONVERSION_EVENT_PROVIDER_SLUG ), 'Inactive provider script should not enqueue after snippet.' );

		$this->assertTrue( has_action( 'fake_provider_action' ), 'Provider hook should be registered after snippet.' );
	}

	public function data_modules() {
		return array(
			'ads_module'        => array( 'ads' ),
			'analytics_modules' => array( 'analytics-4' ),
		);
	}

	public function test_get_active_conversion_event_providers() {
		$active_providers = $this->conversion_tracking->get_active_providers();

			$this->assertArrayHasKey(
				FakeConversionEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG,
				$active_providers,
				'Active providers should include the active fake provider.'
			);

			$this->assertArrayNotHasKey(
				FakeConversionEventProvider::CONVERSION_EVENT_PROVIDER_SLUG,
				$active_providers,
				'Active providers should not include the inactive fake provider.'
			);
	}

	/**
	 * @dataProvider data_register
	 *
	 * @param $classname
	 * @param $expected_exception
	 */
	public function test_get_active_conversion_event_providers__classnames_exceptions( $providers, $expected_exception ) {
		Conversion_Tracking::$providers = $providers;

		try {
			$this->conversion_tracking->get_active_providers();
		} catch ( \Exception $exception ) {
			if ( ! $expected_exception ) {
				$this->fail( 'No exception expected but a ' . get_class( $exception ) . ' was thrown' );
			}
				$this->assertEquals( $expected_exception, $exception->getMessage(), 'Provider exception message should match expected message.' );
		}
	}

	public function data_register() {
		$exception_no_classname     = 'A conversion event provider class name is required to instantiate a provider: test-provider';
		$exception_not_extends_base = sprintf( "The '%s' class must extend the base conversion event provider class: %s", __CLASS__, Conversion_Events_Provider::class );

		return array(
			'no class name'                     => array( array( 'test-provider' => '' ), $exception_no_classname ),
			'non-existent class name'           => array( array( 'foo-bar' => '\\Foo\\Bar' ), "The '\\Foo\\Bar' class does not exist" ),
			'existing class not-extending base' => array( array( 'test-provider' => __CLASS__ ), $exception_not_extends_base ),
		);
	}

	public function test_get_feature_metrics() {
		$feature_metrics = $this->conversion_tracking->get_feature_metrics();

		$this->assertEquals(
			array(
				'conversion_tracking_enabled'    => true,
				'conversion_tracking_providers'  => array( FakeConversionEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG ),
				'conversion_tracking_events'     => array( 'fake_event_active_1', 'fake_event_active_2' ),
				'conversion_tracking_events_enh' => array( 'fake_event_active_2' ),
			),
			$feature_metrics,
			'Feature metrics should match the expected values.'
		);
	}

	public function test_get_supported_conversion_events() {
		$events = $this->conversion_tracking->get_supported_conversion_events();

		$this->assertEquals(
			array(
				'fake_event_active_1',
				'fake_event_active_2',
			),
			$events,
			'Supported conversion events should match the expected values.'
		);
	}

	public function test_get_supported_conversion_events__no_active_providers() {
		Conversion_Tracking::$providers = array();

		$events = $this->conversion_tracking->get_supported_conversion_events();

		$this->assertEquals(
			array(),
			$events,
			'Supported conversion events should be empty without active providers.'
		);
	}

	public function test_get_enhanced_conversion_events() {
		$events = $this->conversion_tracking->get_enhanced_conversion_events();

		$this->assertEquals(
			array(
				'fake_event_active_2', // Only this event is defined as enhanced in the active provider.
			),
			$events,
			'Enhanced conversion events should match the expected values.'
		);
	}

	public function test_get_site_kit_supported_conversion_events() {
		$events = $this->conversion_tracking->get_site_kit_supported_conversion_events();

		$this->assertEquals(
			array(
				'fake_event_active_1',
				'fake_event_active_2',
			),
			$events,
			'Site Kit supported conversion events should match the expected values.'
		);
	}

	public function test_get_site_kit_supported_conversion_events__no_active_providers() {
		Conversion_Tracking::$providers = array();

		$events = $this->conversion_tracking->get_site_kit_supported_conversion_events();

		$this->assertEquals(
			array(),
			$events,
			'Site Kit supported conversion events should be empty without active providers.'
		);
	}

	public function test_get_site_kit_enhanced_conversion_events() {
		$events = $this->conversion_tracking->get_site_kit_enhanced_conversion_events();

		$this->assertEquals(
			array(
				'fake_event_active_2', // Only this event is defined as enhanced in the active provider.
			),
			$events,
			'Site Kit enhanced conversion events should match the expected values.'
		);
	}

	public function test_register__adds_inline_base_data_filter() {
		$this->conversion_tracking->register();

		$this->assertTrue(
			has_filter( 'googlesitekit_inline_base_data' ),
			'The googlesitekit_inline_base_data filter should be registered.'
		);
	}

	public function test_inline_js_base_data__no_active_providers() {
		Conversion_Tracking::$providers = array();

		$this->conversion_tracking->register();

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		$this->assertArrayHasKey( 'hasActiveLeadEventProviders', $data, 'Inline base data should include active lead provider flag.' );
		$this->assertArrayHasKey( 'hasActiveEcommerceEventProviders', $data, 'Inline base data should include active ecommerce provider flag.' );
		$this->assertArrayHasKey( 'hasMultipleActiveEcommerceEventProviders', $data, 'Inline base data should include multiple ecommerce provider flag.' );
		$this->assertArrayHasKey( 'activeConversionEventProviders', $data, 'Inline base data should include the active provider slug list.' );
		$this->assertFalse( $data['hasActiveLeadEventProviders'], 'Lead provider flag should be false with no active providers.' );
		$this->assertFalse( $data['hasActiveEcommerceEventProviders'], 'Ecommerce provider flag should be false with no active providers.' );
		$this->assertFalse( $data['hasMultipleActiveEcommerceEventProviders'], 'Multiple ecommerce flag should be false with no active providers.' );
		$this->assertEquals( array(), $data['activeConversionEventProviders'], 'Inline base data should hold an empty slug list when no provider is active.' );
	}

	public function test_inline_js_base_data__with_one_active_and_one_inactive_provider() {
		$this->conversion_tracking->register();

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		$this->assertEquals(
			array( 'fake-conversion-event-provider-active' ),
			$data['activeConversionEventProviders'],
			"Inline base data should hold only the active provider's slug."
		);
	}

	public function test_inline_js_base_data__with_active_lead_provider() {
		Conversion_Tracking::$providers = array(
			FakeLeadEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeLeadEventProvider_Active::class,
		);

		$this->conversion_tracking->register();

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		$this->assertTrue( $data['hasActiveLeadEventProviders'], 'Lead provider flag should be true with active lead provider.' );
		$this->assertFalse( $data['hasActiveEcommerceEventProviders'], 'Ecommerce provider flag should be false with only lead provider.' );
		$this->assertEquals( array( 'contact-form-7' ), $data['activeConversionEventProviders'], 'Inline base data should hold the slug of the active lead provider.' );
	}

	public function test_inline_js_base_data__with_active_ecommerce_provider() {
		Conversion_Tracking::$providers = array(
			FakeEcommerceEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeEcommerceEventProvider_Active::class,
		);

		$this->conversion_tracking->register();

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		$this->assertFalse( $data['hasActiveLeadEventProviders'], 'Lead provider flag should be false with only ecommerce provider.' );
		$this->assertTrue( $data['hasActiveEcommerceEventProviders'], 'Ecommerce provider flag should be true with active provider.' );
		// A single active ecommerce provider is not "multiple".
		$this->assertFalse( $data['hasMultipleActiveEcommerceEventProviders'], 'Multiple ecommerce flag should be false with one provider.' );
		$this->assertEquals( array( 'woocommerce' ), $data['activeConversionEventProviders'], 'Inline base data should hold the slug of the active ecommerce provider.' );
	}

	public function test_inline_js_base_data__with_multiple_active_ecommerce_providers() {
		Conversion_Tracking::$providers = array(
			FakeEcommerceEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG     => FakeEcommerceEventProvider_Active::class,
			FakeEcommerceEventProvider_Active_Two::CONVERSION_EVENT_PROVIDER_SLUG => FakeEcommerceEventProvider_Active_Two::class,
		);

		$this->conversion_tracking->register();

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		$this->assertTrue( $data['hasActiveEcommerceEventProviders'], 'Ecommerce provider flag should be true with active providers.' );
		$this->assertTrue( $data['hasMultipleActiveEcommerceEventProviders'], 'Multiple ecommerce flag should be true with multiple providers.' );
		$this->assertEquals(
			array( 'woocommerce', 'easy-digital-downloads' ),
			$data['activeConversionEventProviders'],
			'Inline base data should hold one slug per active ecommerce provider.'
		);
	}

	public function test_inline_js_base_data__with_both_active_providers() {
		Conversion_Tracking::$providers = array(
			FakeLeadEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG      => FakeLeadEventProvider_Active::class,
			FakeEcommerceEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeEcommerceEventProvider_Active::class,
		);

		$this->conversion_tracking->register();

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		$this->assertTrue( $data['hasActiveLeadEventProviders'], 'Lead provider flag should be true with both provider types.' );
		$this->assertTrue( $data['hasActiveEcommerceEventProviders'], 'Ecommerce provider flag should be true with both provider types.' );
		$this->assertEquals(
			array( 'contact-form-7', 'woocommerce' ),
			$data['activeConversionEventProviders'],
			'Inline base data should hold a slug from both provider categories.'
		);
	}

	public function test_get_active_provider_categories__no_active_providers() {
		Conversion_Tracking::$providers = array();
		$categories                     = $this->conversion_tracking->get_active_provider_categories();
		$this->assertEquals( array(), $categories, 'With no active providers, the categories list should be empty.' );
	}

	public function test_get_active_provider_categories__with_lead_provider() {
		Conversion_Tracking::$providers = array(
			FakeLeadEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeLeadEventProvider_Active::class,
		);
		$categories                     = $this->conversion_tracking->get_active_provider_categories();
		$this->assertContains( Conversion_Events_Provider::CATEGORY_LEAD, $categories, 'An active lead provider should produce the lead category.' );
		$this->assertNotContains( Conversion_Events_Provider::CATEGORY_ECOMMERCE, $categories, 'With only a lead provider, the ecommerce category should not be present.' );
	}

	public function test_get_active_provider_categories__with_ecommerce_provider() {
		Conversion_Tracking::$providers = array(
			FakeEcommerceEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeEcommerceEventProvider_Active::class,
		);
		$categories                     = $this->conversion_tracking->get_active_provider_categories();
		$this->assertContains( Conversion_Events_Provider::CATEGORY_ECOMMERCE, $categories, 'An active ecommerce provider should produce the ecommerce category.' );
		$this->assertNotContains( Conversion_Events_Provider::CATEGORY_LEAD, $categories, 'With only an ecommerce provider, the lead category should not be present.' );
	}

	public function test_get_active_provider_categories__with_both_providers() {
		Conversion_Tracking::$providers = array(
			FakeLeadEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG      => FakeLeadEventProvider_Active::class,
			FakeEcommerceEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeEcommerceEventProvider_Active::class,
		);
		$categories                     = $this->conversion_tracking->get_active_provider_categories();
		$this->assertContains( Conversion_Events_Provider::CATEGORY_LEAD, $categories, 'An active lead provider should produce the lead category.' );
		$this->assertContains( Conversion_Events_Provider::CATEGORY_ECOMMERCE, $categories, 'An active ecommerce provider should produce the ecommerce category.' );
		$this->assertCount( 2, $categories, 'With one lead and one ecommerce provider, there should be exactly two categories.' );
	}

	public function test_register__when_tracking_disabled_attaches_no_hooks_or_enqueue() {
		remove_all_actions( 'wp_enqueue_scripts' );
		$this->conversion_tracking_settings->set( array( 'enabled' => false ) );

		$this->conversion_tracking->register();

		$this->assertFalse( has_action( 'wp_enqueue_scripts' ), 'wp_enqueue_scripts action should not be registered when tracking is disabled.' );
		$this->assertFalse( has_action( 'fake_provider_action' ), 'Provider hooks should not be registered when tracking is disabled.' );
	}

	public function test_inline_js_base_data__filtered_when_tracking_disabled() {
		remove_all_filters( 'googlesitekit_inline_base_data' );
		$this->conversion_tracking_settings->set( array( 'enabled' => false ) );
		Conversion_Tracking::$providers = array(
			FakeLeadEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeLeadEventProvider_Active::class,
		);

		$this->conversion_tracking->register();

		$this->assertTrue( has_filter( 'googlesitekit_inline_base_data' ), 'googlesitekit_inline_base_data filter should be registered even when tracking is disabled.' );

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		$this->assertArrayHasKey( 'hasActiveLeadEventProviders', $data, 'Inline base data should include active lead provider flag.' );
		$this->assertArrayHasKey( 'hasActiveEcommerceEventProviders', $data, 'Inline base data should include active ecommerce provider flag.' );
		$this->assertArrayHasKey( 'hasMultipleActiveEcommerceEventProviders', $data, 'Inline base data should include multiple ecommerce provider flag.' );
		$this->assertTrue( $data['hasActiveLeadEventProviders'], 'Lead provider flag should be true with active lead provider.' );
		$this->assertFalse( $data['hasActiveEcommerceEventProviders'], 'Ecommerce provider flag should be false with only lead provider.' );
		$this->assertFalse( $data['hasMultipleActiveEcommerceEventProviders'], 'Multiple ecommerce flag should be false with only lead provider.' );
		$this->assertEquals( array( 'contact-form-7' ), $data['activeConversionEventProviders'], 'Inline base data should still list the active provider slug when conversion tracking is off.' );
	}

	public function test_content_event_provider__does_not_affect_conversion_event_getters_and_categories() {
		Conversion_Tracking::$providers = array(
			FakeContentEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeContentEventProvider_Active::class,
		);

		$categories = $this->conversion_tracking->get_active_provider_categories();
		$this->assertNotContains( Conversion_Events_Provider::CATEGORY_CONTENT, $categories, 'Active provider categories should not contain CATEGORY_CONTENT.' );
		$this->assertEmpty( $categories, 'Active provider categories should be empty when only a content provider is active.' );

		$this->assertEmpty( $this->conversion_tracking->get_supported_conversion_events(), 'Supported conversion events should be empty for content event providers.' );
		$this->assertEmpty( $this->conversion_tracking->get_enhanced_conversion_events(), 'Enhanced conversion events should be empty for content event providers.' );
		$this->assertEmpty( $this->conversion_tracking->get_site_kit_supported_conversion_events(), 'Site Kit supported conversion events should be empty for content event providers.' );
		$this->assertEmpty( $this->conversion_tracking->get_site_kit_enhanced_conversion_events(), 'Site Kit enhanced conversion events should be empty for content event providers.' );

		$feature_metrics = $this->conversion_tracking->get_feature_metrics();
		$this->assertEquals(
			array(
				'conversion_tracking_enabled'    => true,
				'conversion_tracking_providers'  => array( FakeContentEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG ),
				'conversion_tracking_events'     => array(),
				'conversion_tracking_events_enh' => array(),
			),
			$feature_metrics,
			'Feature metrics should list the provider slug but have empty conversion event arrays.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_default_providers() {
		$this->assertArrayHasKey( Content_Events::CONVERSION_EVENT_PROVIDER_SLUG, self::$default_providers, 'Default providers should contain content-events slug.' );
		$this->assertEquals( Content_Events::class, self::$default_providers[ Content_Events::CONVERSION_EVENT_PROVIDER_SLUG ], 'content-events should map to Content_Events class.' );
	}
}
