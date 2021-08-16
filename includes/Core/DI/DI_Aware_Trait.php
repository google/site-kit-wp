<?php
/**
 * Class Google\Site_Kit\Core\DI\DI_Aware_Trait
 *
 * @package   Google\Site_Kit\Core\DI
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\DI;

use Google\Site_Kit_Dependencies\Psr\Container\ContainerInterface;

/**
 * Trait for injection aware classes.
 *
 * @since n.e.x.t
 */
trait DI_Aware_Trait {

	/**
	 * DI container.
	 *
	 * @since n.e.x.t
	 * @var ContainerInterface
	 */
	protected $di_container;

	/**
	 * Gets DI container.
	 *
	 * @since n.e.x.t
	 *
	 * @return ContainerInterface DI container.
	 */
	public function get_di() {
		return $this->di_container;
	}

	/**
	 * Sets DI container.
	 *
	 * @since n.e.x.t
	 *
	 * @param ContainerInterface $di_container DI container.
	 */
	public function set_di( ContainerInterface $di_container ) {
		$this->di_container = $di_container;
	}

}
