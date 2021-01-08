<?php
/**
 * Class Google\Site_Kit\Core\Tags\Tag
 *
 * @package   Google\Site_Kit\Core\Tags
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags;

use Google\Site_Kit\Core\Guards\Guard_Interface;

/**
 * Base class for tags.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Tag implements Tag_Interface {

	/**
	 * Tag ID.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	protected $tag_id;

	/**
	 * Guards array.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $guards = array();

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $tag_id Tag ID.
	 */
	public function __construct( $tag_id ) {
		$this->tag_id = $tag_id;
	}

	/**
	 * Adds a new guard to the guards list.
	 *
	 * @since n.e.x.t
	 *
	 * @param Guard_Interface $guard A guard instance to add to the guards list.
	 */
	public function use_guard( Guard_Interface $guard ) {
		$this->guards[] = $guard;
	}

	/**
	 * Determines whether the tag can be register or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool TRUE if the tag can be register, otherwise FALSE.
	 */
	public function can_register() {
		foreach ( $this->guards as $guard ) {
			if ( $guard instanceof Guard_Interface ) {
				$can_activate = $guard->can_activate();
				if ( is_wp_error( $can_activate ) || ! $can_activate ) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	abstract public function register();

}
