<?php
/**
 * Class Google\Site_Kit\Core\Admin\Standalone
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Stylesheet;

/**
 * Class managing standalone mode.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Standalone {

	/**
	 * Standalone mode
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		if ( ! $this->is_standalone() ) {
			return;
		}

		/**
		 * Appends the standalone admin body class.
		 *
		 * @since n.e.x.t
		 *
		 * @param string $admin_body_classes Admin body classes.
		 *
		 * @return string Filtered admin body classes.
		 */
		add_filter(
			'admin_body_class',
			function( $admin_body_classes ) {
				return "{$admin_body_classes} googlesitekit-standalone";
			}
		);

		remove_action( 'in_admin_header', 'wp_admin_bar_render', 0 );

		add_filter( 'admin_footer_text', '__return_empty_string', PHP_INT_MAX );
		add_filter( 'update_footer', '__return_empty_string', PHP_INT_MAX );

		add_action( 'admin_head', array( $this, 'standalone_styles' ) );
	}

	/**
	 * Detects if we are in Google Site Kit standalone mode.
	 *
	 * @since n.e.x.t
	 *
	 * @return boolean True when in standalone mode, else false.
	 */
	public function is_standalone() {
		global $pagenow;

		$page       = filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING );
		$standalone = filter_input( INPUT_GET, 'googlesitekit-standalone', FILTER_VALIDATE_BOOLEAN );

		return ( 'admin.php' === $pagenow && false !== strpos( $page, 'googlesitekit' ) && $standalone );
	}

	/**
	 * Enqueues styles for standalone mode.
	 *
	 * @since n.e.x.t
	 *
	 * @return void
	 */
	public function standalone_styles() {
		?>
		<style type="text/css">
		html {
			padding-top: 0 !important;
		}

		body.site-kit_page_googlesitekit-splash.googlesitekit-standalone #adminmenumain {
			display: none;
		}

		body.site-kit_page_googlesitekit-splash.googlesitekit-standalone #wpcontent {
			margin-left: 0;
		}
		</style>
		<?php
	}
}
