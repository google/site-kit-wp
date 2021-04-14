<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google\InlineEditPost
 *
 * @package   Google\Site_Kit\Modules\Subscribe_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Subscribe_With_Google;

/** Modifies inline post editing. */
final class InlineEditPost {

	/**
	 * Name of product field.
	 *
	 * @var string
	 */
	private $product_field_name;

	/**
	 * Name of nonce.
	 *
	 * @var string
	 */
	private $nonce_name;

	/**
	 * Action of nonce.
	 *
	 * @var string
	 */
	private $nonce_action;

	/**
	 * Adds action handlers.
	 *
	 * @param object $settings Settings for SwG.
	 */
	public function __construct( $settings ) {
		$this->product_field_name = Key::from( 'product' );
		$this->nonce_name         = Key::from( 'quick_edit_nonce' );
		$this->nonce_action       = Key::from( 'saving_post' );
		$this->settings           = $settings;

		// Render a SwG product dropdown in the Bulk Edit interface.
		// TODO: Get the saving working.
		add_action( 'bulk_edit_custom_box', array( $this, 'quick_edit_custom_box' ) );

		// Render a SwG product dropdown in the Quick Edit interface.
		add_action( 'quick_edit_custom_box', array( $this, 'quick_edit_custom_box' ) );

		// Handle Posts being saved.
		add_action( 'save_post', array( $this, 'save_post' ) );

		// Add admin JS.
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
	}

	/** Enqueues admin JS. */
	public function admin_enqueue_scripts() {
		wp_enqueue_script(
			'subscribe-with-google',
			plugins_url( '../../../dist/assets/js/subscribe-with-google--inline-edit-post.js', __FILE__ ),
			null,
			1,
			true
		);
	}

	/**
	 * Allow SwG product selection within the Quick Edit interface.
	 *
	 * @param string $column The column to potentially add HTML to.
	 */
	public function quick_edit_custom_box( $column ) {

		if ( 'swg_product' !== $column ) {
			return;
		}

		wp_nonce_field( $this->nonce_action, $this->nonce_name );

		$products_str = trim( $this->settings['products'] );
		$products     = explode( "\n", $products_str );
		array_unshift( $products, 'openaccess' );

		// TODO: Translate.
		echo '
		<fieldset class="inline-edit-col-right clear">
			<div class="inline-edit-col">
				<div class="inline-edit-group wp-clearfix">
					<label class="inline-edit-status alignleft">
						<span class="title">Reader Revenue Product</span>
						<select ';
		echo '    name="' . esc_attr( $this->product_field_name ) . '"';
		echo '    id="' . esc_attr( $this->product_field_name ) . '"';
		echo '  >';
		foreach ( $products as $product ) {
			$product = trim( $product );
			echo '<option value="' . esc_attr( $product ) . '">';
			echo esc_html( $product );
			echo '</option>';
		}
		echo '
						</select>
					</label>
				</div>
			</div>
		</fieldset>
		';
	}

	/**
	 * Saves additional metadata when a Post is saved.
	 *
	 * @param string $post_id ID of the post being saved.
	 */
	public function save_post( $post_id ) {
		$product = Forms::receive_field(
			$this->product_field_name,
			$this->nonce_name,
			$this->nonce_action
		);

		// Require product.
		if ( false === $product ) {
			return;
		}

		// Save product.
		update_post_meta(
			$post_id,
			$this->product_field_name,
			$product
		);
	}
}
