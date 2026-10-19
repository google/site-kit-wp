<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Posts_By_Page_Path
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Permission_Aware_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Entity_Factory;
use Google\Site_Kit\Core\Util\WP_Query_Factory;
use WP_Error;
use WP_Post;

/**
 * Class for the datapoint that gets the post each page path of an Analytics
 * report shows.
 *
 * It reads a page path the way WordPress reads a request, so every URL of one
 * post, such as `/?p=123` and `/?p=123&utm_source=newsletter`, gives that post.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Posts_By_Page_Path extends Shareable_Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint {

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->context = $definition['context'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable|WP_Error Closure returning the post or `null` of each page path, or WP_Error on invalid input.
	 */
	public function create_request( Data_Request $data_request ) {
		$page_paths = $data_request['pagePaths'];

		// Each page path can run a database query.
		if ( ! is_array( $page_paths ) || count( $page_paths ) > 50 ) {
			return new WP_Error(
				'invalid_page_paths',
				__( 'The pagePaths request parameter must be an array of at most 50 page paths.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		return function () use ( $page_paths ) {
			$posts = array();

			foreach ( $page_paths as $page_path ) {
				// Analytics records every page path with a leading slash, such as `/?p=123`.
				if ( ! is_string( $page_path ) || 0 !== strpos( $page_path, '/' ) ) {
					continue;
				}

				$posts[ $page_path ] = $this->get_post_data( $page_path );
			}

			return $posts;
		};
	}

	/**
	 * Gets the published post that a visitor sees at a page path.
	 *
	 * The WooCommerce shop page gives no post, because WooCommerce shows the
	 * list of products there.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $page_path The page path with its query string, such as `/?p=123`.
	 * @return array|null {
	 *     The post, or `null` when the page path shows no single published post.
	 *
	 *     @type int    $id       The post ID.
	 *     @type string $postType The post type, such as `post` or `product`.
	 *     @type string $title    The title as text, such as `Don’t miss it`, or an empty string.
	 *     @type string $url      The permalink, on the reference site URL.
	 * }
	 */
	protected function get_post_data( $page_path ) {
		$query = WP_Query_Factory::from_url( $page_path );

		// The query knows whether it shows a single post before it runs, so a
		// listing, such as an archive or a search, costs no database query.
		if ( ! $query || ! $query->is_singular() ) {
			return null;
		}

		// The title and the link need neither the post meta nor the terms.
		$query->set( 'update_post_meta_cache', false );
		$query->set( 'update_post_term_cache', false );
		$query->get_posts();

		$entity = Entity_Factory::from_wp_query( $query );

		if ( ! $entity || 'post' !== $entity->get_type() ) {
			return null;
		}

		$post = $query->get_queried_object();

		if ( function_exists( 'wc_get_page_id' ) && wc_get_page_id( 'shop' ) === $post->ID ) {
			return null;
		}

		return array(
			'id'       => $post->ID,
			'postType' => $post->post_type,
			'title'    => $this->get_title_text( $post ),
			'url'      => $this->context->get_reference_permalink( $post ),
		);
	}

	/**
	 * Gets the title of a post as text.
	 *
	 * `get_the_title()` runs the title through the `the_title` filters. One of
	 * them is `wptexturize()`, which writes an apostrophe as `&#8217;`, and an
	 * author can add HTML tags, such as `<em>`.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Post $post The post.
	 * @return string The title as text, such as `Don’t miss it` for `Don't <em>miss</em> it`, or an empty string for a post with no title.
	 */
	protected function get_title_text( WP_Post $post ) {
		// The WordPress REST API shows the title of a password-protected post
		// without its "Protected:" prefix, and so do we.
		$title_format = fn () => '%s';

		add_filter( 'protected_title_format', $title_format );
		$title = get_the_title( $post );
		remove_filter( 'protected_title_format', $title_format );

		return html_entity_decode( wp_strip_all_tags( $title ), ENT_QUOTES | ENT_HTML5, get_bloginfo( 'charset' ) );
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}

	/**
	 * Checks whether the current user is allowed to access the datapoint.
	 *
	 * The datapoint returns published posts only, so any dashboard viewer may
	 * read it, a view-only user of a shared dashboard included.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool `true` when the current user can view the dashboard.
	 */
	public function permission_callback() {
		return current_user_can( Permissions::VIEW_DASHBOARD );
	}
}
