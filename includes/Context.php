<?php
/**
 * Class Google\Site_Kit\Context
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit;

use AMP_Options_Manager;
use AMP_Theme_Support;
use Google\Site_Kit\Core\Util\Input;
use Google\Site_Kit\Core\Util\Entity;

/**
 * Class representing the context in which the plugin is running.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Context {

	/**
	 * Primary "standard" AMP website mode.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const AMP_MODE_PRIMARY = 'primary';

	/**
	 * Secondary AMP website mode.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const AMP_MODE_SECONDARY = 'secondary';

	/**
	 * Absolute path to the plugin main file.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	private $main_file;

	/**
	 * Internal storage for whether the plugin is network active or not.
	 *
	 * @since 1.0.0
	 * @var bool|null
	 */
	private $network_active = null;

	/**
	 * Input access abstraction.
	 *
	 * @since 1.1.2
	 * @var Input
	 */
	private $input;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 * @since 1.1.2 Added optional $input instance.
	 *
	 * @param string $main_file Absolute path to the plugin main file.
	 * @param Input  $input Input instance.
	 */
	public function __construct( $main_file, Input $input = null ) {
		$this->main_file = $main_file;
		$this->input     = $input ?: new Input();
	}

	/**
	 * Gets the absolute path for a path relative to the plugin directory.
	 *
	 * @since 1.0.0
	 *
	 * @param string $relative_path Optional. Relative path. Default '/'.
	 * @return string Absolute path.
	 */
	public function path( $relative_path = '/' ) {
		return plugin_dir_path( $this->main_file ) . ltrim( $relative_path, '/' );
	}
	/**
	 * Gets the full URL for a path relative to the plugin directory.
	 *
	 * @since 1.0.0
	 *
	 * @param string $relative_path Optional. Relative path. Default '/'.
	 * @return string Full URL.
	 */
	public function url( $relative_path = '/' ) {
		return plugin_dir_url( $this->main_file ) . ltrim( $relative_path, '/' );
	}

	/**
	 * Gets the Input instance.
	 *
	 * @since 1.1.2
	 *
	 * @return Input
	 */
	public function input() {
		return $this->input;
	}

	/**
	 * Gets the full URL to an admin screen part of the plugin.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug       Optional. Plugin admin screen slug. Default 'dashboard'.
	 * @param array  $query_args Optional. Additional query args. Default empty array.
	 * @return string Full admin screen URL.
	 */
	public function admin_url( $slug = 'dashboard', array $query_args = array() ) {
		unset( $query_args['page'] );

		if ( $this->is_network_mode() ) {
			$base_url = network_admin_url( 'admin.php' );
		} else {
			$base_url = admin_url( 'admin.php' );
		}

		return add_query_arg(
			array_merge(
				array( 'page' => Core\Admin\Screens::PREFIX . $slug ),
				$query_args
			),
			$base_url
		);
	}

	/**
	 * Determines whether the plugin is running in network mode.
	 *
	 * Network mode is active under the following conditions:
	 * * Multisite is enabled.
	 * * The plugin is network-active.
	 * * The site's domain matches the network's domain (which means it is a subdirectory site).
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if the plugin is in network mode, false otherwise.
	 */
	public function is_network_mode() {
		// Bail if plugin is not network-active.
		if ( ! $this->is_network_active() ) {
			return false;
		}

		$site    = get_site( get_current_blog_id() );
		$network = get_network( $site->network_id );

		// Use network mode when the site's domain is the same as the network's domain.
		return $network && $site->domain === $network->domain;
	}

	/**
	 * Gets the site URL of the reference site to use for stats.
	 *
	 * @since 1.0.0
	 *
	 * @return string Reference site URL.
	 */
	public function get_reference_site_url() {
		return $this->filter_reference_url();
	}

	/**
	 * Gets the entity for the current request context.
	 *
	 * An entity in Site Kit terminology is based on a canonical URL, i.e. every
	 * canonical URL has an associated entity.
	 *
	 * An entity may also have a type, a title, and an ID.
	 *
	 * @since 1.7.0
	 *
	 * @return Entity|null The current entity, or null if none could be determined.
	 */
	public function get_reference_entity() {
		// If currently in WP admin, run admin-specific checks.
		if ( is_admin() ) {
			$post = get_post();
			if ( $post instanceof \WP_Post ) {
				return $this->create_entity_for_post( $post );
			}
			return null;
		}

		// Otherwise, run frontend-specific checks.
		if ( is_singular() || is_home() && ! is_front_page() ) {
			$post = get_queried_object();
			if ( $post instanceof \WP_Post ) {
				return $this->create_entity_for_post( $post );
			}
			return null;
		}

		// If not singular (see above) but front page, this is the blog archive.
		if ( is_front_page() ) {
			return new Entity(
				user_trailingslashit( $this->get_reference_site_url() ),
				array(
					'type' => 'home',
				)
			);
		}

		// TODO: This is not comprehensive, but will be expanded in the future.
		// Related: https://github.com/google/site-kit-wp/issues/174.
		return null;
	}

	/**
	 * Gets the permalink of the reference site to use for stats.
	 *
	 * @since 1.0.0
	 *
	 * @param int|\WP_Post $post  Optional. Post ID or post object. Default is the global `$post`.
	 *
	 * @return string|false The reference permalink URL or false if post does not exist.
	 */
	public function get_reference_permalink( $post = 0 ) {
		// If post is provided, get URL for that.
		if ( $post ) {
			$permalink = get_permalink( $post );
			if ( false === $permalink ) {
				return false;
			}
			return $this->filter_reference_url( $permalink );
		}

		// Otherwise use entity detection.
		$entity = $this->get_reference_entity();
		if ( ! $entity || 'post' !== $entity->get_type() ) {
			return false;
		}

		return $entity->get_url();
	}

	/**
	 * Gets the canonical url for the current request.
	 *
	 * @since 1.0.0
	 *
	 * @return string|false The reference canonical URL or false if no URL was identified.
	 */
	public function get_reference_canonical() {
		$entity = $this->get_reference_entity();
		if ( ! $entity ) {
			return false;
		}

		return $entity->get_url();
	}

	/**
	 * Checks whether AMP content is being served.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if an AMP request, false otherwise.
	 */
	public function is_amp() {
		if ( is_singular( 'web-story' ) ) {
			return true;
		}

		return function_exists( 'is_amp_endpoint' ) && is_amp_endpoint();
	}

	/**
	 * Gets the current AMP mode.
	 *
	 * @since 1.0.0
	 *
	 * @return bool|string 'primary' if in standard mode,
	 *                     'secondary' if in transitional or reader modes
	 *                     false if AMP not active, or unknown mode
	 */
	public function get_amp_mode() {
		if ( ! class_exists( 'AMP_Theme_Support' ) ) {
			return false;
		}

		$exposes_support_mode = method_exists( 'AMP_Theme_Support', 'get_support_mode' )
			&& defined( 'AMP_Theme_Support::STANDARD_MODE_SLUG' )
			&& defined( 'AMP_Theme_Support::TRANSITIONAL_MODE_SLUG' )
			&& defined( 'AMP_Theme_Support::READER_MODE_SLUG' );

		if ( $exposes_support_mode ) {
			// If recent version, we can properly detect the mode.
			$mode = AMP_Theme_Support::get_support_mode();

			if ( AMP_Theme_Support::STANDARD_MODE_SLUG === $mode ) {
				return self::AMP_MODE_PRIMARY;
			}

			if ( in_array( $mode, array( AMP_Theme_Support::TRANSITIONAL_MODE_SLUG, AMP_Theme_Support::READER_MODE_SLUG ), true ) ) {
				return self::AMP_MODE_SECONDARY;
			}
		} elseif ( function_exists( 'amp_is_canonical' ) ) {
			// On older versions, if it is not primary AMP, it is definitely secondary AMP (transitional or reader mode).
			if ( amp_is_canonical() ) {
				return self::AMP_MODE_PRIMARY;
			}

			return self::AMP_MODE_SECONDARY;
		}

		return false;
	}

	/**
	 * Checks whether the plugin is network active.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if plugin is network active, false otherwise.
	 */
	public function is_network_active() {
		// Determine $network_active property just once per request, to not unnecessarily run this complex logic on every call.
		if ( null === $this->network_active ) {
			if ( is_multisite() ) {
				$network_active_plugins = wp_get_active_network_plugins();

				// Consider MU plugins and network-activated plugins as network-active.
				$this->network_active = strpos( wp_normalize_path( __FILE__ ), wp_normalize_path( WPMU_PLUGIN_DIR ) ) === 0
					|| in_array( WP_PLUGIN_DIR . '/' . GOOGLESITEKIT_PLUGIN_BASENAME, $network_active_plugins, true );
			} else {
				$this->network_active = false;
			}
		}

		return $this->network_active;
	}

	/**
	 * Creates the entity for a given post object.
	 *
	 * @since 1.7.0
	 *
	 * @param \WP_Post $post A WordPress post object.
	 * @return Entity The entity for the post.
	 */
	private function create_entity_for_post( \WP_Post $post ) {
		$type = 'post';

		// If this post is assigned as the home page, it is actually the blog archive.
		if ( (int) get_option( 'page_for_posts' ) === (int) $post->ID ) {
			$type = 'home';
		}

		return new Entity(
			$this->filter_reference_url( get_permalink( $post ) ),
			array(
				'type'  => $type,
				'title' => $post->post_title,
				'id'    => $post->ID,
			)
		);
	}

	/**
	 * Filters the given URL to ensure the reference URL is used as part of it.
	 *
	 * If the site reference URL differs from the home URL (e.g. via filters),
	 * this method performs the necessary replacement.
	 *
	 * @since 1.7.0
	 *
	 * @param string $url Optional. Input URL. If not provided, returns the plain reference site URL.
	 * @return string URL that starts with the reference site URL.
	 */
	private function filter_reference_url( $url = '' ) {
		$site_url = untrailingslashit( home_url() );

		/**
		 * Filters the reference site URL to use for stats.
		 *
		 * This can be used to override the current site URL, for example when using the plugin on a non-public site,
		 * such as in a staging environment.
		 *
		 * @since 1.0.0
		 *
		 * @param string $site_url Reference site URL, typically the WordPress home URL.
		 */
		$reference_site_url = apply_filters( 'googlesitekit_site_url', $site_url );
		$reference_site_url = untrailingslashit( $reference_site_url );

		// Ensure this is not empty.
		if ( empty( $reference_site_url ) ) {
			$reference_site_url = $site_url;
		}

		// If no URL given, just return the reference site URL.
		if ( empty( $url ) ) {
			return $reference_site_url;
		}

		// Replace site URL with the reference site URL.
		if ( $reference_site_url !== $site_url ) {
			$url = str_replace( $site_url, $reference_site_url, $url );
		}

		return $url;
	}
}
