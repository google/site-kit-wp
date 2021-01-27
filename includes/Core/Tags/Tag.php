<?php
/**
 * Class Google\Site_Kit\Core\Tags\Tag
 *
 * @package   Google\Site_Kit\Core\Tags
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags;

use Google\Site_Kit\Core\Guards\Guard_Interface;

/**
 * Base class for tags.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
abstract class Tag implements Tag_Interface {

	/**
	 * Tag ID.
	 *
	 * @since 1.24.0
	 * @var string
	 */
	protected $tag_id;

	/**
	 * Guards array.
	 *
	 * @since 1.24.0
	 * @var array
	 */
	protected $guards = array();

	/**
	 * Constructor.
	 *
	 * @since 1.24.0
	 *
	 * @param string $tag_id Tag ID.
	 */
	public function __construct( $tag_id ) {
		$this->tag_id = $tag_id;
	}

	/**
	 * Adds a new guard to the guards list.
	 *
	 * @since 1.24.0
	 *
	 * @param Guard_Interface $guard A guard instance to add to the guards list.
	 */
	public function use_guard( Guard_Interface $guard ) {
		$this->guards[] = $guard;
	}

	/**
	 * Determines whether the tag can be register or not.
	 *
	 * @since 1.24.0
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
	 * @since 1.24.0
	 */
	abstract public function register();

}
