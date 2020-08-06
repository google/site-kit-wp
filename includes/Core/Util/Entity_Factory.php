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
use WP_Query;

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
	 * Calling this method is expensive, so it should only be used in certain admin contexts where this is acceptable.
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
	 * Determines the WordPress query arguments to use for a given URL.
	 *
	 * This is an expensive function that works similarly to WordPress core's `url_to_postid()` function, however also
	 * covering non-post URLs. It follows logic used in `WP::parse_request()` to cover the other kinds of URLs. The
	 * majority of the code is a direct copy of certain parts of these functions.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url URL to get WordPress query object for.
	 * @return array|null Associative array of WP_Query arguments, or null if unable to parse query from URL.
	 */
	private static function url_to_query_args( $url ) {
		global $wp, $wp_rewrite;

		$url_host      = str_replace( 'www.', '', wp_parse_url( $url, PHP_URL_HOST ) );
		$home_url_host = str_replace( 'www.', '', wp_parse_url( home_url(), PHP_URL_HOST ) );

		// Bail early if the URL does not belong to this site.
		if ( $url_host && $url_host !== $home_url_host ) {
			return null;
		}

		// Strip 'index.php/' if we're not using path info permalinks.
		if ( ! $wp_rewrite->using_index_permalinks() ) {
			$url = str_replace( $wp_rewrite->index . '/', '', $url );
		}

		$url_path  = wp_parse_url( $url, PHP_URL_PATH );
		$url_query = wp_parse_url( $url, PHP_URL_QUERY );

		// Strip potential home URL path segment from URL path.
		$home_path = untrailingslashit( wp_parse_url( home_url( '/' ), PHP_URL_PATH ) );
		if ( ! empty( $home_path ) ) {
			$url_path = substr( $url_path, strlen( $home_path ) );
		}

		// Strip leading and trailing slashes.
		$url_path = trim( $url_path, '/' );

		// These two variables will be used further down to determine actual WP_Query arguments.
		$url_path_vars  = array();
		$url_query_vars = array();

		// Fetch the rewrite rules.
		$rewrite = $wp_rewrite->wp_rewrite_rules();

		// Match path against rewrite rules.
		$matched_rule = '';
		$query        = '';
		$matches      = array();
		if ( empty( $url_path ) || $url_path === $wp_rewrite->index ) {
			if ( isset( $rewrite['$'] ) ) {
				$matched_rule = '$';
				$query        = $rewrite['$'];
				$matches      = array( '' );
			}
		} else {
			foreach ( (array) $rewrite as $match => $query ) {
				if ( preg_match( "#^$match#", $url_path, $matches ) ) {
					if ( $wp_rewrite->use_verbose_page_rules && preg_match( '/pagename=\$matches\[([0-9]+)\]/', $query, $varmatch ) ) {
						// This is a verbose page match, let's check to be sure about it.
						// We'll rely 100% on WP core functions here.
						// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions
						$page = get_page_by_path( $matches[ $varmatch[1] ] );
						if ( ! $page ) {
							continue;
						}

						$post_status_obj = get_post_status_object( $page->post_status );
						if ( ! $post_status_obj->public && ! $post_status_obj->protected
							&& ! $post_status_obj->private && $post_status_obj->exclude_from_search ) {
							continue;
						}
					}

					$matched_rule = $match;
					break;
				}
			}
		}

		// If rewrite rules matched, populate $url_path_vars.
		if ( $matched_rule ) {
			// Trim the query of everything up to the '?'.
			$query = preg_replace( '!^.+\?!', '', $query );

			// Substitute the substring matches into the query.
			$query = addslashes( \WP_MatchesMapRegex::apply( $query, $matches ) );

			parse_str( $query, $url_path_vars );
		}

		// If there is a URL query string, populate $url_query_vars.
		if ( $url_query ) {
			parse_str( $url_query, $url_query_vars );
		}

		// Determine available post type query vars.
		$post_type_query_vars = array();
		foreach ( get_post_types( array(), 'objects' ) as $post_type => $post_type_obj ) {
			if ( is_post_type_viewable( $post_type_obj ) && $post_type_obj->query_var ) {
				$post_type_query_vars[ $post_type_obj->query_var ] = $post_type;
			}
		}

		// Populate actual WP_Query arguments.
		$query_args = array();
		foreach ( $wp->public_query_vars as $wpvar ) {
			if ( isset( $url_query_vars[ $wpvar ] ) ) {
				$query_args[ $wpvar ] = $url_query_vars[ $wpvar ];
			} elseif ( isset( $url_path_vars[ $wpvar ] ) ) {
				$query_args[ $wpvar ] = $url_path_vars[ $wpvar ];
			}

			if ( ! empty( $query_args[ $wpvar ] ) ) {
				if ( ! is_array( $query_args[ $wpvar ] ) ) {
					$query_args[ $wpvar ] = (string) $query_args[ $wpvar ];
				} else {
					foreach ( $query_args[ $wpvar ] as $key => $value ) {
						if ( is_scalar( $value ) ) {
							$query_args[ $wpvar ][ $key ] = (string) $value;
						}
					}
				}

				if ( isset( $post_type_query_vars[ $wpvar ] ) ) {
					$query_args['post_type'] = $post_type_query_vars[ $wpvar ];
					$query_args['name']      = $query_args[ $wpvar ];
				}
			}
		}

		// Convert urldecoded spaces back into '+'.
		foreach ( get_taxonomies( array(), 'objects' ) as $taxonomy => $taxonomy_obj ) {
			if ( $taxonomy_obj->query_var && isset( $query_args[ $taxonomy_obj->query_var ] ) ) {
				$query_args[ $taxonomy_obj->query_var ] = str_replace( ' ', '+', $query_args[ $taxonomy_obj->query_var ] );
			}
		}

		// Don't allow non-publicly queryable taxonomies to be queried from the front end.
		foreach ( get_taxonomies( array( 'publicly_queryable' => false ), 'objects' ) as $taxonomy => $t ) {
			if ( isset( $query_args['taxonomy'] ) && $taxonomy === $query_args['taxonomy'] ) {
				unset( $query_args['taxonomy'], $query_args['term'] );
			}
		}

		// Limit publicly queried post_types to those that are 'publicly_queryable'.
		if ( isset( $query_args['post_type'] ) ) {
			$queryable_post_types = get_post_types( array( 'publicly_queryable' => true ) );
			if ( ! is_array( $query_args['post_type'] ) ) {
				if ( ! in_array( $query_args['post_type'], $queryable_post_types, true ) ) {
					unset( $query_args['post_type'] );
				}
			} else {
				$query_args['post_type'] = array_intersect( $query_args['post_type'], $queryable_post_types );
			}
		}

		// Resolve conflicts between posts with numeric slugs and date archive queries.
		$query_args = wp_resolve_numeric_slug_conflicts( $query_args );

		return $query_args;
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
