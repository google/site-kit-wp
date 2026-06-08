<?php
/**
 * FakeEcommerceEventProvider_Active
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerce;

/**
 * Fake ecommerce event provider that is always active, using a real ecommerce provider slug.
 */
class FakeEcommerceEventProvider_Active extends FakeConversionEventProvider_Active {

	const CONVERSION_EVENT_PROVIDER_SLUG = WooCommerce::CONVERSION_EVENT_PROVIDER_SLUG;

	/**
	 * Gets the provider category.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Provider category.
	 */
	public function get_category() {
		return self::CATEGORY_ECOMMERCE;
	}
}
