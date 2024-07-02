<?php
/**
 * Class Google\Site_Kit\Core\Admin\Plugin_Row_Meta
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

/**
 * Class for managing plugin row meta.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
class Plugin_Row_Meta {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.24.0
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
	 * Builds an array of anchor elements to be shown in the plugin row.
	 *
	 * @since 1.24.0
	 *
	 * @return string[] Array of links as HTML strings.
	 */
	private function get_plugin_row_meta() {
		return array(
			'<a href="https://wordpress.org/support/plugin/google-site-kit/reviews/#new-post">' . __( 'Rate Site Kit', 'google-site-kit' ) . '</a>',
			'<a href="https://wordpress.org/support/plugin/google-site-kit/#new-post">' . __( 'Support', 'google-site-kit' ) . '</a>',
		);
	}
}
