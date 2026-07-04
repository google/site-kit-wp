<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Tag_Interface
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

/**
 * Interface for an Analytics 4 tag.
 *
 * @since 1.113.0
 * @access private
 * @ignore
 */
interface Tag_Interface {
	/**
	 * Sets custom dimensions data.
	 *
	 * @since 1.113.0
	 *
	 * @param string $custom_dimensions Custom dimensions data.
	 */
	public function set_custom_dimensions( $custom_dimensions );
}
