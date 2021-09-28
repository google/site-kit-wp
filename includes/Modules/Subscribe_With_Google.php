<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Subscribe_With_Google\Settings;

/**
 * Class representing the Subscribe with Google module.
 *
 * @since 1.41.0
 * @access private
 * @ignore
 */
final class Subscribe_With_Google extends Module
	implements Module_With_Assets, Module_With_Owner, Module_With_Settings {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.41.0
	 */
	public function register() {
		if ( ! $this->is_connected() ) {
			return;
		}

		// Register "access" meta field.
		register_post_meta(
			'',
			'sitekit__reader_revenue__access',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
			)
		);

		// Add "Set access to..." bulk edit option.
		add_filter(
			'bulk_actions-edit-post',
			function( $bulk_actions ) {
				$bulk_actions['sitekit-swg-access'] = __( 'Set access to...', 'google-site-kit' );
				return $bulk_actions;
			}
		);

		add_filter(
			'handle_bulk_actions-edit-post',
			function ( $redirect_to, $action, $post_ids ) {
				if ( 'sitekit-swg-access' !== $action ) {
					return $redirect_to;
				}

				// TODO: Add a nonce?
				// phpcs:ignore WordPress.Security.NonceVerification, WordPress.VIP.SuperGlobalInputUsage
				if ( isset( $_GET['sitekit-swg-access-selector'] ) ) {
					// phpcs:ignore WordPress.Security.NonceVerification, WordPress.VIP.SuperGlobalInputUsage
					$access = sanitize_text_field( wp_unslash( $_GET['sitekit-swg-access-selector'] ) );
					foreach ( $post_ids as $post_id ) {
						update_post_meta( $post_id, 'sitekit__reader_revenue__access', $access );
					}
				}

				return $redirect_to;
			},
			10,
			3
		);

		add_filter(
			'manage_post_posts_columns',
			function( $columns ) {
				return array_merge( $columns, array( 'sitekit__reader_revenue__access' => __( 'Access', 'google-site-kit' ) ) );
			}
		);

		add_action(
			'manage_post_posts_custom_column',
			function( $column_key, $post_id ) {
				if ( 'sitekit__reader_revenue__access' === $column_key ) {
					$access = get_post_meta( $post_id, 'sitekit__reader_revenue__access', true );
					if ( $access && 'openaccess' !== $access ) {
						echo esc_html( $access );
					} else {
						esc_html_e( '— Free —', 'google-site-kit' );
					}
				}
			},
			10,
			2
		);
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.41.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$settings = $this->get_settings()->get();

		if ( ! $settings ) {
			return false;
		}

		if ( ! $settings['products'] ) {
			return false;
		}

		if ( ! $settings['publicationID'] ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.41.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.41.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => 'subscribe-with-google',
			'name'        => _x( 'Subscribe with Google', 'Service name', 'google-site-kit' ),
			'description' => __( 'Generate revenue through your content by adding subscriptions or contributions to your publication', 'google-site-kit' ),
			'order'       => 7,
			'homepage'    => __( 'https://publishercenter.google.com/', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.41.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.41.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-subscribe-with-google',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-subscribe-with-google.js',
					'dependencies' => array(
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-datastore-site',
						'googlesitekit-modules',
						'googlesitekit-vendor',
					),
				)
			),
			new Script(
				'googlesitekit-subscribe-with-google-bulk-edit',
				array(
					'src'           => $base_url . 'js/googlesitekit-subscribe-with-google-bulk-edit.js',
					'dependencies'  => array(
						'googlesitekit-modules-subscribe-with-google',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-datastore-site',
						'googlesitekit-modules',
						'googlesitekit-vendor',
					),
					'load_contexts' => array( Asset::CONTEXT_ADMIN_POSTS ),
				)
			),
		);
	}

}
