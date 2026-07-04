<?php
/**
 * FakeLeadEventProvider_Active
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Contact_Form_7;

/**
 * Fake lead event provider that is always active, using a real lead provider slug.
 */
class FakeLeadEventProvider_Active extends FakeConversionEventProvider_Active {

	const CONVERSION_EVENT_PROVIDER_SLUG = Contact_Form_7::CONVERSION_EVENT_PROVIDER_SLUG;

	/**
	 * Gets the provider category.
	 *
	 * @since 1.181.0
	 *
	 * @return string Provider category.
	 */
	public function get_category() {
		return self::CATEGORY_LEAD;
	}
}
