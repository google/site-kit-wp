<?php
/**
 * Class Google\Site_Kit\Core\Admin\Admin_Columns
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
class Admin_Columns {

	/**
	 * Column arguments.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $args = array();

	// @TODO add construct that will accept $allowed_post_types

	/**
	 * Registers the admin column.
	 *
	 * @since n.e.x.t
	 *
	 * @param string   $key             Unique admin column key.
	 * @param string   $label           The admin column label.
	 * @param string   $metric          The report metric which will be used for column value.
	 * @param callable $render_callback Callback function to render the column content. The post ID and column key are passed to the callback.
	 */
	public function add( $key, $label, $metric, $render_callback = null ) {
		$this->args[ $key ] = array(
			'label'           => $label,
			'metric'          => $metric,
			'render_callback' => $render_callback,
		);
	}

	/**
	 * Registers the admin column.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		array_walk(
			$this->args,
			function( $column_data ) {
				foreach ( $this->allowed_post_types as $key => $post_type ) {
					( new Admin_Column( $column_data ) )->register();
				}
			}
		);
	}

	/**
	 * Gets the admin column definition.
	 *
	 * @since n.e.x.t
	 */
	public function get_columns_definition() {
		return $this->args;
	}
}
