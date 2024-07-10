<?php
/**
 * Class Google\Site_Kit\Core\Admin\Screen
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Util\Google_Icon;
use Google\Site_Kit\Core\Util\Requires_Javascript_Trait;

/**
 * Class representing a single screen.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Screen {
	use Requires_Javascript_Trait;

	const MENU_SLUG = 'googlesitekit';

	/**
	 * Unique screen slug.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	private $slug;

	/**
	 * Screen arguments.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $args = array();

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Unique screen slug.
	 * @param array  $args {
	 *     Associative array of screen arguments.
	 *
	 *     @type callable $render_callback     Required callback to render the page content.
	 *     @type string   $title               Required screen title.
	 *     @type string   $capability          Capability required to access the screen. Default is 'manage_options'.
	 *     @type string   $menu_title          Title to display in the menu (only if $add_to_menu is true). Default is
	 *                                         the value of $title.
	 *     @type string   $parent_slug         Slug of the parent menu screen (only if $add_to_menu is true). Default
	 *                                         empty string (which means it will be a top-level page).
	 *     @type callable $enqueue_callback    Callback to enqueue additional scripts or stylesheets. The base admin
	 *                                         script and stylesheet will always be enqueued. Default null.
	 *     @type callable $initialize_callback Callback to run actions when initializing the screen, before headers are
	 *                                         sent and markup is generated. Default null.
	 * }
	 */
	public function __construct( $slug, array $args ) {
		$this->slug = $slug;
		$this->args = wp_parse_args(
			$args,
			array(
				'render_callback'     => null,
				'title'               => '',
				'capability'          => 'manage_options',
				'menu_title'          => '',
				'parent_slug'         => self::MENU_SLUG,
				'enqueue_callback'    => null,
				'initialize_callback' => null,
			)
		);

		if ( empty( $this->args['menu_title'] ) ) {
			$this->args['menu_title'] = $this->args['title'];
		}

		$this->args['title'] = __( 'Site Kit by Google', 'google-site-kit' ) . ' ' . $this->args['title'];
	}

	/**
	 * Gets the unique screen slug.
	 *
	 * @since 1.0.0
	 *
	 * @return string Unique screen slug.
	 */
	public function get_slug() {
		return $this->slug;
	}

	/**
	 * Adds the screen to the WordPress admin backend.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context, used for URL generation.
	 * @return string Hook suffix of the screen, or empty string if not added.
	 */
	public function add( Context $context ) {
		static $menu_slug = null;

		if ( ! $this->args['title'] ) {
			return '';
		}

		// A parent slug of null means the screen will not appear in the menu.
		$parent_slug = null;

		// If parent slug is provided, use it as parent.
		if ( ! empty( $this->args['parent_slug'] ) ) {
			$parent_slug = $this->args['parent_slug'];

			// If parent slug is 'googlesitekit', append to main Site Kit menu.
			if ( self::MENU_SLUG === $parent_slug ) {
				// If this is null, it means no menu has been added yet.
				if ( null === $menu_slug ) {
					add_menu_page(
						$this->args['title'],
						__( 'Site Kit', 'google-site-kit' ),
						$this->args['capability'],
						$this->slug,
						'',
						'data:image/svg+xml;base64,' . Google_Icon::to_base64()
					);
					$menu_slug = $this->slug;

					/**
					 * An SVG icon file needs to be colored (filled) based on the theme color setting.
					 *
					 * This exists in js as wp.svgPainter() per:
					 * https://github.com/WordPress/WordPress/blob/5.7/wp-admin/js/svg-painter.js
					 *
					 * The downside of the js approach is that we get a brief flash of an unstyled icon
					 * until the JS runs.
					 *
					 * A user can pick a custom Admin Color Scheme, which is only available in admin_init
					 * or later actions. add_menu_page runs on the admin_menu action, which precedes admin_init
					 * per https://codex.wordpress.org/Plugin_API/Action_Reference
					 *
					 * WordPress provides some color schemes out of the box, but they can also be added via
					 * wp_admin_css_color()
					 *
					 * Our workaround is to set the icon and subsequently replace it in current_screen, which is
					 * what we do in the following action.
					 */
					add_action(
						'current_screen',
						function () {
							global $menu, $_wp_admin_css_colors;

							if ( ! is_array( $menu ) ) {
								return;
							}

							$color_scheme = get_user_option( 'admin_color' ) ?: 'fresh';

							// If we're on one of the sitekit pages, use the 'current' color, otherwise use the 'base' color.
							// @see wp_admin_css_color().
							$color_key = false === strpos( get_current_screen()->id, 'googlesitekit' ) ? 'base' : 'current';

							if ( empty( $_wp_admin_css_colors[ $color_scheme ]->icon_colors[ $color_key ] ) ) {
								return;
							}

							$color = $_wp_admin_css_colors[ $color_scheme ]->icon_colors[ $color_key ];

							foreach ( $menu as &$item ) {
								if ( 'googlesitekit-dashboard' === $item[2] ) {
									$item[6] = 'data:image/svg+xml;base64,' . Google_Icon::to_base64( Google_Icon::with_fill( $color ) );
									break;
								}
							}
						},
						100
					);
				}

				// Set parent slug to actual slug of main Site Kit menu.
				$parent_slug = $menu_slug;
			}
		}

		// If submenu item or not in menu, use add_submenu_page().
		return (string) add_submenu_page(
			$parent_slug,
			$this->args['title'],
			$this->args['menu_title'],
			$this->args['capability'],
			$this->slug,
			function () use ( $context ) {
				$this->render( $context );
			}
		);
	}

	/**
	 * Runs actions when initializing the screen, before sending headers and generating markup.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function initialize( Context $context ) {
		if ( ! $this->args['initialize_callback'] ) {
			return;
		}

		call_user_func( $this->args['initialize_callback'], $context );
	}

	/**
	 * Enqueues assets for the screen.
	 *
	 * @since 1.0.0
	 *
	 * @param Assets $assets Assets instance to rely on for enqueueing assets.
	 */
	public function enqueue_assets( Assets $assets ) {
		// Enqueue base admin screen stylesheet.
		$assets->enqueue_asset( 'googlesitekit-admin-css' );

		$cb = is_callable( $this->args['enqueue_callback'] )
			? $this->args['enqueue_callback']
			: function ( Assets $assets ) {
				$assets->enqueue_asset( $this->slug );
			};

		call_user_func( $cb, $assets );
	}

	/**
	 * Renders the screen content.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context.
	 */
	private function render( Context $context ) {
		$cb = is_callable( $this->args['render_callback'] )
			? $this->args['render_callback']
			: function () {
				printf( '<div id="js-%s" class="googlesitekit-page"></div>', esc_attr( $this->slug ) );
			};

		echo '<div class="googlesitekit-plugin">';
			$this->render_noscript_html();
			call_user_func( $cb, $context );
		echo '</div>';
	}
}
