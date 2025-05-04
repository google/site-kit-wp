<?php
/**
 * Class Google\Site_Kit\Core\Admin_Bar\Admin_Bar
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin_Bar;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\Requires_Javascript_Trait;
use WP_REST_Server;
use WP_REST_Request;

/**
 * Class handling the plugin's admin bar menu.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Admin_Bar {

	use Requires_Javascript_Trait;
	use Method_Proxy_Trait;

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Assets Instance.
	 *
	 * @since 1.0.0
	 * @var Assets
	 */
	private $assets;

	/**
	 * Modules instance.
	 *
	 * @since 1.4.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * Admin_Bar_Enabled instance.
	 *
	 * @since 1.39.0
	 * @var Admin_Bar_Enabled
	 */
	private $admin_bar_enabled;

	/**
	 * Authentication instance.
	 *
	 * @since 1.120.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context.
	 * @param Assets  $assets  Optional. Assets API instance. Default is a new instance.
	 * @param Modules $modules Optional. Modules instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Assets $assets = null,
		Modules $modules = null
	) {
		$this->context = $context;
		$this->assets  = $assets ?: new Assets( $this->context );
		$this->modules = $modules ?: new Modules( $this->context );

		$options                 = new Options( $this->context );
		$this->admin_bar_enabled = new Admin_Bar_Enabled( $options );
		$this->authentication    = new Authentication( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_action( 'admin_bar_menu', $this->get_method_proxy( 'add_menu_button' ), 99 );
		add_action( 'admin_enqueue_scripts', $this->get_method_proxy( 'enqueue_assets' ), 40 );
		add_action( 'wp_enqueue_scripts', $this->get_method_proxy( 'enqueue_assets' ), 40 );

		// TODO: This can be removed at some point, see https://github.com/ampproject/amp-wp/pull/4001.
		add_filter( 'amp_dev_mode_element_xpaths', array( $this, 'add_amp_dev_mode' ) );
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $routes ) {
				return array_merge(
					$routes,
					array(
						'/' . REST_Routes::REST_ROOT . '/core/site/data/admin-bar-settings',
					)
				);
			}
		);

		$this->admin_bar_enabled->register();
	}

	/**
	 * Add data-ampdevmode attributes to the elements that need it.
	 *
	 * @see \Google\Site_Kit\Core\Assets\Assets::get_assets() The 'googlesitekit' string is added to all inline scripts.
	 * @see \Google\Site_Kit\Core\Assets\Assets::add_amp_dev_mode_attributes() The data-ampdevmode attribute is added to registered scripts/styles here.
	 *
	 * @param string[] $xpath_queries XPath queries for elements that should get the data-ampdevmode attribute.
	 * @return string[] XPath queries.
	 */
	public function add_amp_dev_mode( $xpath_queries ) {
		$xpath_queries[] = '//script[ contains( text(), "googlesitekit" ) ]';
		return $xpath_queries;
	}

	/**
	 * Render the Adminbar button.
	 *
	 * @since 1.0.0
	 *
	 * @param object $wp_admin_bar The WP AdminBar object.
	 */
	private function add_menu_button( $wp_admin_bar ) {
		if ( ! $this->is_active() ) {
			return;
		}

		$args = array(
			'id'    => 'google-site-kit',
			'title' => '<span class="googlesitekit-wp-adminbar__icon"></span> <span class="googlesitekit-wp-adminbar__label">Site Kit</span>',
			'href'  => '#',
			'meta'  => array(
				'class' => 'menupop googlesitekit-wp-adminbar',
			),
		);

		if ( $this->context->is_amp() && ! $this->is_amp_dev_mode() ) {
			$post = get_post();
			if ( ! $post || ! current_user_can( 'edit_post', $post->ID ) ) {
				return;
			}
			$args['href'] = add_query_arg( 'googlesitekit_adminbar_open', 'true', get_edit_post_link( $post->ID ) );
		} else {
			$args['meta']['html'] = $this->menu_markup();
		}

		$wp_admin_bar->add_node( $args );
	}

	/**
	 * Checks if admin bar menu is active and displaying.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if Admin bar should display, False when it's not.
	 */
	public function is_active() {
		// Only active if the admin bar is showing.
		if ( ! is_admin_bar_showing() ) {
			return false;
		}

		// In the admin, never show the admin bar except for the post editing screen.
		if ( is_admin() && ! $this->is_admin_post_screen() ) {
			return false;
		}

		if ( ! current_user_can( Permissions::VIEW_ADMIN_BAR_MENU ) ) {
			return false;
		}

		$enabled = $this->admin_bar_enabled->get();
		if ( ! $enabled ) {
			return false;
		}

		// No entity was identified - don't display the admin bar menu.
		$entity = $this->context->get_reference_entity();
		if ( ! $entity ) {
			return false;
		}

		// Check permissions for viewing post data.
		if ( in_array( $entity->get_type(), array( 'post', 'blog' ), true ) && $entity->get_id() ) {
			// If a post entity, check permissions for that post.
			if ( ! current_user_can( Permissions::VIEW_POST_INSIGHTS, $entity->get_id() ) ) {
				return false;
			}
		}

		$current_url = $entity->get_url();

		/**
		 * Filters whether the Site Kit admin bar menu should be displayed.
		 *
		 * The admin bar menu is only shown when there is data for the current URL and the current
		 * user has the correct capability to view the data. Modules use this filter to indicate the
		 * presence of valid data.
		 *
		 * @since 1.0.0
		 *
		 * @param bool   $display     Whether to display the admin bar menu.
		 * @param string $current_url The URL of the current request.
		 */
		return apply_filters( 'googlesitekit_show_admin_bar_menu', true, $current_url );
	}

	/**
	 * Checks if current screen is an admin edit post screen.
	 *
	 * @since 1.0.0
	 */
	private function is_admin_post_screen() {
		$current_screen = function_exists( 'get_current_screen' ) ? get_current_screen() : false;

		// No screen context available.
		if ( ! $current_screen instanceof \WP_Screen ) {
			return false;
		}

		// Only show for post screens.
		if ( 'post' !== $current_screen->base ) {
			return false;
		}

		// Don't show for new post screen.
		if ( 'add' === $current_screen->action ) {
			return false;
		}

		return true;
	}

	/**
	 * Checks whether AMP dev mode is enabled.
	 *
	 * This is only relevant if the current context is AMP.
	 *
	 * @since 1.1.0
	 * @since 1.120.0 Added the `data-view-only` attribute.
	 *
	 * @return bool True if AMP dev mode is enabled, false otherwise.
	 */
	private function is_amp_dev_mode() {
		return function_exists( 'amp_is_dev_mode' ) && amp_is_dev_mode();
	}

	/**
	 * Return the Adminbar content markup.
	 *
	 * @since 1.0.0
	 */
	private function menu_markup() {
		// Start buffer output.
		ob_start();

		$is_view_only = ! $this->authentication->is_authenticated();

		?>
		<div class="googlesitekit-plugin ab-sub-wrapper">
			<?php $this->render_noscript_html(); ?>

			<div id="js-googlesitekit-adminbar" data-view-only="<?php echo esc_attr( $is_view_only ); ?>" class="googlesitekit-adminbar">

				<?php
				/**
				 * Display server rendered content before JS-based adminbar modules.
				 *
				 * @since 1.0.0
				 */
				do_action( 'googlesitekit_adminbar_modules_before' );
				?>

				<section id="js-googlesitekit-adminbar-modules" class="googlesitekit-adminbar-modules"></section>

				<?php
				/**
				 * Display server rendered content after JS-based adminbar modules.
				 *
				 * @since 1.0.0
				 */
				do_action( 'googlesitekit_adminbar_modules_after' );
				?>
			</div>
		</div>
		<?php

		// Get the buffer output.
		$markup = ob_get_clean();

		return $markup;
	}

	/**
	 * Enqueues assets.
	 *
	 * @since 1.39.0
	 */
	private function enqueue_assets() {
		if ( ! $this->is_active() ) {
			return;
		}

		// Enqueue styles.
		$this->assets->enqueue_asset( 'googlesitekit-adminbar-css' );

		if ( $this->context->is_amp() && ! $this->is_amp_dev_mode() ) {
			// AMP Dev Mode support was added in v1.4, and if it is not enabled then short-circuit since scripts will be invalid.
			return;
		}

		// Enqueue scripts.
		$this->assets->enqueue_asset( 'googlesitekit-adminbar' );
		$this->modules->enqueue_assets();
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since 1.39.0
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_authenticate = function () {
			return current_user_can( Permissions::AUTHENTICATE );
		};

		$settings_callback = function () {
			return array(
				'enabled' => $this->admin_bar_enabled->get(),
			);
		};

		return array(
			new REST_Route(
				'core/site/data/admin-bar-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => $settings_callback,
						'permission_callback' => $can_authenticate,
					),
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => function ( WP_REST_Request $request ) use ( $settings_callback ) {
							$data    = $request->get_param( 'data' );

							if ( isset( $data['enabled'] ) ) {
								$this->admin_bar_enabled->set( ! empty( $data['enabled'] ) );
							}

							return $settings_callback( $request );
						},
						'permission_callback' => $can_authenticate,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'enabled' => array(
										'type'     => 'boolean',
										'required' => false,
									),
								),
							),
						),
					),
				)
			),
		);
	}
}
