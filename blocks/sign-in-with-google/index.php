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
use Google\Site_Kit\Modules\Sign_In_With_Google;

/**
 * Sign in with Google Gutenberg Block.
 *
 * @since n.e.x.t
 */
class Sign_In_With_Google_Block {
	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Register this block.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action(
			'init',
			function () {
				register_block_type(
					__DIR__ . '/../../dist/assets/js/blocks/sign-in-with-google/block.json',
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
	 * @since n.e.x.t
	 * @return string Rendered block.
	 */
	public function render_callback() {
		$sign_in_with_google_connected = apply_filters( 'googlesitekit_is_module_connected', false, Sign_In_With_Google::MODULE_SLUG );

		if ( empty( $sign_in_with_google_connected ) ) {
			return '';
		}

		// If the user is already signed in, do not render a Sign in
		// with Google button.
		if ( is_user_logged_in() ) {
			return '';
		}

		return '<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>';
	}
}
