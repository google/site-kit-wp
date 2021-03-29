<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google\Key
 *
 * @package   Google\Site_Kit\Modules\Subscribe_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Subscribe_With_Google;

/**
 * Creates namespaced keys.
 */
final class Key {

	/**
	 * Returns a namespaced key.
	 *
	 * @param string $key Key to namespace.
	 * @return string Namespaced key.
	 */
	public static function from( $key ) {
		return 'SubscribeWithGoogle_' . $key;
	}

}
