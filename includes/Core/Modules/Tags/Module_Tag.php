<?php
/**
 * Class Google\Site_Kit\Core\Modules\Tags\Module_Tag
 *
 * @package   Google\Site_Kit\Core\Tags
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules\Tags;

use Google\Site_Kit\Core\Tags\Tag;

/**
 * Base class for a module tag.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
abstract class Module_Tag extends Tag {

	/**
	 * HTML attribute that has the tag ID on each element Site Kit prints to load a module tag, other than Site Kit's
	 * Google tag scripts.
	 *
	 * @since n.e.x.t
	 */
	const TAG_ID_ATTRIBUTE = 'data-googlesitekit-tag';

	/**
	 * Module slug.
	 *
	 * @since 1.24.0
	 * @since 1.109.0 Renamed from slug to module_slug.
	 *
	 * @var string
	 */
	protected $module_slug;

	/**
	 * Constructor.
	 *
	 * @since 1.24.0
	 *
	 * @param string $tag_id Tag ID.
	 * @param string $module_slug Module slug.
	 */
	public function __construct( $tag_id, $module_slug ) {
		parent::__construct( $tag_id );
		$this->module_slug = $module_slug;
	}

	/**
	 * Gets the tag ID attribute as HTML.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The attribute with the tag ID, after a space.
	 */
	protected function get_tag_id_attribute() {
		return sprintf( ' %s="%s"', self::TAG_ID_ATTRIBUTE, esc_attr( $this->tag_id ) );
	}

	/**
	 * Outputs the tag.
	 *
	 * @since 1.24.0
	 */
	abstract protected function render();
}
