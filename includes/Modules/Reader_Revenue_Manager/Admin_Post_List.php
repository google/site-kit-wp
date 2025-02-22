<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Admin_Post_List
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

/**
 * Class for adding RRM elements to the WP Admin post list.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Admin_Post_List {

	/**
	 * Post_Product_ID instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Post_Product_ID
	 */
	private $post_product_id;

	/**
	 * Settings instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Settings        $settings        Module settings instance.
	 * @param Post_Product_ID $post_product_id Post Product ID.
	 */
	public function __construct( Settings $settings, $post_product_id ) {
		$this->settings        = $settings;
		$this->post_product_id = $post_product_id;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$post_types = $this->get_post_types();

		foreach ( $post_types as $post_type ) {
			add_filter(
				"manage_{$post_type}_posts_columns",
				array( $this, 'add_column' )
			);

			add_action(
				"manage_{$post_type}_posts_custom_column",
				array( $this, 'fill_column' ),
				10,
				2
			);
		}

		add_action(
			'bulk_edit_custom_box',
			array( $this, 'bulk_edit_field' ),
			10,
			2
		);

		add_action( 'save_post', array( $this, 'save_field' ) );
	}

	/**
	 * Adds a custom column to the post list.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $columns Columns.
	 * @return array Modified columns.
	 */
	public function add_column( $columns ) {
		$columns['rrm_product_id'] = __( 'Show Reader Revenue CTAs', 'google-site-kit' );
		return $columns;
	}

	/**
	 * Fills the custom column with data.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $column  Column name.
	 * @param int    $post_id Post ID.
	 */
	public function fill_column( $column, $post_id ) {
		if ( 'rrm_product_id' !== $column ) {
			return;
		}

		$post_product_id = $this->post_product_id->get( $post_id );

		if ( 'none' === $post_product_id ) {
			esc_html_e( 'Exclude from Reader Revenue Manager', 'google-site-kit' );

			return;
		}

		if ( ! empty( $post_product_id ) ) {
			// Extract the product ID from the setting, which is in the format
			// of `publicationID:productID`.
			if ( 'openaccess' !== $post_product_id ) {
				$separator_index = strpos( $post_product_id, ':' );

				if ( false !== $separator_index ) {
					$post_product_id = substr( $post_product_id, $separator_index + 1 );
				}
			}

			if ( 'openaccess' === $post_product_id ) {
				esc_html_e( 'Use "open access"', 'google-site-kit' );

				return;
			}

			echo esc_html(
				sprintf(
					/* translators: %s: Product ID */
					__( 'Use "%s"', 'google-site-kit' ),
					$post_product_id
				),
			);

			return;
		}

		$settings = $this->settings->get();

		if ( 'per_post' === $settings['snippetMode'] ) {
			esc_html_e( 'Exclude from Reader Revenue Manager', 'google-site-kit' );

			return;
		}

		/**
		 * Filters the post types where Reader Revenue Manager CTAs should appear.
		 *
		 * @since 1.140.0
		 *
		 * @param array $cta_post_types The array of post types.
		 */
		$cta_post_types = apply_filters(
			'googlesitekit_reader_revenue_manager_cta_post_types',
			$settings['postTypes']
		);

		if ( 'post_types' === $settings['snippetMode'] &&
			! in_array( get_post_type(), $cta_post_types, true )
		) {
			esc_html_e( 'Exclude from Reader Revenue Manager', 'google-site-kit' );

			return;
		}

		esc_html_e(
			'Use default selection',
			'google-site-kit'
		);
	}

	/**
	 * Adds a custom field to the bulk edit form.
	 *
	 * @since n.e.x.t
	 */
	public function bulk_edit_field() {
		$settings    = $this->settings->get();
		$product_ids = $settings['productIDs'];
		?>
		<fieldset class="inline-edit-col-right">
			<div class="inline-edit-col">
				<label
					style="display: flex; justify-content: space-between; line-height: 1;">
					<span>
						<?php esc_html_e( 'Show Reader Revenue CTAs', 'google-site-kit' ); ?>
					</span>
					<select name="rrm_product_id">
						<option value="-1">
							<?php esc_html_e( '— No Change —', 'google-site-kit' ); ?>
						</option>
						<option value="">
							<?php esc_html_e( 'Use default selection', 'google-site-kit' ); ?>
						</option>
						<option value="none">
							<?php
							esc_html_e(
								'Exclude from Reader Revenue Manager',
								'google-site-kit'
							);
							?>
						</option>
						<option value="openaccess">
							<?php
							esc_html_e(
								'Use "open access"',
								'google-site-kit'
							);
							?>
						</option>
						<?php foreach ( $product_ids as $product_id ) : ?>
							<option value="<?php echo esc_attr( $product_id ); ?>">
								<?php
								echo esc_html(
									sprintf(
										/* translators: %s: Product ID */
										__( 'Use "%s"', 'google-site-kit' ),
										$product_id
									),
								);
								?>
							</option>
						<?php endforeach; ?>
					</select>				
				</label>
			</div>
		</fieldset>
		<?php
	}

	/**
	 * Saves the custom field value from the bulk edit form.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $post_id Post ID.
	 */
	public function save_field( $post_id ) {
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( ! isset( $_REQUEST['_wpnonce'] ) ) {
			return;
		}

		$nonce = sanitize_key( wp_unslash( $_REQUEST['_wpnonce'] ) );

		if ( ! wp_verify_nonce( $nonce, 'bulk-posts' ) ) {
			return;
		}

		if ( isset( $_REQUEST['rrm_product_id'] ) ) {
			$post_product_id = sanitize_text_field(
				wp_unslash( $_REQUEST['rrm_product_id'] )
			);

			$this->post_product_id->set(
				$post_id,
				$post_product_id
			);
		}
	}

	/**
	 * Retrieves the public post types that support the block editor.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Array of post types.
	 */
	protected function get_post_types() {
		$post_types = get_post_types( array( 'public' => true ), 'objects' );

		$supported_post_types = array();

		foreach ( $post_types as $post_type => $post_type_obj ) {
			if (
				post_type_supports( $post_type, 'editor' ) &&
				! empty( $post_type_obj->show_in_rest )
			) {
				$supported_post_types[] = $post_type;
			}
		}

		return $supported_post_types;
	}
}
