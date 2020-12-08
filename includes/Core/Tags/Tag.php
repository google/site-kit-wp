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

/**
 * Base class for tags.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Tag implements Tag_Interface {

	/**
	 * Module slug.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	protected $slug;

	/**
	 * Tag ID.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $tag_id;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $module_slug Module slug.
	 * @param string $tag_id Tag ID.
	 */
	public function __construct( $module_slug, $tag_id ) {
		$this->module_slug = $module_slug;
		$this->tag_id      = $tag_id;
	}

	/**
	 * Renders tag output.
	 *
	 * @since n.e.x.t
	 */
	abstract public function render();

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
	}

}
