<?php
/**
 * Class Google\Site_Kit\Context
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit;

use AMP_Options_Manager;
use AMP_Theme_Support;
use Google\Site_Kit\Core\Util\Input;
use Google\Site_Kit\Core\Util\Entity;
use Google\Site_Kit\Core\Util\Entity_Factory;

/**
 * Class representing the context in which the plugin is running.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
class Context {

	/**
	 * Primary "standard" AMP website mode.
	 *
	 * This mode is currently unused due to Tag Manager setup not showing the Web Container dropdown
	 * when AMP is in standard mode and some urls have AMP disabled.
	 *
	 * @since 1.0.0 Originally introduced.
	 * @since 1.36.0 Marked as unused, see description.
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
	 * @since 1.0.0
	 *
	 * @return bool True if the plugin is in network mode, false otherwise.
	 */
	public function is_network_mode() {
		// Bail if plugin is not network-active.
		if ( ! $this->is_network_active() ) {
			return false;
		}

		/**
		 * Filters whether network mode is active in Site Kit.
		 *
		 * This is always false by default since Site Kit does not support a network mode yet.
		 *
		 * @since 1.86.0
		 *
		 * @param bool $active Whether network mode is active.
		 */
		return (bool) apply_filters( 'googlesitekit_is_network_mode', false );
	}

	/**
	 * Gets the cannonical "home" URL.
	 *
	 * Returns the value from the `"googlesitekit_canonical_home_url"` filter.
	 *
	 * @since 1.18.0
	 *
	 * @return string Cannonical home URL.
	 */
	public function get_canonical_home_url() {
		/**
		 * Filters the canonical home URL considered by Site Kit.
		 *
		 * Typically this is okay to be the unmodified `home_url()`, but certain plugins (e.g. multilingual plugins)
		 * that dynamically modify that value based on context can use this filter to ensure that the URL considered
		 * by Site Kit remains stable.
		 *
		 * @since 1.18.0
		 *
		 * @param string $home_url The value of `home_url()`.
		 */
		return apply_filters( 'googlesitekit_canonical_home_url', home_url() );
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
		// Support specific URL stats being checked in Site Kit dashboard details view.
		if ( is_admin() && 'googlesitekit-dashboard' === $this->input()->filter( INPUT_GET, 'page' ) ) {
			$entity_url_query_param = $this->input()->filter( INPUT_GET, 'permaLink' );
			if ( ! empty( $entity_url_query_param ) ) {
				return $this->get_reference_entity_from_url( $entity_url_query_param );
			}
		}

		$entity = Entity_Factory::from_context();
		return $this->filter_entity_reference_url( $entity );
	}

	/**
	 * Gets the entity for the given URL, if available.
	 *
	 * An entity in Site Kit terminology is based on a canonical URL, i.e. every
	 * canonical URL has an associated entity.
	 *
	 * An entity may also have a type, a title, and an ID.
	 *
	 * @since 1.10.0
	 *
	 * @param string $url URL to determine the entity from.
	 * @return Entity|null The current entity, or null if none could be determined.
	 */
	public function get_reference_entity_from_url( $url ) {
		// Ensure local URL is used for lookup.
		$url = str_replace(
			$this->get_reference_site_url(),
			untrailingslashit( $this->get_canonical_home_url() ),
			$url
		);

		$entity = Entity_Factory::from_url( $url );
		return $this->filter_entity_reference_url( $entity );
	}

	/**
	 * Gets the permalink of the reference site to use for stats.
	 *
	 * @since 1.0.0
	 *
	 * @param int|WP_Post $post Optional. Post ID or post object. Default is the global `$post`.
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
		// If the Web Stories plugin is enabled, consider the site to be running
		// in Secondary AMP mode.
		if ( defined( 'WEBSTORIES_VERSION' ) ) {
			return self::AMP_MODE_SECONDARY;
		}

		if ( ! class_exists( 'AMP_Theme_Support' ) ) {
			return false;
		}

		$exposes_support_mode = defined( 'AMP_Theme_Support::STANDARD_MODE_SLUG' )
			&& defined( 'AMP_Theme_Support::TRANSITIONAL_MODE_SLUG' )
			&& defined( 'AMP_Theme_Support::READER_MODE_SLUG' );

		if ( defined( 'AMP__VERSION' ) ) {
			$amp_plugin_version = AMP__VERSION;
			if ( strpos( $amp_plugin_version, '-' ) !== false ) {
				$amp_plugin_version = explode( '-', $amp_plugin_version )[0];
			}

			$amp_plugin_version_2_or_higher = version_compare( $amp_plugin_version, '2.0.0', '>=' );
		} else {
			$amp_plugin_version_2_or_higher = false;
		}

		if ( $amp_plugin_version_2_or_higher ) {
			$exposes_support_mode = class_exists( 'AMP_Options_Manager' )
				&& method_exists( 'AMP_Options_Manager', 'get_option' )
				&& $exposes_support_mode;
		} else {
			$exposes_support_mode = class_exists( 'AMP_Theme_Support' )
				&& method_exists( 'AMP_Theme_Support', 'get_support_mode' )
				&& $exposes_support_mode;
		}

		if ( $exposes_support_mode ) {
			// If recent version, we can properly detect the mode.
			if ( $amp_plugin_version_2_or_higher ) {
				$mode = AMP_Options_Manager::get_option( 'theme_support' );
			} else {
				$mode = AMP_Theme_Support::get_support_mode();
			}

			if (
				in_array(
					$mode,
					array(
						AMP_Theme_Support::STANDARD_MODE_SLUG,
						AMP_Theme_Support::TRANSITIONAL_MODE_SLUG,
						AMP_Theme_Support::READER_MODE_SLUG,
					),
					true
				)
			) {
				return self::AMP_MODE_SECONDARY;
			}
		} elseif ( function_exists( 'amp_is_canonical' ) ) {
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
	 * Filters the given entity's reference URL, effectively creating a copy of
	 * the entity with the reference URL accounted for.
	 *
	 * @since 1.15.0
	 *
	 * @param Entity|null $entity Entity to filter reference ID for, or null.
	 * @return Entity|null Filtered entity or null, based on $entity.
	 */
	private function filter_entity_reference_url( Entity $entity = null ) {
		if ( ! $entity ) {
			return null;
		}

		return new Entity(
			$this->filter_reference_url( $entity->get_url() ),
			array(
				'type'  => $entity->get_type(),
				'title' => $entity->get_title(),
				'id'    => $entity->get_id(),
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
		$site_url = untrailingslashit( $this->get_canonical_home_url() );

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

	/**
	 * Calls the WordPress core functions to get the locale and return it in the required format.
	 *
	 * @since 1.32.0
	 *
	 * @param string $context Optional. Defines which WordPress core locale function to call.
	 * @param string $format Optional. Defines the format the locale is returned in.
	 * @return string Locale in the required format.
	 */
	public function get_locale( $context = 'site', $format = 'default' ) {

		// Get the site or user locale.
		if ( 'user' === $context ) {
			$wp_locale = get_user_locale();
		} else {
			$wp_locale = get_locale();
		}

		// Return locale in the required format.
		if ( 'language-code' === $format ) {
			$code_array = explode( '_', $wp_locale );
			return $code_array[0];

		} elseif ( 'language-variant' === $format ) {
			$variant_array  = explode( '_', $wp_locale );
			$variant_string = implode( '_', array_slice( $variant_array, 0, 2 ) );
			return $variant_string;
		}

		return $wp_locale;
	}
}
