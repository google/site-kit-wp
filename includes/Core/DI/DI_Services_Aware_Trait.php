<?php
/**
 * Class Google\Site_Kit\Core\DI\DI_Services_Aware_Trait
 *
 * @package   Google\Site_Kit\Core\DI
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\DI;

/**
 * Trait for DI services aware classes.
 *
 * @since n.e.x.t
 */
trait DI_Services_Aware_Trait {

	/**
	 * Gets DI service instance.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name Service name.
	 * @return mixed DI service on success, otherwise NULL.
	 */
	public function __get( $name ) {
		if ( $this instanceof DI_Aware_Interface ) {
			return $this->get_di()->get( $name );
		}

		return null;
	}

}
