<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\WP_Context_Switcher
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\WP_Context_Switcher_Trait;

/**
 * Class WP_Context_Switcher
 *
 * A proxy class just to access protected trait methods.
 */
class WP_Context_Switcher {
	use WP_Context_Switcher_Trait {
		with_frontend_context as trait_with_frontend_context;
	}

	/**
	 * Calls {@see WP_Context_Switcher_Trait::with_frontend_context()}.
	 *
	 * @return callable Closure that restores context and returns true if context was restored or false otherwise.
	 */
	public static function with_frontend_context() {
		return self::trait_with_frontend_context();
	}
}
