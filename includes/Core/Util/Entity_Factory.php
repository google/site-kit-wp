<?php
/**
 * Class Google\Site_Kit\Core\Util\Entity_Factory
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use WP_Query;
use WP_Post;
use WP_Screen;

/**
 * Class providing access to entities.
 *
 * This class entirely relies on WordPress core behavior and is technically decoupled from Site Kit. For example,
 * entities returned by this factory rely on the regular WordPress home URL and ignore Site Kit-specific details, such
 * as an alternative "reference site URL".
 *
 * Instead of relying on this class directly, use {@see Context::get_reference_entity()} or
 * {@see Context::get_reference_entity_from_url()}.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Entity_Factory {

	/**
	 * Gets the entity for the current WordPress context, if available.
	 *
	 * @since n.e.x.t
	 *
	 * @return Entity|null The entity for the current context, or null if none could be determined.
	 */
	public static function from_context() {
		global $wp_the_query;

		// If currently in WP admin, run admin-specific checks.
		if ( is_admin() ) {
			$screen = get_current_screen();
			if ( ! $screen instanceof WP_Screen || 'post' !== $screen->base ) {
				return null;
			}

			$post = get_post();
			if ( $post instanceof WP_Post && self::is_post_public( $post ) ) {
				return self::create_entity_for_post( $post );
			}
			return null;
		}

		// Otherwise, run frontend-specific `WP_Query` logic.
		if ( $wp_the_query instanceof WP_Query ) {
			return self::from_wp_query( $wp_the_query );
		}
		return null;
	}

	/**
	 * Gets the entity for the given URL, if available.
	 *
	 * Calling this method is expensive, so it should only be used in certain admin contexts where this is acceptable.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url URL to determine the entity from.
	 * @return Entity|null The entity for the URL, or null if none could be determined.
	 */
	public static function from_url( $url ) {
		$query = WP_Query_Factory::from_url( $url );
		if ( ! $query ) {
			return null;
		}

		$query->get_posts();

		return self::from_wp_query( $query );
	}

	/**
	 * Gets the entity for the given `WP_Query` object, if available.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Query $query WordPress query object. Must already have run the actual database query.
	 * @return Entity|null The entity for the query, or null if none could be determined.
	 */
	public static function from_wp_query( WP_Query $query ) {
		if ( $query->is_singular() || $query->is_home() && ! $query->is_front_page() ) {
			$post = $query->get_queried_object();
			if ( $post instanceof WP_Post && self::is_post_public( $post ) ) {
				return self::create_entity_for_post( $post );
			}
			return null;
		}

		// If not singular (see above) but front page, this is the blog archive.
		if ( $query->is_front_page() ) {
			return self::create_entity_for_home_blog();
		}

		// TODO: This is not comprehensive, but will be expanded in the future.
		// Related: https://github.com/google/site-kit-wp/issues/174.
		return null;
	}

	/**
	 * Creates the entity for a given post object.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Post $post A WordPress post object.
	 * @return Entity The entity for the post.
	 */
	private static function create_entity_for_post( WP_Post $post ) {
		$type = 'post';

		// If this post is assigned as the posts page, it is actually the blog archive.
		if ( (int) get_option( 'page_for_posts' ) === (int) $post->ID ) {
			$type = 'blog';
		}

		return new Entity(
			get_permalink( $post ),
			array(
				'type'  => $type,
				'title' => $post->post_title,
				'id'    => $post->ID,
			)
		);
	}

	/**
	 * Creates the entity for the home blog archive.
	 *
	 * This method should only be used when the home page is set to display the
	 * blog archive, i.e. is not technically a post itself. Otherwise, it
	 * should be handled through {@see Context::create_entity_for_post()}.
	 *
	 * @since n.e.x.t
	 *
	 * @return Entity The entity for the home blog archive.
	 */
	private static function create_entity_for_home_blog() {
		return new Entity(
			user_trailingslashit( home_url() ),
			array(
				'type'  => 'blog',
				'title' => __( 'Home', 'google-site-kit' ),
			)
		);
	}

	/**
	 * Checks whether a given post is public, i.e. has a public URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Post $post A WordPress post object.
	 * @return bool True if the post is public, false otherwise.
	 */
	private static function is_post_public( WP_Post $post ) {
		// If post status isn't 'publish', the post is not public.
		if ( 'publish' !== get_post_status( $post ) ) {
			return false;
		}

		// If the post type overall is not publicly viewable, the post is not public.
		if ( ! is_post_type_viewable( $post->post_type ) ) {
			return false;
		}

		// Otherwise, the post is public.
		return true;
	}
}
