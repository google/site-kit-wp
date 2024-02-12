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
	 * Column key.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	protected $column_key;

	/**
	 * Post type slug.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	protected $post_type = 'post';

	/**
	 * Column arguments.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $args = array();

	/**
	 * Columns_Data instance.
	 *
	 * @since n.e.x.t
	 * @var Columns_Data
	 */
	protected $columns_data;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string       $post_type          The post type on which to render the column.
	 * @param string       $column_key         Unique admin column key.
	 * @param array        $args               Associative array of admin column arguments.
	 *     @type string   $label           The admin column label.
	 *     @type string   $metric          The report metric which will be used for column value.
	 *     @type callable $render_callback Callback function to render the column content. The post ID and column key are passed to the callback.
	 * @param Columns_Data $columns_data Columns_Data instance.
	 */
	public function __construct( $post_type, $column_key, array $args, Columns_Data $columns_data ) {
		$this->post_type    = $post_type;
		$this->column_key   = $column_key;
		$this->args         = $args;
		$this->columns_data = $columns_data;
	}

	/**
	 * Registers the admin column.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'manage_' . $this->post_type . '_posts_columns',
			function( $columns ) {
				$columns[ $this->column_key ] = $this->args['label'];
				return $columns;
			}
		);

		add_action(
			'manage_' . $this->post_type . '_posts_custom_column',
			function( $key, $post_id ) {

				if (
					$key !== $this->column_key
				) {
					return;
				}

				if ( ! empty( $this->args['render_callback'] ) && is_callable( $this->args['render_callback'] ) ) {
					$this->args['render_callback']( $post_id, $key );

				} else {
					$this->render_column_data( $post_id, $key, $this->columns_data->get_data() );
				}

				return;
			},
			10,
			2
		);
	}

	/**
	 * Registers the admin column.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $post_id Post id.
	 * @param string $key     The column key.
	 * @param string $data    The stored report data.
	 */
	protected function render_column_data( $post_id, $key, $data ) {
		if ( isset( $data[ $post_id ] ) ) {
			printf(
				'<span class="googlesitekit-views-column" data-column="%s" data-id="%s">%d</span>',
				esc_attr( $key ),
				esc_attr( $post_id ),
				esc_html( $data[ $post_id ]['views'] )
			);
		} else {
			printf(
				'<span class="googlesitekit-views-column" data-column="%s" data-id="%s">%d</span>',
				esc_attr( $key ),
				esc_attr( $post_id ),
				0
			);
		}
	}
}
