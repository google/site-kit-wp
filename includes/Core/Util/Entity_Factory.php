<?php
/**
 * Class Google\Site_Kit\Core\Util\Entity_Factory
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Plugin;
use WP_Query;
use WP_Post;
use WP_Term;
use WP_User;
use WP_Post_Type;
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
 * @since 1.15.0
 * @access private
 * @ignore
 */
final class Entity_Factory {

	/**
	 * Gets the entity for the current WordPress context, if available.
	 *
	 * @since 1.15.0
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
			$entity = self::from_wp_query( $wp_the_query );

			$request_uri = Plugin::instance()->context()->input()->filter( INPUT_SERVER, 'REQUEST_URI' );
			return self::maybe_convert_to_amp_entity( $request_uri, $entity );
		}

		return null;
	}

	/**
	 * Gets the entity for the given URL, if available.
	 *
	 * Calling this method is expensive, so it should only be used in certain admin contexts where this is acceptable.
	 *
	 * @since 1.15.0
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

		$entity = self::from_wp_query( $query );

		return self::maybe_convert_to_amp_entity( $url, $entity );
	}

	/**
	 * Gets the entity for the given `WP_Query` object, if available.
	 *
	 * @since 1.15.0
	 *
	 * @param WP_Query $query WordPress query object. Must already have run the actual database query.
	 * @return Entity|null The entity for the query, or null if none could be determined.
	 */
	public static function from_wp_query( WP_Query $query ) {
		// A singular post (possibly the static front page).
		if ( $query->is_singular() ) {
			$post = $query->get_queried_object();
			if ( $post instanceof WP_Post && self::is_post_public( $post ) ) {
				return self::create_entity_for_post( $post );
			}
			return null;
		}

		// The blog.
		if ( $query->is_home() ) {
			// The blog is either the front page...
			if ( $query->is_front_page() ) {
				return self::create_entity_for_front_blog();
			}
			// ...or it is a separate post assigned as 'page_for_posts'.
			return self::create_entity_for_posts_blog();
		}

		// A taxonomy term archive.
		if ( $query->is_category() || $query->is_tag() || $query->is_tax() ) {
			$term = $query->get_queried_object();
			if ( $term instanceof WP_Term ) {
				return self::create_entity_for_term( $term );
			}
		}

		// An author archive.
		if ( $query->is_author() ) {
			$user = $query->get_queried_object();
			if ( $user instanceof WP_User ) {
				return self::create_entity_for_author( $user );
			}
		}

		// A post type archive.
		if ( $query->is_post_type_archive() ) {
			$post_type = $query->get( 'post_type' );
			if ( is_array( $post_type ) ) {
				$post_type = reset( $post_type );
			}
			$post_type_object = get_post_type_object( $post_type );
			if ( $post_type_object instanceof WP_Post_Type ) {
				return self::create_entity_for_post_type( $post_type_object );
			}
		}

		// A date-based archive.
		if ( $query->is_date() ) {
			$queried_post = self::get_first_query_post( $query );
			if ( ! $queried_post ) {
				return null;
			}
			if ( $query->is_year() ) {
				return self::create_entity_for_date( $queried_post, 'year' );
			}
			if ( $query->is_month() ) {
				return self::create_entity_for_date( $queried_post, 'month' );
			}
			if ( $query->is_day() ) {
				return self::create_entity_for_date( $queried_post, 'day' );
			}

			// Time archives are not covered for now. While they can theoretically be used in WordPress, they
			// aren't fully supported, and WordPress does not link to them anywhere.
			return null;
		}

		return null;
	}

	/**
	 * Creates the entity for a given post object.
	 *
	 * @since 1.15.0
	 *
	 * @param WP_Post $post A WordPress post object.
	 * @return Entity The entity for the post.
	 */
	private static function create_entity_for_post( WP_Post $post ) {
		return new Entity(
			get_permalink( $post ),
			array(
				'type'  => 'post',
				'title' => $post->post_title,
				'id'    => $post->ID,
			)
		);
	}

	/**
	 * Creates the entity for the posts page blog archive.
	 *
	 * This method should only be used when the blog is handled via a separate page, i.e. when 'show_on_front' is set
	 * to 'page' and the 'page_for_posts' option is set. In this case the blog is technically a post itself, therefore
	 * its entity also includes an ID.
	 *
	 * @since 1.15.0
	 *
	 * @return Entity|null The entity for the posts blog archive, or null if not set.
	 */
	private static function create_entity_for_posts_blog() {
		$post_id = (int) get_option( 'page_for_posts' );
		if ( ! $post_id ) {
			return null;
		}

		$post = get_post( $post_id );
		if ( ! $post ) {
			return null;
		}

		return new Entity(
			get_permalink( $post ),
			array(
				'type'  => 'blog',
				'title' => $post->post_title,
				'id'    => $post->ID,
			)
		);
	}

	/**
	 * Creates the entity for the front page blog archive.
	 *
	 * This method should only be used when the front page is set to display the
	 * blog archive, i.e. is not technically a post itself.
	 *
	 * @since 1.15.0
	 *
	 * @return Entity The entity for the front blog archive.
	 */
	private static function create_entity_for_front_blog() {
		// The translation string intentionally omits the 'google-site-kit' text domain since it should use
		// WordPress core translations.
		return new Entity(
			user_trailingslashit( home_url() ),
			array(
				'type'  => 'blog',
				'title' => __( 'Home', 'default' ),
			)
		);
	}

	/**
	 * Creates the entity for a given term object, i.e. for a taxonomy term archive.
	 *
	 * @since 1.15.0
	 *
	 * @param WP_Term $term A WordPress term object.
	 * @return Entity The entity for the term.
	 */
	private static function create_entity_for_term( WP_Term $term ) {
		// See WordPress's `get_the_archive_title()` function for this behavior. The strings here intentionally omit
		// the 'google-site-kit' text domain since they should use WordPress core translations.
		switch ( $term->taxonomy ) {
			case 'category':
				$title  = $term->name;
				$prefix = _x( 'Category:', 'category archive title prefix', 'default' );
				break;
			case 'post_tag':
				$title  = $term->name;
				$prefix = _x( 'Tag:', 'tag archive title prefix', 'default' );
				break;
			case 'post_format':
				$prefix = '';
				switch ( $term->slug ) {
					case 'post-format-aside':
						$title = _x( 'Asides', 'post format archive title', 'default' );
						break;
					case 'post-format-gallery':
						$title = _x( 'Galleries', 'post format archive title', 'default' );
						break;
					case 'post-format-image':
						$title = _x( 'Images', 'post format archive title', 'default' );
						break;
					case 'post-format-video':
						$title = _x( 'Videos', 'post format archive title', 'default' );
						break;
					case 'post-format-quote':
						$title = _x( 'Quotes', 'post format archive title', 'default' );
						break;
					case 'post-format-link':
						$title = _x( 'Links', 'post format archive title', 'default' );
						break;
					case 'post-format-status':
						$title = _x( 'Statuses', 'post format archive title', 'default' );
						break;
					case 'post-format-audio':
						$title = _x( 'Audio', 'post format archive title', 'default' );
						break;
					case 'post-format-chat':
						$title = _x( 'Chats', 'post format archive title', 'default' );
						break;
				}
				break;
			default:
				$tax    = get_taxonomy( $term->taxonomy );
				$title  = $term->name;
				$prefix = sprintf(
					/* translators: %s: Taxonomy singular name. */
					_x( '%s:', 'taxonomy term archive title prefix', 'default' ),
					$tax->labels->singular_name
				);
		}

		return new Entity(
			get_term_link( $term ),
			array(
				'type'  => 'term',
				'title' => self::prefix_title( $title, $prefix ),
				'id'    => $term->term_id,
			)
		);
	}

	/**
	 * Creates the entity for a given user object, i.e. for an author archive.
	 *
	 * @since 1.15.0
	 *
	 * @param WP_User $user A WordPress user object.
	 * @return Entity The entity for the user.
	 */
	private static function create_entity_for_author( WP_User $user ) {
		// See WordPress's `get_the_archive_title()` function for this behavior. The string here intentionally omits
		// the 'google-site-kit' text domain since it should use WordPress core translations.
		$title  = $user->display_name;
		$prefix = _x( 'Author:', 'author archive title prefix', 'default' );

		return new Entity(
			get_author_posts_url( $user->ID, $user->user_nicename ),
			array(
				'type'  => 'user',
				'title' => self::prefix_title( $title, $prefix ),
				'id'    => $user->ID,
			)
		);
	}

	/**
	 * Creates the entity for a given post type object.
	 *
	 * @since 1.15.0
	 *
	 * @param WP_Post_Type $post_type A WordPress post type object.
	 * @return Entity The entity for the post type.
	 */
	private static function create_entity_for_post_type( WP_Post_Type $post_type ) {
		// See WordPress's `get_the_archive_title()` function for this behavior. The string here intentionally omits
		// the 'google-site-kit' text domain since it should use WordPress core translations.
		$title  = $post_type->labels->name;
		$prefix = _x( 'Archives:', 'post type archive title prefix', 'default' );

		return new Entity(
			get_post_type_archive_link( $post_type->name ),
			array(
				'type'  => 'post_type',
				'title' => self::prefix_title( $title, $prefix ),
			)
		);
	}

	/**
	 * Creates the entity for a date-based archive.
	 *
	 * The post specified has to any post from the query, in order to extract the relevant date information.
	 *
	 * @since 1.15.0
	 *
	 * @param WP_Post $queried_post A WordPress post object from the query.
	 * @param string  $type         Optional. Type of the date-based archive. Either 'year', 'month', or 'day'.
	 *                              Default is 'day'.
	 * @return Entity|null The entity for the date archive, or null if unable to parse date.
	 */
	private static function create_entity_for_date( WP_Post $queried_post, $type = 'day' ) {
		// See WordPress's `get_the_archive_title()` function for this behavior. The strings here intentionally omit
		// the 'google-site-kit' text domain since they should use WordPress core translations.
		switch ( $type ) {
			case 'year':
				$prefix          = _x( 'Year:', 'date archive title prefix', 'default' );
				$format          = _x( 'Y', 'yearly archives date format', 'default' );
				$url_func        = 'get_year_link';
				$url_func_format = 'Y';
				break;
			case 'month':
				$prefix          = _x( 'Month:', 'date archive title prefix', 'default' );
				$format          = _x( 'F Y', 'monthly archives date format', 'default' );
				$url_func        = 'get_month_link';
				$url_func_format = 'Y/m';
				break;
			default:
				$type            = 'day';
				$prefix          = _x( 'Day:', 'date archive title prefix', 'default' );
				$format          = _x( 'F j, Y', 'daily archives date format', 'default' );
				$url_func        = 'get_day_link';
				$url_func_format = 'Y/m/j';
		}

		$title = get_post_time( $format, false, $queried_post, true );

		$url_func_args = get_post_time( $url_func_format, false, $queried_post );
		if ( ! $url_func_args ) {
			return null; // Unable to parse date, likely there is none set.
		}
		$url_func_args = array_map( 'absint', explode( '/', $url_func_args ) );

		return new Entity(
			call_user_func_array( $url_func, $url_func_args ),
			array(
				'type'  => $type,
				'title' => self::prefix_title( $title, $prefix ),
			)
		);
	}

	/**
	 * Checks whether a given post is public, i.e. has a public URL.
	 *
	 * @since 1.15.0
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

	/**
	 * Gets the first post from a WordPress query.
	 *
	 * @since 1.15.0
	 *
	 * @param WP_Query $query WordPress query object. Must already have run the actual database query.
	 * @return WP_Post|null WordPress post object, or null if none found.
	 */
	private static function get_first_query_post( WP_Query $query ) {
		if ( ! $query->posts ) {
			return null;
		}

		$post = reset( $query->posts );
		if ( $post instanceof WP_Post ) {
			return $post;
		}

		if ( is_numeric( $post ) ) {
			return get_post( $post );
		}

		return null;
	}

	/**
	 * Combines an entity title and prefix.
	 *
	 * This is based on the WordPress core function `get_the_archive_title()`.
	 *
	 * @since 1.15.0
	 *
	 * @param string $title  The title.
	 * @param string $prefix The prefix to add, should end in a colon.
	 * @return string Resulting entity title.
	 */
	private static function prefix_title( $title, $prefix ) {
		if ( empty( $prefix ) ) {
			return $title;
		}

		// See WordPress's `get_the_archive_title()` function for this behavior. The string here intentionally omits
		// the 'google-site-kit' text domain since it should use WordPress core translations.
		return sprintf(
			/* translators: 1: Title prefix. 2: Title. */
			_x( '%1$s %2$s', 'archive title', 'default' ),
			$prefix,
			$title
		);
	}

	/**
	 * Converts given entity to AMP entity if the given URL is an AMP URL.
	 *
	 * @since 1.42.0
	 *
	 * @param string $url URL to determine the entity from.
	 * @param Entity $entity The initial entity.
	 * @return Entity The initial or new entity for the given URL.
	 */
	private static function maybe_convert_to_amp_entity( $url, $entity ) {
		if ( is_null( $entity ) || ! defined( 'AMP__VERSION' ) ) {
			return $entity;
		}

		$url_parts   = wp_parse_url( $url );
		$current_url = $entity->get_url();

		if ( ! empty( $url_parts['query'] ) ) {
			$url_query_params = array();

			wp_parse_str( $url_parts['query'], $url_query_params );

			// check if the $url has amp query param.
			if ( array_key_exists( 'amp', $url_query_params ) ) {
				$new_url = add_query_arg( 'amp', '1', $current_url );
				return self::convert_to_amp_entity( $new_url, $entity );
			}
		}

		if ( ! empty( $url_parts['path'] ) ) {
			// We need to correctly add trailing slash if the original url had trailing slash.
			// That's the reason why we need to check for both version.
			if ( '/amp' === substr( $url_parts['path'], -4 ) ) { // -strlen('/amp') is -4
				$new_url = untrailingslashit( $current_url ) . '/amp';
				return self::convert_to_amp_entity( $new_url, $entity );
			}

			if ( '/amp/' === substr( $url_parts['path'], -5 ) ) { // -strlen('/amp/') is -5
				$new_url = untrailingslashit( $current_url ) . '/amp/';
				return self::convert_to_amp_entity( $new_url, $entity );
			}
		}

		return $entity;
	}

	/**
	 * Converts given entity to AMP entity by changing the entity URL and adding correct mode.
	 *
	 * @since 1.42.0
	 *
	 * @param string $new_url URL of the new entity.
	 * @param Entity $entity The initial entity.
	 * @return Entity The new entity.
	 */
	private static function convert_to_amp_entity( $new_url, $entity ) {
		$new_entity = new Entity(
			$new_url,
			array(
				'id'    => $entity->get_id(),
				'type'  => $entity->get_type(),
				'title' => $entity->get_title(),
				'mode'  => 'amp_secondary',
			)
		);

		return $new_entity;
	}
}
