<?php
/**
 * Class Google\Site_Kit\Core\Util\Method_Proxy_Trait
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

trait Method_Proxy_Trait {

	/**
	 * Gets a proxy function for a class method.
	 *
	 * @since 1.17.0
	 * @since n.e.x.t Added the $type parameter.
	 *
	 * @param string $method Method name.
	 * @param string $type Method type that defines how proxied function should be used. Accepts "multi-callable" and "once-callable" which means that the proxied method can be executed only once.
	 * @return callable A proxy function.
	 */
	private function get_method_proxy( $method, $type = 'multi-callable' ) {
		static $calls = array();

		return function ( ...$args ) use ( $method, $type, $calls ) {
			if ( 'once-callable' === $type && array_key_exists( $method, $calls ) ) {
				return $calls[ $method ];
			}

			$results = $this->{ $method }( ...$args );
			if ( 'once-callable' === $type ) {
				$calls[ $method ] = $results;
			}

			return $results;
		};
	}

}
