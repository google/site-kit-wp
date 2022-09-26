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
 * @since 1.80.0
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag {

	use Method_Proxy_Trait, Tag_With_DNS_Prefetch_Trait;

	const PLACEMENT_DYNAMIC_LOW          = 'dynamic_low';
	const PLACEMENT_DYNAMIC_HIGH         = 'dynamic_high';
	const PLACEMENT_STATIC_AUTO          = 'static_auto';
	const PLACEMENT_STATIC_ABOVE_CONTENT = 'static_above-content';
	const PLACEMENT_STATIC_BELOW_CONTENT = 'static_below-content';
	const PLACEMENT_STATIC_AFTER_1ST_P   = 'static_below-first-paragraph';

	/**
	 * CTA placement.
	 *
	 * @since 1.80.0
	 * @var string
	 */
	private $cta_placement;

	/**
	 * CTA post types.
	 *
	 * @since 1.80.0
	 * @var string[]
	 */
	private $cta_post_types;

	/**
	 * Color theme.
	 *
	 * @since 1.82.0
	 * @var string
	 */
	private $color_theme;

	/**
	 * Sets the current CTA placement.
	 *
	 * @since 1.80.0
	 *
	 * @param string $cta_placement CTA placement.
	 */
	public function set_cta_placement( $cta_placement ) {
		$this->cta_placement = $cta_placement;
	}

	/**
	 * Sets the current CTA post types.
	 *
	 * @since 1.80.0
	 *
	 * @param string[] $cta_post_types CTA post types.
	 */
	public function set_cta_post_types( $cta_post_types ) {
		$this->cta_post_types = $cta_post_types;
	}

	/**
	 * Sets the color theme.
	 *
	 * @since 1.82.0
	 *
	 * @param string $color_theme Color theme.
	 */
	public function set_color_theme( $color_theme ) {
		$this->color_theme = $color_theme;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.80.0
	 */
	public function register() {
		add_action( 'wp_enqueue_scripts', $this->get_method_proxy( 'enqueue_twg_script' ) );
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
	 * This method is intended a web tag, but it does nothing in this module as the tag is enqueued.
	 *
	 * @since 1.80.0
	 */
	protected function render() {
		// Do nothing, Thank with Google script is enqueued.
	}

	/**
	 * Enqueues the "Thanks with Google" script.
	 *
	 * @since 1.80.0
	 */
	protected function enqueue_twg_script() {
		$is_singular = $this->is_singular_cta_post_type_entity();
		$is_static   = $this->has_static_cta_placement();

		$subscription = array(
			'type'              => 'Blog',
			'isPartOfType'      => array( 'Blog', 'Product' ),
			'isPartOfProductId' => $this->tag_id . ':default',
			'postTitle'         => $is_singular ? get_the_title() : '',
			'permalink'         => $is_singular ? get_permalink() : '',
			'pluginVersion'     => GOOGLESITEKIT_VERSION,
			'colorTheme'        => $this->color_theme,
			'promptSettings'    => array(
				'style' => $is_static ? 'inline' : 'floating',
			),
		);

		if ( self::PLACEMENT_DYNAMIC_LOW === $this->cta_placement ) {
			$subscription['promptSettings']['floatingPromptProminence'] = 'low';
		} elseif ( self::PLACEMENT_DYNAMIC_HIGH === $this->cta_placement ) {
			$subscription['promptSettings']['floatingPromptProminence'] = 'high';
		}

		$twg_inline_script = sprintf(
			'(self.SWG_BASIC=self.SWG_BASIC||[]).push(function(subscriptions){subscriptions.init(%s);});',
			wp_json_encode( $subscription )
		);

		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_register_script( 'google_thankjs', 'https://news.google.com/thank/js/v1/thank.js', array(), null, true );
		wp_add_inline_script( 'google_thankjs', $twg_inline_script, 'before' );

		$filter_google_thankjs = function ( $tag, $handle ) {
			if ( 'google_thankjs' !== $handle ) {
				return $tag;
			}

			return $this->add_snippet_comments( $tag );
		};

		add_filter( 'script_loader_tag', $filter_google_thankjs, 10, 2 );

		if ( $is_singular ) {
			wp_enqueue_script( 'google_thankjs' );
		}
	}

	/**
	 * Updates the content of the post.
	 *
	 * @since 1.80.0
	 *
	 * @param string $content Content of the post.
	 * @return string Content of the post.
	 */
	protected function update_the_content( $content ) {
		if ( ! $this->is_singular_cta_post_type_entity() || ! $this->has_static_cta_placement() ) {
			return $content;
		}

		$cta_placeholder = '<div class="googlesitekit-twg-wrapper" style="display: flex; align-items: center; flex-wrap: wrap; gap: 0 10px;">'
			. '<div counter-button style="height: 34px; visibility: hidden; box-sizing: content-box; padding: 12px 0; display: inline-block; overflow: hidden;"></div>'
			. '<button twg-button style="height: 42px; visibility: hidden; margin: 12px 0;"></button>'
			. '</div>';
		$cta_placeholder = $this->add_snippet_comments( $cta_placeholder );

		if ( empty( $content ) ) {
			return $cta_placeholder;
		}

		if ( in_array( $this->cta_placement, array( self::PLACEMENT_STATIC_AUTO, self::PLACEMENT_STATIC_BELOW_CONTENT ), true ) ) {
			$content = $content . $cta_placeholder;
		} elseif ( self::PLACEMENT_STATIC_ABOVE_CONTENT === $this->cta_placement ) {
			$content = $cta_placeholder . $content;
		} elseif ( self::PLACEMENT_STATIC_AFTER_1ST_P === $this->cta_placement ) {
			$content = substr_replace( $content, $cta_placeholder, strpos( $content, '</p>' ) + 4, 0 ); // strlen( '</p>' ) is 4.
		}

		return $content;
	}

	/**
	 * Checks if the current CTA placement is static.
	 *
	 * @since 1.80.0
	 *
	 * @return bool True if the current CTA placement is static.
	 */
	private function has_static_cta_placement() {
		return esc_js( substr( $this->cta_placement, 0, 7 ) === 'static_' ); // strlen( 'static_' ) is 7.
	}

	/**
	 * Determine if the current page is a singular CTA post type entry.
	 *
	 * @since 1.80.0
	 *
	 * @return bool True if the current page is a singular CTA post type entry. False otherwise.
	 */
	private function is_singular_cta_post_type_entity() {
		return is_singular( $this->cta_post_types );
	}

	/**
	 * Add snippet comments around the tag.
	 *
	 * @since 1.80.0
	 *
	 * @param string $code The tag code.
	 * @return string The tag code with snippet comments.
	 */
	private function add_snippet_comments( $code ) {
		$before = sprintf( "\n<!-- %s -->\n", esc_html__( 'Thank with Google snippet added by Site Kit', 'google-site-kit' ) );
		$after  = sprintf( "\n<!-- %s -->\n", esc_html__( 'End Thank with Google snippet added by Site Kit', 'google-site-kit' ) );
		return $before . $code . $after;
	}

}
