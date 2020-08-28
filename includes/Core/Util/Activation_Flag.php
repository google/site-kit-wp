<?php
/**
 * Class Google\Site_Kit\Core\Util\Activation_Flag
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Class handling plugin activation.
 *
 * @since 1.10.0
 * @access private
 * @ignore
 */
final class Activation_Flag {
	const OPTION_SHOW_ACTIVATION_NOTICE = 'googlesitekit_show_activation_notice';
	const OPTION_NEW_SITE_POSTS         = 'googlesitekit_new_site_posts';

	/**
	 * Plugin context.
	 *
	 * @since 1.10.0
	 * @var Context
	 */
	private $context;

	/**
	 * Option API instance.
	 *
	 * @since 1.10.0
	 * @var Options
	 */
	protected $options;

	/**
	 * Constructor.
	 *
	 * @since 1.10.0
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. The Option API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null
	) {
		$this->context = $context;
		$this->options = $options ?: new Options( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.10.0
	 */
	public function register() {
		add_action(
			'googlesitekit_activation',
			function( $network_wide ) {
				// Set activation flag.
				$this->set_activation_flag( $network_wide );

				// Set initial new posts count.
				$this->set_new_site_posts_count();
			}
		);

		add_action(
			'admin_enqueue_scripts',
			function( $hook_suffix ) {
				// Refresh new posts count when accessing the plugin dashboard page.
				if ( 'toplevel_page_googlesitekit-dashboard' !== $hook_suffix ) {
					return;
				}
				$this->set_new_site_posts_count();
			},
			1
		);

		add_filter(
			'googlesitekit_admin_data',
			function ( $data ) {
				return $this->inline_js_admin_data( $data );
			}
		);
	}

	/**
	 * Sets the flag that the plugin has just been activated.
	 *
	 * @since 1.10.0 Migrated from Activation class.
	 *
	 * @param bool $network_wide Whether the plugin is being activated network-wide.
	 */
	public function set_activation_flag( $network_wide ) {
		if ( $network_wide ) {
			update_network_option( null, self::OPTION_SHOW_ACTIVATION_NOTICE, '1' );
			return;
		}

		update_option( self::OPTION_SHOW_ACTIVATION_NOTICE, '1', false );
	}

	/**
	 * Gets the flag that the plugin has just been activated.
	 *
	 * @since 1.10.0 Migrated from Activation class.
	 *
	 * @param bool $network_wide Whether to check the flag network-wide.
	 * @return bool True if just activated, false otherwise.
	 */
	public function get_activation_flag( $network_wide ) {
		if ( $network_wide ) {
			return (bool) get_network_option( null, self::OPTION_SHOW_ACTIVATION_NOTICE );
		}

		return (bool) get_option( self::OPTION_SHOW_ACTIVATION_NOTICE );
	}

	/**
	 * Deletes the flag that the plugin has just been activated.
	 *
	 * @since 1.10.0 Migrated from Activation class.
	 *
	 * @param bool $network_wide Whether the plugin is being activated network-wide.
	 */
	public function delete_activation_flag( $network_wide ) {
		if ( $network_wide ) {
			delete_network_option( null, self::OPTION_SHOW_ACTIVATION_NOTICE );
			return;
		}

		delete_option( self::OPTION_SHOW_ACTIVATION_NOTICE );
	}

	/**
	 * Queries the posts for a given win limit if it's a new site.
	 *
	 * If the number of posts is above the limit, the count will no longer be recorded. The count is used for the
	 * publisher wins.
	 *
	 * @since 1.10.0 Migrated from Activation class.
	 *
	 * @param int $win_limit Optional. Limit of posts to consider. Default 5.
	 */
	private function set_new_site_posts_count( $win_limit = 5 ) {
		// Bail early if not a new site.
		if ( '-1' === $this->options->get( self::OPTION_NEW_SITE_POSTS ) ) {
			return;
		}

		$args = array(
			'post_type'              => 'post',
			'post_status'            => 'publish',
			'posts_per_page'         => $win_limit + 1,
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields'                 => 'ids',
		);

		$query = new \WP_Query( $args );

		if ( $query->have_posts() && $win_limit < count( $query->posts ) ) {
			$this->options->set( self::OPTION_NEW_SITE_POSTS, -1, false );
			return;
		}

		$count = count( $query->posts );
		if ( 1 === $count && 1 === $query->posts[0] ) {
			$first_post = get_post( $query->posts[0] );
			if ( __( 'Hello world!', 'default' ) === $first_post->post_title ) {
				$count = 0;
			}
		}

		$this->options->set( self::OPTION_NEW_SITE_POSTS, $count, false );
	}

	/**
	 * Modifies the admin data to pass to JS.
	 *
	 * @since 1.10.0 Migrated from Activation class.
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_admin_data( $data ) {
		$data['newSitePosts'] = $this->options->get( self::OPTION_NEW_SITE_POSTS );

		return $data;
	}
}
