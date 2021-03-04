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
	 * Module slug.
	 *
	 * @since 1.24.0
	 * @var string
	 */
	protected $slug;

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
	 * Outputs the tag.
	 *
	 * @since 1.24.0
	 */
	abstract protected function render();

}
