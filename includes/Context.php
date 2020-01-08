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
		$query_args['page'] = Core\Admin\Screens::PREFIX . $slug;

		return add_query_arg( $query_args, self_admin_url( 'admin.php' ) );
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
		$orig_site_url = home_url();
		$site_url      = $orig_site_url;

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
		$site_url = apply_filters( 'googlesitekit_site_url', $site_url );

		// Ensure this is not empty.
		if ( empty( $site_url ) ) {
			$site_url = $orig_site_url;
		}

		return untrailingslashit( $site_url );
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
		$reference_site_url = $this->get_reference_site_url();
		$orig_site_url      = home_url();

		// Gets post object. On front area we need to use get_queried_object to get the current post object.
		if ( ! $post ) {
			if ( is_admin() ) {
				$post = get_post();
			} else {
				$post = get_queried_object();
			}

			if ( ! $post instanceof \WP_Post ) {
				return false;
			}
		}

		$permalink = get_permalink( $post );
		if ( false === $permalink ) {
			return $permalink;
		}

		if ( $orig_site_url !== $reference_site_url ) {
			$permalink = str_replace( $orig_site_url, $reference_site_url, $permalink );
		}

		return $permalink;
	}

	/**
	 * Gets the canonical url for the current request.
	 *
	 * @return string|false The reference canonical URL or false if no URL was identified.
	 */
	public function get_reference_canonical() {
		$reference_permalink = $this->get_reference_permalink();

		if ( $reference_permalink || is_admin() ) {
			return $reference_permalink;
		}

		// Handle the home page URL.
		if ( is_front_page() ) {
			return user_trailingslashit( $this->get_reference_site_url() );
		} elseif ( is_home() ) {
			return $this->get_reference_permalink( get_option( 'page_for_posts' ) );
		}

		// Unidentified URL.
		return false;
	}

	/**
	 * Checks whether AMP content is being served.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if an AMP request, false otherwise.
	 */
	public function is_amp() {
		return function_exists( 'is_amp_endpoint' ) && is_amp_endpoint();
	}

	/**
	 * Gets the current AMP mode.
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
}
