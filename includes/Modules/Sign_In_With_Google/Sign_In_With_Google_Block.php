<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Sign_In_With_Google_Block
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Block_Support;

/**
 * Sign in with Google Gutenberg Block.
 *
 * @since 1.147.0
 */
class Sign_In_With_Google_Block {
	/**
	 * Context instance.
	 *
	 * @since 1.147.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Constructor.
	 *
	 * @since 1.147.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Checks whether the block can be registered.
	 *
	 * @since 1.147.0
	 *
	 * @return bool
	 */
	public static function can_register() {
		return Block_Support::has_block_support();
	}

	/**
	 * Register this block.
	 *
	 * @since 1.147.0
	 */
	public function register() {
		if ( ! self::can_register() ) {
			return;
		}

		add_action(
			'init',
			function () {
				register_block_type(
					dirname( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . '/dist/assets/blocks/sign-in-with-google/block.json',
					array(
						'render_callback' => array( $this, 'render_callback' ),
					)
				);
			},
			99
		);
	}

	/**
	 * Render callback for the Sign in with Google block.
	 *
	 * @since 1.147.0
	 * @since n.e.x.t Added the `$attributes` parameter.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered block.
	 */
	public function render_callback( $attributes = array() ) {
		// If the user is already signed in, do not render a Sign in
		// with Google button.
		if ( is_user_logged_in() ) {
			return '';
		}

		$attributes = is_array( $attributes ) ? $attributes : array();

		$button_args = array();

		$text_values = wp_list_pluck( Settings::TEXTS, 'value' );
		if ( ! empty( $attributes['text'] ) && in_array( $attributes['text'], $text_values, true ) ) {
			$button_args['text'] = $attributes['text'];
		}

		$theme_values = wp_list_pluck( Settings::THEMES, 'value' );
		if ( ! empty( $attributes['theme'] ) && in_array( $attributes['theme'], $theme_values, true ) ) {
			$button_args['theme'] = $attributes['theme'];
		}

		$shape_values = wp_list_pluck( Settings::SHAPES, 'value' );
		if ( ! empty( $attributes['shape'] ) && in_array( $attributes['shape'], $shape_values, true ) ) {
			$button_args['shape'] = $attributes['shape'];
		}

		if ( ! empty( $attributes['buttonClassName'] ) && is_string( $attributes['buttonClassName'] ) ) {
			$classes = array_filter(
				preg_split( '/\s+/', trim( $attributes['buttonClassName'] ) )
			);

			if ( ! empty( $classes ) ) {
				$button_args['class'] = $classes;
			}
		}

		ob_start();
		/**
		 * Display the Sign in with Google button.
		 *
		 * @since 1.164.0
		 *
		 * @param array $args Optional arguments to customize button attributes.
		 */
		do_action( 'googlesitekit_render_sign_in_with_google_button', $button_args );
		return ob_get_clean();
	}
}
