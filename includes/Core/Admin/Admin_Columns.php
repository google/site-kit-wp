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

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Storage\Transients;

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


	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * Module instance.
	 *
	 * @since n.e.x.t
	 * @var Module
	 */
	protected $module;

	/**
	 * Transients instance.
	 *
	 * @since n.e.x.t
	 * @var Transients
	 */
	protected $transients;

	/**
	 * Assets instance.
	 *
	 * @since n.e.x.t
	 * @var Assets
	 */
	protected $assets;

	/**
	 * Admin_Columns_REST_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var Admin_Columns_REST_Controller
	 */
	protected $rest_controller;

	/**
	 * Columns_Data instance.
	 *
	 * @since n.e.x.t
	 * @var Columns_Data
	 */
	protected $columns_data;

	/**
	 * Allowed post types array.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $allowed_post_types;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context    $context    Plugin context.
	 * @param Module     $module     Module instance.
	 * @param Transients $transients Optional. Transient API instance. Default is a new instance.
	 * @param Assets     $assets     Assets instance.
	 * @param array      $allowed_post_types Optional. Post types slugs array on which custom columns should be shown.
	 */
	public function __construct(
		Context $context,
		Module $module,
		Transients $transients = null,
		Assets $assets,
		$allowed_post_types = array( 'post', 'page' )
	) {
		$this->context    = $context;
		$this->module     = $module;
		$this->transients = $transients ?: new Transients( $this->context );
		$this->assets     = $assets;

		/**
		 * Allowed post types for which to show column data.
		 *
		 * Filters the array of allowed post types on which column data will be included.
		 *
		 * @since n.e.x.t
		 *
		 * @param array $allowed_post_types Array of allowed post types.
		 */
		$this->allowed_post_types = apply_filters( "googlesitekit_{$module->slug}_column_data_allowed_post_types", $allowed_post_types );

		$this->columns_data = new Columns_Data(
			$this->context,
			$this->module,
			$this,
			$this->transients
		);

		$this->rest_controller = new Admin_Columns_REST_Controller( $this->context, $this->columns_data );
	}


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
			function( $args ) {
				foreach ( $this->allowed_post_types as $key => $post_type ) {
					$admin_column = new Admin_Column(
						$post_type,
						array_keys( $args )[0],
						$args,
						$this->columns_data
					);
					$admin_column->register();
				}
			}
		);

		$this->columns_data->register();

		add_action(
			'admin_enqueue_scripts',
			function() {
				$this->assets->enqueue_asset( 'googlesitekit-admin-columns-data' );
			}
		);

		$this->rest_controller->register();
	}

	/**
	 * Gets the admin column definition.
	 *
	 * @since n.e.x.t
	 */
	public function get_columns_definition() {
		return $this->args;
	}

	/**
	 * Gets the allowed post types array.
	 *
	 * @since n.e.x.t
	 */
	public function get_allowed_post_types() {
		return $this->allowed_post_types;
	}
}
