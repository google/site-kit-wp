<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google\Filters
 *
 * @package   Google\Site_Kit\Modules\Subscribe_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Subscribe_With_Google;

/**
 * Adds filters.
 */
final class Filters {

	/**
	 * Adds WordPress filters.
	 *
	 * @param bool $is_amp True if an AMP request, false otherwise.
	 */
	public function __construct( $is_amp ) {
		if ( $is_amp ) {
			add_filter( 'body_class', array( __CLASS__, 'body_class' ) );
		}

		add_filter( 'the_content', array( __CLASS__, 'the_content' ) );
	}

	/**
	 * Filters body classes on Post view pages.
	 *
	 * @param string[] $classes already assigned to body.
	 */
	public static function body_class( $classes ) {
		// Check if we're inside the main loop in a single post page.
		if ( ! is_single() || ! is_main_query() ) {
			return $classes;
		}

		$classes[] = 'swg--is-amp';
		return $classes;
	}

	/**
	 * Filters content on Post view pages.
	 *
	 * @param string $content Initial content of Post.
	 * @return string Filtered content of Post.
	 */
	public static function the_content( $content ) {
		// Check if we're inside the main loop in a single post page.
		if ( ! is_single() || ! is_main_query() ) {
			return $content;
		}

		// Bail if the post is free.
		$free_key = Key::from( 'free' );
		$free     = get_post_meta( get_the_ID(), $free_key, true );
		if ( 'true' === $free ) {
			return $content;
		}

		$more_tag         = '<span id="more-' . get_the_ID() . '"></span>';
		$content_segments = explode( $more_tag, $content );

		// Wrap locked content.
		if ( count( $content_segments ) > 1 ) {
			$content_segments[1] = '
<div class="swg--locked-content" subscriptions-section="content">
' . $content_segments[1] . '
</div>
';
		}

		$content = implode( $more_tag, $content_segments );

		return $content;
	}
}
