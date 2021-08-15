<?php
/**
 * Class Google\Site_Kit\Core\DI\Injection_Aware_Interface
 *
 * @package   Google\Site_Kit\Core\Dismissals
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\DI;

use Google\Site_Kit_Dependencies\Psr\Container\ContainerInterface;

interface DI_Aware_Interface {

	/**
	 * Gets DI container.
	 *
	 * @since n.e.x.t
	 *
	 * @return ContainerInterface DI container.
	 */
	public function get_di();

	/**
	 * Sets DI container.
	 *
	 * @since n.e.x.t
	 *
	 * @param ContainerInterface $di_container DI container.
	 */
	public function set_di( ContainerInterface $di_container );

}
