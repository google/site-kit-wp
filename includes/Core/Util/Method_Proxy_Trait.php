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
	 *
	 * @param string $method Method name.
	 * @return callable A proxy function.
	 */
	private function get_method_proxy( $method ) {
		return function ( ...$args ) use ( $method ) {
			return $this->{ $method }( ...$args );
		};
	}

}
