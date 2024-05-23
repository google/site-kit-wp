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
				return self::create_entity_for_post( $post, 1 );
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
				return self::create_entity_for_post( $post, self::get_query_pagenum( $query, 'page' ) );
			}
			return null;
		}

		$page = self::get_query_pagenum( $query );

		// The blog.
		if ( $query->is_home() ) {
			// The blog is either the front page...
			if ( $query->is_front_page() ) {
				return self::create_entity_for_front_blog( $page );
			}
			// ...or it is a separate post assigned as 'page_for_posts'.
			return self::create_entity_for_posts_blog( $page );
		}

		// A taxonomy term archive.
		if ( $query->is_category() || $query->is_tag() || $query->is_tax() ) {
			$term = $query->get_queried_object();
			if ( $term instanceof WP_Term ) {
				return self::create_entity_for_term( $term, $page );
			}
		}

		// An author archive.
		if ( $query->is_author() ) {
			$user = $query->get_queried_object();
			if ( $user instanceof WP_User ) {
				return self::create_entity_for_author( $user, $page );
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
				return self::create_entity_for_post_type( $post_type_object, $page );
			}
		}

		// A date-based archive.
		if ( $query->is_date() ) {
			$queried_post = self::get_first_query_post( $query );
			if ( ! $queried_post ) {
				return null;
			}
			if ( $query->is_year() ) {
				return self::create_entity_for_date( $queried_post, 'year', $page );
			}
			if ( $query->is_month() ) {
				return self::create_entity_for_date( $queried_post, 'month', $page );
			}
			if ( $query->is_day() ) {
				return self::create_entity_for_date( $queried_post, 'day', $page );
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
	 * @since 1.68.0 Method access modifier changed to public.
	 *
	 * @param WP_Post $post A WordPress post object.
	 * @param int     $page Page number.
	 * @return Entity The entity for the post.
	 */
	public static function create_entity_for_post( WP_Post $post, $page ) {
		$url = self::paginate_post_url( get_permalink( $post ), $post, $page );

		return new Entity(
			urldecode( $url ),
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
	 * @param int $page Page number.
	 * @return Entity|null The entity for the posts blog archive, or null if not set.
	 */
	private static function create_entity_for_posts_blog( $page ) {
		$post_id = (int) get_option( 'page_for_posts' );
		if ( ! $post_id ) {
			return null;
		}

		$post = get_post( $post_id );
		if ( ! $post ) {
			return null;
		}

		return new Entity(
			self::paginate_entity_url( get_permalink( $post ), $page ),
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
	 * @param int $page Page number.
	 * @return Entity The entity for the front blog archive.
	 */
	private static function create_entity_for_front_blog( $page ) {
		// The translation string intentionally omits the 'google-site-kit' text domain since it should use
		// WordPress core translations.
		return new Entity(
			self::paginate_entity_url( user_trailingslashit( home_url() ), $page ),
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
	 * @param int     $page Page number.
	 * @return Entity The entity for the term.
	 */
	private static function create_entity_for_term( WP_Term $term, $page ) {
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
			self::paginate_entity_url( get_term_link( $term ), $page ),
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
	 * @param int     $page Page number.
	 * @return Entity The entity for the user.
	 */
	private static function create_entity_for_author( WP_User $user, $page ) {
		// See WordPress's `get_the_archive_title()` function for this behavior. The string here intentionally omits
		// the 'google-site-kit' text domain since it should use WordPress core translations.
		$title  = $user->display_name;
		$prefix = _x( 'Author:', 'author archive title prefix', 'default' );

		return new Entity(
			self::paginate_entity_url( get_author_posts_url( $user->ID, $user->user_nicename ), $page ),
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
	 * @param int          $page Page number.
	 * @return Entity The entity for the post type.
	 */
	private static function create_entity_for_post_type( WP_Post_Type $post_type, $page ) {
		// See WordPress's `get_the_archive_title()` function for this behavior. The string here intentionally omits
		// the 'google-site-kit' text domain since it should use WordPress core translations.
		$title  = $post_type->labels->name;
		$prefix = _x( 'Archives:', 'post type archive title prefix', 'default' );

		return new Entity(
			self::paginate_entity_url( get_post_type_archive_link( $post_type->name ), $page ),
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
	 * @param string  $type         Type of the date-based archive. Either 'year', 'month', or 'day'.
	 * @param int     $page         Page number.
	 * @return Entity|null The entity for the date archive, or null if unable to parse date.
	 */
	private static function create_entity_for_date( WP_Post $queried_post, $type, $page ) {
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
			self::paginate_entity_url( call_user_func_array( $url_func, $url_func_args ), $page ),
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

		$url_parts   = URL::parse( $url );
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

	/**
	 * Gets the page number for a query, via the specified query var. Defaults to 1.
	 *
	 * @since 1.68.0
	 *
	 * @param WP_Query $query A WordPress query object.
	 * @param string   $query_var Optional. Query var to look for, expects 'paged' or 'page'. Default 'paged'.
	 * @return int The page number.
	 */
	private static function get_query_pagenum( $query, $query_var = 'paged' ) {
		return $query->get( $query_var ) ? (int) $query->get( $query_var ) : 1;
	}

	/**
	 * Paginates an entity URL.
	 *
	 * Logic extracted from `paginate_links` in WordPress core.
	 * https://github.com/WordPress/WordPress/blob/7f5d7f1b56087c3eb718da4bd81deb06e077bbbb/wp-includes/general-template.php#L4203
	 *
	 * @since 1.68.0
	 *
	 * @param string $url The URL to paginate.
	 * @param int    $pagenum The page number to add to the URL.
	 * @return string The paginated URL.
	 */
	private static function paginate_entity_url( $url, $pagenum ) {
		global $wp_rewrite;

		if ( 1 === $pagenum ) {
			return $url;
		}

		// Setting up default values based on the given URL.
		$url_parts = explode( '?', $url );

		// Append the format placeholder to the base URL.
		$base = trailingslashit( $url_parts[0] ) . '%_%';

		// URL base depends on permalink settings.
		$format  = $wp_rewrite->using_index_permalinks() && ! strpos( $base, 'index.php' ) ? 'index.php/' : '';
		$format .= $wp_rewrite->using_permalinks() ? user_trailingslashit( $wp_rewrite->pagination_base . '/%#%', 'paged' ) : '?paged=%#%';

		// Array of query args to add.
		$add_args = array();

		// Merge additional query vars found in the original URL into 'add_args' array.
		if ( isset( $url_parts[1] ) ) {
			// Find the format argument.
			$format_parts = explode( '?', str_replace( '%_%', $format, $base ) );
			$format_query = isset( $format_parts[1] ) ? $format_parts[1] : '';
			wp_parse_str( $format_query, $format_args );

			// Find the query args of the requested URL.
			$url_query_args = array();
			wp_parse_str( $url_parts[1], $url_query_args );

			// Remove the format argument from the array of query arguments, to avoid overwriting custom format.
			foreach ( $format_args as $format_arg => $format_arg_value ) {
				unset( $url_query_args[ $format_arg ] );
			}

			$add_args = array_merge( $add_args, urlencode_deep( $url_query_args ) );
		}

		$link = str_replace( '%_%', $format, $base );
		$link = str_replace( '%#%', $pagenum, $link );
		if ( $add_args ) {
			$link = add_query_arg( $add_args, $link );
		}

		return $link;
	}

	/**
	 * Paginates a post URL.
	 *
	 * Logic extracted from `_wp_link_page` in WordPress core.
	 * https://github.com/WordPress/WordPress/blob/7f5d7f1b56087c3eb718da4bd81deb06e077bbbb/wp-includes/post-template.php#L1031
	 *
	 * @since 1.68.0
	 *
	 * @param string  $url The URL to paginate.
	 * @param WP_Post $post The WordPress post object.
	 * @param int     $pagenum The page number to add to the URL.
	 * @return string The paginated URL.
	 */
	private static function paginate_post_url( $url, $post, $pagenum ) {
		global $wp_rewrite;

		if ( 1 === $pagenum ) {
			return $url;
		}

		if ( ! get_option( 'permalink_structure' ) || in_array( $post->post_status, array( 'draft', 'pending' ), true ) ) {
			$url = add_query_arg( 'page', $pagenum, $url );
		} elseif ( 'page' === get_option( 'show_on_front' ) && (int) get_option( 'page_on_front' ) === (int) $post->ID ) {
			$url = trailingslashit( $url ) . user_trailingslashit( "$wp_rewrite->pagination_base/" . $pagenum, 'single_paged' );
		} else {
			$url = trailingslashit( $url ) . user_trailingslashit( $pagenum, 'single_paged' );
		}

		return $url;
	}
}
