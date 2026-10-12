<?php
/**
 * FakeConversionEventProvider_Active_Overlapping
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

/**
 * Fake conversion event provider that is always active, sharing one event with
 * `FakeConversionEventProvider_Active` and adding one of its own.
 */
class FakeConversionEventProvider_Active_Overlapping extends FakeConversionEventProvider_Active {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'fake-conversion-event-provider-active-overlapping';

	/**
	 * Gets the event names.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array(
			'fake_event_active_2',
			'fake_event_active_3',
		);
	}
}
