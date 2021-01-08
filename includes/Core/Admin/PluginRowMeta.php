<?php
/**
 * Class Google\Site_Kit\Core\Admin\PluginRowMeta
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
 * Class managing Plugin Row Meta
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class PluginRowMeta {

	/**
	 * Add Plugin Row Meta
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'plugin_row_meta',
			function ( $meta, $plugin_file ) {
				if ( GOOGLESITEKIT_PLUGIN_BASENAME === $plugin_file ) {
					return array_merge( $meta, $this->get_plugin_row_meta() );
				}
				return $meta;
			},
			10,
			2
		);
	}

	/**
	 * Builds an array of anchor elements to be shown in the plugin row
	 *
	 * @since n.e.x.t
	 *
	 * @return array of HTML as string
	 */
	private function get_plugin_row_meta() {
		return array(
			'<a href="https://wordpress.org/support/plugin/google-site-kit/reviews/#new-post">' . __( 'Rate Site Kit', 'google-site-kit' ) . '</a>',
			'<a href="https://wordpress.org/support/plugin/google-site-kit/#new-post">' . __( 'Support', 'google-site-kit' ) . '</a>',
		);
	}

}
