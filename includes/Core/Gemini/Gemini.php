<?php
/**
 * Class Google\Site_Kit\Core\Gemini\Gemini
 *
 * @package   Google\Site_Kit\Core\Gemini
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Gemini;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for handling Consent Mode.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Gemini {
	use Method_Proxy_Trait;

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * Gemini_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Gemini_Settings
	 */
	protected $gemini_settings;

	/**
	 * REST_Gemini_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_Gemini_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, Options $options = null ) {
		$this->context         = $context;
		$options               = $options ?: new Options( $context );
		$this->gemini_settings = new Gemini_Settings( $options );
		$this->rest_controller = new REST_Gemini_Controller( $this->gemini_settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->gemini_settings->register();
		$this->rest_controller->register();

		add_action( 'init', array( $this, 'gemini_block_init' ) );
	}

	/**
	 * Initializes the block for displaying memorable quotes.
	 *
	 * @since n.e.x.t
	 * @return void
	 */
	public function gemini_block_init() {
		register_block_type(
			__DIR__ . '/../../../blocks/build/memorable-quotes',
			array(
				'render_callback' => array( $this, 'gemini_memorable_quotes_block_dynamic_render_callback' ),
			)
		);
	}

	/**
	 * Render callback for the Memorable Quotes block.
	 *
	 * @since n.e.x.t
	 * @return string Rendered block.
	 */
	public function gemini_memorable_quotes_block_dynamic_render_callback() {
		$settings         = $this->gemini_settings->get();
		$memorable_quotes = $settings['memorableQuotes'];

		$published_memorable_quotes = array_filter(
			$memorable_quotes,
			function ( $quote ) {
				return $quote['published'];
			}
		);

		if ( empty( $published_memorable_quotes ) ) {
			return '';
		}

		$output = '<div ' . get_block_wrapper_attributes() . '>';
		foreach ( $published_memorable_quotes as $key => $quote ) {
			$output .= '<div>';
			$output .= sprintf(
				'<a class="google-site-kit-memorable-quote" href="%1$s">&quot;%2$s&quot;</a> %3$s',
				esc_url( get_permalink( $quote['postID'] ) ),
				esc_html( $quote['quote'] ),
				esc_html( ! empty( $quote['author'] ) ? ' - ' . $quote['author'] : '' ),
			);
			$output .= '</div>';

		}
		$output .= '</div>';

		return $output;
	}
}
