<?php
/**
 * Class Google\Site_Kit\Modules\Thank_With_Google\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Thank_With_Google
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Thank_With_Google;

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\Tag_With_DNS_Prefetch_Trait;

/**
 * Class for Web tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag implements Tag_Interface {

	use Method_Proxy_Trait, Tag_With_DNS_Prefetch_Trait;

	/**
	 * Publication ID.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $publication_id;

	/**
	 * Button placement.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $button_placement;

	/**
	 * Button post types.
	 *
	 * @since n.e.x.t
	 * @var string[]
	 */
	private $button_post_types;

	/**
	 * Sets the current publication ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $publication_id Publication ID.
	 */
	public function set_publication_id( $publication_id ) {
		$this->publication_id = $publication_id;
	}

	/**
	 * Sets the current button placement.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $button_placement Button placement.
	 */
	public function set_button_placement( $button_placement ) {
		$this->button_placement = $button_placement;

	}

	/**
	 * Sets the current button post types.
	 *
	 * @since n.e.x.t
	 *
	 * @param string[] $button_post_types Button post types.
	 */
	public function set_button_post_types( $button_post_types ) {
		$this->button_post_types = $button_post_types;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'wp_enqueue_scripts', $this->get_method_proxy( 'enqueue_gtag_script' ) );
		add_filter( 'the_content', $this->get_method_proxy( 'update_the_content' ) );
		add_filter(
			'wp_resource_hints',
			$this->get_dns_prefetch_hints_callback( '//news.google.com' ),
			10,
			2
		);

		$this->do_init_tag_action();
	}

	/**
	 * Outputs gtag snippet.
	 *
	 * @since n.e.x.t
	 */
	protected function render() {
		// Do nothing, gtag script is enqueued.
	}

	/**
	 * Enqueues gtag script.
	 *
	 * @since n.e.x.t
	 */
	protected function enqueue_gtag_script() {
		$gtag_src = 'https://news.google.com/thank/js/v1/thank.js';

		$is_singular_button_post_type_entity = $this->is_singular_button_post_type_entity();

		$gtag_inline_script = sprintf(
			"
			(self.SWG_BASIC = self.SWG_BASIC || []).push(subscriptions => {
				subscriptions.init({
					type: 'Blog',
					isPartOfType: ['Blog', 'Product'],
					isPartOfProductId: '%s:default',
					buttonPosition: '%s',
					permalink: '%s',
					pluginVersion: '%s',
					postTitle: '%s'
				});
			});
			",
			esc_js( $this->publication_id ),
			esc_js( substr( $this->button_placement, 0, 7 ) === 'static_' ? 'inline' : 'floating' ), // strlen( 'static_' ) is 7.
			esc_js( $is_singular_button_post_type_entity ? get_permalink() : '' ),
			esc_js( GOOGLESITEKIT_VERSION ),
			esc_js( $is_singular_button_post_type_entity ? get_the_title() : '' )
		);

		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_register_script( 'google_thankjs', $gtag_src, array(), null, true );
		wp_add_inline_script( 'google_thankjs', $gtag_inline_script, 'before' );

		$filter_google_gtagjs = function ( $tag, $handle ) {
			if ( 'google_thankjs' !== $handle ) {
				return $tag;
			}

			return $this->snippet_comment_begin() . $tag . $this->snippet_comment_end();
		};

		add_filter( 'script_loader_tag', $filter_google_gtagjs, 10, 2 );

		if ( $is_singular_button_post_type_entity ) {
			wp_enqueue_script( 'google_thankjs' );
		}
	}

	/**
	 * Updates the content of the post.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content Content of the post.
	 * @return string Content of the post.
	 */
	protected function update_the_content( $content ) {
		if ( ! $this->is_singular_button_post_type_entity() || substr( $this->button_placement, 0, 7 ) !== 'static_' ) { // strlen( 'static_' ) is 7.
			return $content;
		}

		$button_placeholder = "<div counter-button style=\"height: 34px; visibility: hidden; box-sizing: content-box; padding: 12px 0; display: inline-block; overflow: hidden;\"></div>\n<button twg-button style=\"height: 42px; visibility: hidden; margin: 12px 0;\"></button>";
		$button_placeholder = $this->snippet_comment_begin() . $button_placeholder . $this->snippet_comment_end();

		if ( in_array( $this->button_placement, array( 'static_auto', 'static_below-content' ), true ) ) {
			$content = $content . $button_placeholder;
		} elseif ( 'static_above-content' === $this->button_placement ) {
			$content = $button_placeholder . $content;
		} elseif ( 'static_below-first-paragraph' === $this->button_placement ) {
			$content = substr_replace( $content, $button_placeholder, strpos( $content, '</p>' ) + 4, 0 ); // strlen( '</p>' ) is 4.
		}

		return $content;
	}

	/**
	 * Determine if the current page is a singular button post type entry.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the current page is a singular button post type entry. False otherwise.
	 */
	private function is_singular_button_post_type_entity() {
		return is_singular( $this->button_post_types );
	}

	/**
	 * Gets snippet comment begin.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Snippet comment begin.
	 */
	private function snippet_comment_begin() {
		return sprintf( "\n<!-- %s -->\n", esc_html__( 'Thank with Google snippet added by Site Kit', 'google-site-kit' ) );
	}

	/**
	 * Gets snippet comment end.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Snippet comment end.
	 */
	private function snippet_comment_end() {
		return sprintf( "\n<!-- %s -->\n", esc_html__( 'End Thank with Google snippet added by Site Kit', 'google-site-kit' ) );
	}
}
