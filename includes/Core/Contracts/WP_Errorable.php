<?php
/**
 * Interface Google\Site_Kit\Core\Contracts\WP_Errorable.
 *
 * @package   Google\Site_Kit\Core\Contracts
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Contracts;

use WP_Error;

/**
 * Interface for a class which can be represented as a WP_Error.
 *
 * @since 1.9.0
 */
interface WP_Errorable {

	/**
	 * Gets the WP_Error representation of this entity.
	 *
	 * @since 1.9.0
	 *
	 * @return WP_Error
	 */
	public function to_wp_error();
}
