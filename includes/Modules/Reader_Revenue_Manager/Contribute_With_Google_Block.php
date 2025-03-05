<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Contribute_With_Google_Block
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Guard;

/**
 * Contribute with Google Gutenberg block.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Contribute_With_Google_Block {
	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Context
	 */
	protected $context;

	/**
	 * Tag_Guard instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Tag_Guard
	 */
	private $tag_guard;

	/**
	 * Settings instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Module_Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context         $context   Plugin context.
	 * @param Tag_Guard       $tag_guard Tag_Guard instance.
	 * @param Module_Settings $settings Module_Settings instance.
	 */
	public function __construct( Context $context, Tag_Guard $tag_guard, Module_Settings $settings ) {
		$this->context   = $context;
		$this->tag_guard = $tag_guard;
		$this->settings  = $settings;
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
					dirname( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . '/dist/assets/js/blocks/reader-revenue-manager/contribute-with-google/block.json',
					array(
						'render_callback' => array( $this, 'render_callback' ),
					)
				);
			},
			99
		);
	}

	/**
	 * Render callback for the block.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Rendered block.
	 */
	public function render_callback() {
		// If the payment option is not `contributions` or the tag is not placed, do not render the block.
		$settings = $this->settings->get();

		$is_contributions_payment_option = isset( $settings['paymentOption'] ) && 'contributions' === $settings['paymentOption'];

		if ( ! ( $is_contributions_payment_option && $this->tag_guard->can_activate() ) ) {
			return '';
		}

		// Ensure the button is centered to match the editor preview.
		// TODO: Add a stylesheet to the page and style the button container using a class.
		return '<div style="margin: 0 auto;"><button swg-standard-button="contribution"></button></div>';
	}
}
