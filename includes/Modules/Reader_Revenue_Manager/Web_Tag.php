<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Tags\Tag_With_DNS_Prefetch_Trait;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for Web tag.
 *
 * @since 1.132.0
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag {

	use Method_Proxy_Trait;
	use Tag_With_DNS_Prefetch_Trait;

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.132.0
	 */
	public function register() {
		add_action( 'wp_enqueue_scripts', $this->get_method_proxy( 'enqueue_swg_script' ) );

		add_filter(
			'script_loader_tag',
			$this->get_method_proxy( 'add_snippet_comments' ),
			10,
			2
		);

		add_filter(
			'wp_resource_hints',
			$this->get_dns_prefetch_hints_callback( '//news.google.com' ),
			10,
			2
		);

		$this->do_init_tag_action();
	}

	/**
	 * Enqueues the Reader Revenue Manager (SWG) script.
	 *
	 * @since 1.132.0
	 * @since 1.140.0 Updated to enqueue the script only on singular posts.
	 */
	protected function enqueue_swg_script() {
		$locale = str_replace( '_', '-', get_locale() );

		$subscription = array(
			'type'              => 'NewsArticle',
			'isPartOfType'      => array( 'Product' ),
			'isPartOfProductId' => $this->tag_id . ':openaccess',
			'clientOptions'     => array(
				'theme' => 'light',
				'lang'  => $locale,
			),
		);

		$json_encoded_subscription = wp_json_encode( $subscription );

		if ( ! $json_encoded_subscription ) {
			$json_encoded_subscription = 'null';
		}

		$swg_inline_script = sprintf(
			'(self.SWG_BASIC=self.SWG_BASIC||[]).push(basicSubscriptions=>{basicSubscriptions.init(%s);});',
			$json_encoded_subscription
		);

		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_register_script( 'google_swgjs', 'https://news.google.com/swg/js/v1/swg-basic.js', array(), null, true );
		wp_script_add_data( 'google_swgjs', 'strategy', 'async' );
		wp_add_inline_script( 'google_swgjs', $swg_inline_script, 'before' );

		/**
		 * Filters the post types where Reader Revenue Manager CTAs should appear.
		 *
		 * @since 1.140.0
		 *
		 * @param array $cta_post_types The array of post types.
		 */
		$cta_post_types = apply_filters(
			'googlesitekit_reader_revenue_manager_cta_post_types',
			array( 'post' )
		);

		if ( is_singular( $cta_post_types ) ) {
			wp_enqueue_script( 'google_swgjs' );
		}
	}

	/**
	 * Add snippet comments around the tag.
	 *
	 * @since 1.132.0
	 *
	 * @param string $tag    The tag.
	 * @param string $handle The script handle.
	 *
	 * @return string The tag with snippet comments.
	 */
	protected function add_snippet_comments( $tag, $handle ) {
		if ( 'google_swgjs' !== $handle ) {
			return $tag;
		}

		$before = sprintf( "\n<!-- %s -->\n", esc_html__( 'Google Reader Revenue Manager snippet added by Site Kit', 'google-site-kit' ) );
		$after  = sprintf( "\n<!-- %s -->\n", esc_html__( 'End Google Reader Revenue Manager snippet added by Site Kit', 'google-site-kit' ) );
		return $before . $tag . $after;
	}

	/**
	 * Outputs snippet.
	 *
	 * @since 1.132.0
	 */
	protected function render() {
		// Do nothing, script is enqueued.
	}
}
