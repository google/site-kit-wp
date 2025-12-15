<?php
/**
 * Class Google\Site_Kit\Modules\Tag_Manager\Tag_Interface
 *
 * @package   Google\Site_Kit\Modules\Tag_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Tag_Manager;

/**
 * Interface for a Tag Manager tag.
 *
 * @since 1.162.0
 * @access private
 * @ignore
 */
interface Tag_Interface {

	/**
	 * Sets Google tag gateway active state.
	 *
	 * @since 1.162.0
	 *
	 * @param bool $active Google tag gateway active state.
	 */
	public function set_is_google_tag_gateway_active( $active );
}
