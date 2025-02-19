<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Blocks\Contribute_With_Google
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Blocks;

use Google\Site_Kit\Context;

/**
 * Contribute with Google Gutenberg block.
 *
 * @since n.e.x.t
 */
class Contribute_With_Google {
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
	 * @return string Rendered block.
	 */
	public function render_callback() {
		return '<button swg-standard-button="contribution"></button>';
	}
}
