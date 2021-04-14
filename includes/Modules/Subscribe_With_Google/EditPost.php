<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google\EditPost
 *
 * @package   Google\Site_Kit\Modules\Subscribe_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Subscribe_With_Google;

/** Supports editing of posts. */
final class EditPost {

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
	 * Settings for SwG.
	 *
	 * @var object
	 */
	private $settings;

	/**
	 * Adds action handlers.
	 *
	 * @param object $settings Settings for SwG.
	 */
	public function __construct( $settings ) {
		$this->product_field_name = Key::from( 'product' );
		$this->nonce_name         = Key::from( 'edit_post_nonce' );
		$this->nonce_action       = Key::from( 'saving_post' );
		$this->settings           = $settings;

		// Render meta box on Post Edit page.
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );

		// Handle Posts being saved.
		add_action( 'save_post', array( $this, 'save_post' ) );
	}

	/** Adds meta boxes to the Post edit page. */
	public function add_meta_boxes() {
		add_meta_box(
			Key::from( 'post-edit-metabox' ),
			'Subscribe with Google',
			array( $this, 'render' ),
			'post',
			'side',
			'high'
		);
	}

	/** Renders meta box. */
	public function render() {
		$this->render_products_dropdown();

		wp_nonce_field( $this->nonce_action, $this->nonce_name );
	}

	/** Renders products dropdown. */
	public function render_products_dropdown() {
		$products_str = trim( $this->settings['products'] );
		$products     = explode( "\n", $products_str );
		array_unshift( $products, 'openaccess' );

		$selected_product = get_post_meta( get_the_ID(), $this->product_field_name, true );

		// TODO: Translate.
		echo 'Product&nbsp; ';
		echo '<select';
		echo ' name="' . esc_attr( $this->product_field_name ) . '"';
		echo ' id="' . esc_attr( $this->product_field_name ) . '"';
		echo '>';
		foreach ( $products as $product ) {
			$product = trim( $product );
			echo '<option';
			echo ' value="' . esc_attr( $product ) . '"';
			if ( $selected_product === $product ) {
				echo ' selected';
			}
			echo '>';
			echo esc_html( $product );
			echo '</option>';
		}
		echo '</select>';
		echo '<br />';
		echo '<br />';
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
