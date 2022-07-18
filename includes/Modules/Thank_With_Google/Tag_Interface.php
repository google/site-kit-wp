<?php
/**
 * Class Google\Site_Kit\Modules\Thank_With_Google\Tag_Interface
 *
 * @package   Google\Site_Kit\Modules\Thank_With_Google
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Thank_With_Google;

/**
 * Interface for an Thank_With_Google tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Tag_Interface {
	/**
	 * Sets the current publication ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $publication_id Publication ID.
	 */
	public function set_publication_id( $publication_id );

	/**
	 * Sets the current button placement.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $button_placement Button placement.
	 */
	public function set_button_placement( $button_placement );

	/**
	 * Sets the current button post types.
	 *
	 * @since n.e.x.t
	 *
	 * @param string[] $button_post_types Button post types.
	 */
	public function set_button_post_types( $button_post_types );
}
