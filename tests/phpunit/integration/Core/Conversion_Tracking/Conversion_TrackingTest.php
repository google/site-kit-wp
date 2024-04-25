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
}
