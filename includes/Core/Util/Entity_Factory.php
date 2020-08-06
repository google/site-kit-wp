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
use WP_Post;

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
		// If currently in WP admin, run admin-specific checks.
		if ( is_admin() ) {
			$post = get_post();
			if ( $post instanceof WP_Post ) {
				return self::create_entity_for_post( $post );
			}
			return null;
		}

		// Otherwise, run frontend-specific checks.
		if ( is_singular() || is_home() && ! is_front_page() ) {
			$post = get_queried_object();
			if ( $post instanceof WP_Post && self::is_post_public( $post ) ) {
				return self::create_entity_for_post( $post );
			}
			return null;
		}

		// If not singular (see above) but front page, this is the blog archive.
		if ( is_front_page() ) {
			return self::create_entity_for_home_blog();
		}

		// TODO: This is not comprehensive, but will be expanded in the future.
		// Related: https://github.com/google/site-kit-wp/issues/174.
		return null;
	}

	/**
	 * Gets the entity for the given URL, if available.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url URL to determine the entity from.
	 * @return Entity|null The entity for the URL, or null if none could be determined.
	 */
	public static function from_url( $url ) {
		if ( function_exists( 'wpcom_vip_url_to_postid' ) ) {
			$post_id = wpcom_vip_url_to_postid( $url );
		} else {
			// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions
			$post_id = url_to_postid( $url );
		}

		// url_to_postid() does not support detecting the posts page, hence
		// this code covers up for it.
		if ( ! $post_id && get_option( 'page_for_posts' ) && get_permalink( get_option( 'page_for_posts' ) ) === $url ) {
			$post_id = (int) get_option( 'page_for_posts' );
		}

		if ( $post_id ) {
			$post = get_post( $post_id );
			if ( $post instanceof WP_Post ) {
				if ( self::is_post_public( $post ) ) {
					return self::create_entity_for_post( $post );
				}
				return null;
			}
		}

		$path = str_replace( untrailingslashit( home_url() ), '', $url );
		if ( empty( $path ) || '/' === $path ) {
			return self::create_entity_for_home_blog();
		}

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
		// If post status isn't 'publish' (or 'inherit' in case of an 'attachment' post), the post is not public.
		if ( 'publish' !== $post->post_status && ( 'attachment' !== $post->post_type || 'inherit' !== $post->post_status ) ) {
			return false;
		}

		// If the post type overall is not public, the post is not public.
		$post_type = get_post_type_object( $post->post_type );
		if ( ! $post_type || ! $post_type->public ) {
			return false;
		}

		// Otherwise, the post is public.
		return true;
	}
}
