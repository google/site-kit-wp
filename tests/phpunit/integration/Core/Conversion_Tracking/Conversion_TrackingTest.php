<?php
/**
 * Conversion_TrackingTest
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Tests\Core\Conversion_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeConversionEventProvider;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeConversionEventProvider_Active;
use Google\Site_Kit\Tests\TestCase;

class Conversion_TrackingTest extends TestCase {

	/**
	 * Conversion_Tracking instance.
	 *
	 * @var Conversion_Tracking
	 */
	private $conversion_tracking;

	public function set_up() {
		parent::set_up();

		$this->conversion_tracking = new Conversion_Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->conversion_tracking::$conversion_event_providers = array(
			FakeConversionEventProvider::CONVERSION_EVENT_PROVIDER_SLUG        => FakeConversionEventProvider::class,
			FakeConversionEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeConversionEventProvider_Active::class,
		);
	}

	public function test_register() {
		global $wp_scripts;

		$this->conversion_tracking->register();

		$enqueued = array_flip( $wp_scripts->queue );

		$this->assertArrayHasKey(
			'gsk-cep-' . FakeConversionEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG,
			$enqueued,
		);

		$this->assertArrayNotHasKey(
			FakeConversionEventProvider::CONVERSION_EVENT_PROVIDER_SLUG,
			$enqueued
		);
	}

	public function test_get_active_conversion_event_providers() {
		$active_conversion_event_providers = $this->conversion_tracking->get_active_conversion_event_providers();

		$this->assertArrayHasKey(
			FakeConversionEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG,
			$active_conversion_event_providers
		);

		$this->assertArrayNotHasKey(
			FakeConversionEventProvider::CONVERSION_EVENT_PROVIDER_SLUG,
			$active_conversion_event_providers
		);
	}

	/**
	 * @dataProvider data_register
	 *
	 * @param $classname
	 * @param $expected_exception
	 */
	public function test_instantiate_conversion_event_provider( $classname, $expected_exception ) {
		try {
			$this->conversion_tracking->instantiate_conversion_event_provider( $classname );
		} catch ( \Exception $exception ) {
			if ( ! $expected_exception ) {
				$this->fail( 'No exception expected but a ' . get_class( $exception ) . ' was thrown' );
			}
			$this->assertEquals( $expected_exception, $exception->getMessage() );
		}
	}

	public function data_register() {
		$exception_no_classname     = 'A conversion event provider class name is required to instantiate a conversion event provider.';
		$exception_not_extends_base = 'All conversion event provider classes must extend the base conversion event provider class: ' . Conversion_Events_Provider::class;

		return array(
			'no class name'                     => array( '', $exception_no_classname ),
			'non-existent class name'           => array( '\\Foo\\Bar', "No class exists for '\\Foo\\Bar'" ),
			'existing class not-extending base' => array( __CLASS__, $exception_not_extends_base ),
		);
	}
}
