<?php
/**
 * Class Google\Site_Kit\Core\Util\Entity
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class representing an entity.
 *
 * An entity in Site Kit terminology is based on a canonical URL, i.e. every
 * canonical frontend URL has an associated entity.
 *
 * An entity may also have a type, if it can be determined.
 * Possible types are e.g. 'post' for a WordPress post (of any post type!),
 * 'term' for a WordPress term (of any taxonomy!), 'blog' for the blog archive,
 * 'date' for a date-based archive etc.
 *
 * For specific entity types, the entity will also have a title, and it may
 * even have an ID. For example:
 * * For a type of 'post', the entity ID will be the post ID and the entity
 *   title will be the post title.
 * * For a type of 'term', the entity ID will be the term ID and the entity
 *   title will be the term title.
 * * For a type of 'date', there will be no entity ID, but the entity title
 *   will be the title of the date-based archive.
 *
 * @since 1.7.0
 * @access private
 * @ignore
 */
final class Entity {

	/**
	 * The entity URL.
	 *
	 * @since 1.7.0
	 * @var string
	 */
	private $url;

	/**
	 * The entity type.
	 *
	 * @since 1.7.0
	 * @var string
	 */
	private $type;

	/**
	 * The entity title.
	 *
	 * @since 1.7.0
	 * @var string
	 */
	private $title;

	/**
	 * The entity ID.
	 *
	 * @since 1.7.0
	 * @var int
	 */
	private $id;

	/**
	 * Constructor.
	 *
	 * @since 1.7.0
	 *
	 * @param string $url  The entity URL.
	 * @param array  $args {
	 *     Optional. Additional entity arguments.
	 *
	 *     @type string $type  The entity type.
	 *     @type string $title The entity title.
	 *     @type int    $id    The entity ID.
	 * }
	 */
	public function __construct( $url, array $args = array() ) {
		$args = array_merge(
			array(
				'type'  => '',
				'title' => '',
				'id'    => 0,
			),
			$args
		);

		$this->url   = $url;
		$this->type  = (string) $args['type'];
		$this->title = (string) $args['title'];
		$this->id    = (int) $args['id'];
	}

	/**
	 * Gets the entity URL.
	 *
	 * @since 1.7.0
	 *
	 * @return string The entity URL.
	 */
	public function get_url() {
		return $this->url;
	}

	/**
	 * Gets the entity type.
	 *
	 * @since 1.7.0
	 *
	 * @return string The entity type, or empty string if unknown.
	 */
	public function get_type() {
		return $this->type;
	}

	/**
	 * Gets the entity title.
	 *
	 * @since 1.7.0
	 *
	 * @return string The entity title, or empty string if unknown.
	 */
	public function get_title() {
		return $this->title;
	}

	/**
	 * Gets the entity ID.
	 *
	 * @since 1.7.0
	 *
	 * @return int The entity ID, or 0 if unknown.
	 */
	public function get_id() {
		return $this->id;
	}
}
