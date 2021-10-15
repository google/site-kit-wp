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

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Post_Meta;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Subscribe_With_Google\Post_Access;
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
	 * Post_Access instance.
	 *
	 * @since n.e.x.t
	 * @var Post_Access
	 */
	private $post_access_setting;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Optional. Option API instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param Assets         $assets         Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Authentication $authentication = null,
		Assets $assets = null
	) {
		parent::__construct( $context, $options, $user_options, $authentication, $assets );

		$post_meta                 = new Post_Meta();
		$this->post_access_setting = new Post_Access( $post_meta );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.41.0
	 */
	public function register() {
		if ( ! $this->is_connected() ) {
			return;
		}

		$this->post_access_setting->register();

		// Add "Set access to..." bulk edit option.
		add_filter(
			'bulk_actions-edit-post',
			function( $bulk_actions ) {
				$bulk_actions['googlesitekit-swg-access'] = __( 'Set access to&hellip;', 'google-site-kit' );
				return $bulk_actions;
			}
		);

		// Update posts.
		add_filter(
			'handle_bulk_actions-edit-post',
			function ( $redirect_to, $action, $post_ids ) {
				if ( 'googlesitekit-swg-access' !== $action ) {
					return $redirect_to;
				}

				$input  = $this->context->input();
				$access = $input->filter( INPUT_GET, 'googlesitekit-swg-access-selector', FILTER_SANITIZE_STRING );
				if ( ! $access ) {
					return $redirect_to;
				}

				// Update access for selected posts.
				foreach ( $post_ids as $post_id ) {
					$this->post_access_setting->set( $post_id, $access );
				}
				return $redirect_to;
			},
			10,
			3
		);

		// Add column.
		add_filter(
			'manage_post_posts_columns',
			function( $columns ) {
				return array_merge( $columns, array( Post_Access::META_KEY => __( 'Access', 'google-site-kit' ) ) );
			}
		);

		// Render column.
		add_action(
			'manage_post_posts_custom_column',
			function( $column_key, $post_id ) {
				if ( Post_Access::META_KEY === $column_key ) {
					$access = $this->post_access_setting->get( $post_id );
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
						'googlesitekit-datastore-forms',
						'googlesitekit-datastore-location',
						'googlesitekit-datastore-user',
						'googlesitekit-modules-subscribe-with-google',
					),
					'load_contexts' => array( Asset::CONTEXT_ADMIN_POSTS ),
				)
			),
		);
	}

}
