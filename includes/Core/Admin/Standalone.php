<?php
/**
 * Class Google\Site_Kit\Core\Admin\Standalone
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Stylesheet;

/**
 * Class managing standlone mode.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Standalone {

	/**
	 * Plugin context.
	 *
	 * @since NEXT
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since NEXT
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {

		$this->context = $context;

		$this->standalone_mode();

	}

	/**
	 * Standalone mode
	 *
	 * @since NEXT
	 */
	public function standalone_mode() {

		if ( ! $this->is_standalone() ) {

			return;

		}

		add_filter( 'admin_body_class', array( $this, 'admin_body_classes' ) );

		remove_action( 'in_admin_header', 'wp_admin_bar_render', 0 );

		add_filter( 'admin_footer_text', '__return_empty_string', PHP_INT_MAX );
		add_filter( 'update_footer', '__return_empty_string', PHP_INT_MAX );

		$styles = new Stylesheet(
			'googlesitekit-standalone-css',
			array(
				'src' => $this->context->url( 'dist/assets/' ) . 'css/standalone.css',
			)
		);

		$styles->register();
		$styles->enqueue();

	}

	/**
	 * Append the standalone admin body class.
	 *
	 * @since NEXT
	 *
	 * @param string $admin_body_classes Admin body classes.
	 *
	 * @return array Filtered array of query arguments.
	 */
	public function admin_body_classes( $admin_body_classes ) {

		return "{$admin_body_classes} googlesitekit-standalone";

	}

	/**
	 * Detect if we are in Google Site Kit standalone mode
	 *
	 * @return boolean True when in standalone mode, else false.
	 */
	public function is_standalone() {

		global $pagenow;

		$page       = filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING );
		$standalone = filter_input( INPUT_GET, 'googlesitekit-standalone', FILTER_VALIDATE_BOOLEAN );

		return ( 'admin.php' === $pagenow && false !== strpos( $page, 'googlesitekit' ) && $standalone );

	}

}
