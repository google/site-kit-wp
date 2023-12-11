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
final class Admin_Column {

	/**
	 * Unique column slug.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $key;

	/**
	 * Column arguments.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $args = array();

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $key Unique admin column key.
	 * @param array  $args {
	 *     Associative array of admin column arguments.
	 *
	 *     @type string   $label           The admin column label.
	 *     @type string   $post_type       Post type to add the admin column to.
	 *     @type callable $render_callback Callback function to render the column content. The post ID and column key are passed to the callback.
	 * }
	 */
	public function __construct( $key, array $args ) {
		$this->key  = $key;
		$this->args = wp_parse_args(
			$args,
			array(
				'label'           => $this->key,
				'post_type'       => 'post',
				'render_callback' => null,
			)
		);
	}

	/**
	 * Registers the admin column.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'manage_' . $this->args['post_type'] . '_posts_columns',
			function( $columns ) {
				$columns[ $this->key ] = $this->args['label'];
				return $columns;
			}
		);

		add_action(
			'manage_' . $this->args['post_type'] . '_posts_custom_column',
			function( $key, $post_id ) {

				if (
				$key !== $this->key ||
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
