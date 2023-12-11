<?php
/**
 * Class Google\Site_Kit\Core\Admin\Admin_Column
 *
 * @package   Google\Site_Kit
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

/**
 * Class representing a WordPress admin column.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Admin_Column {

	/**
	 * Column arguments.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $args = array();

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $args {
	 *     Associative array of admin column arguments.
	 *
	 *     @type string   $key             Unique admin column key.
	 *     @type string   $label           The admin column label.
	 *     @type string   $post_type       Post type to add the admin column to.
	 *     @type callable $render_callback Callback function to render the column content. The post ID and column key are passed to the callback.
	 * }
	 */
	public function __construct( array $args ) {
		$this->args = $args;
	}

	/**
	 * Registers the admin column.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		// @TODO args['post_type'] is replaced by allowed post types, it can be passed here as well.
		add_filter(
			'manage_' . $this->args['post_type'] . '_posts_columns',
			function( $columns ) {
				$columns[ $this->args['key'] ] = $this->args['label'];
				return $columns;
			}
		);

		add_action(
			'manage_' . $this->args['post_type'] . '_posts_custom_column',
			function( $key, $post_id ) {

				if (
				$key !== $this->args['key'] ||
				! is_callable( $this->args['render_callback'] )
				) {
					return;
				}

				$this->args['render_callback']( $post_id, $key );
			},
			10,
			2
		);
	}
}
