<?php
/**
 * Class Google\Site_Kit\Modules\Tag_Manager\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Tag_Manager
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Tag_Manager;

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\Tag_With_DNS_Prefetch_Trait;
use Google\Site_Kit\Core\Util\BC_Functions;

/**
 * Class for Web tag.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag {

	use Method_Proxy_Trait;
	use Tag_With_DNS_Prefetch_Trait;

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.24.0
	 */
	public function register() {
		$render_no_js = $this->get_method_proxy_once( 'render_no_js' );

		add_action( 'wp_head', $this->get_method_proxy( 'render' ) );
		// For non-AMP (if `wp_body_open` supported).
		add_action( 'wp_body_open', $render_no_js, -9999 );
		// For non-AMP (as fallback).
		add_action( 'wp_footer', $render_no_js );

		add_filter(
			'wp_resource_hints',
			$this->get_dns_prefetch_hints_callback( '//www.googletagmanager.com' ),
			10,
			2
		);

		$this->do_init_tag_action();
	}

	/**
	 * Outputs Tag Manager script.
	 *
	 * @since 1.24.0
	 */
	protected function render() {

		$tag_manager_inline_script = sprintf(
			"
			( function( w, d, s, l, i ) {
				w[l] = w[l] || [];
				w[l].push( {'gtm.start': new Date().getTime(), event: 'gtm.js'} );
				var f = d.getElementsByTagName( s )[0],
					j = d.createElement( s ), dl = l != 'dataLayer' ? '&l=' + l : '';
				j.async = true;
				j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
				f.parentNode.insertBefore( j, f );
			} )( window, document, 'script', 'dataLayer', '%s' );
			",
			esc_js( $this->tag_id )
		);

		$tag_manager_consent_attribute = $this->get_tag_blocked_on_consent_attribute_array();

		printf( "\n<!-- %s -->\n", esc_html__( 'Google Tag Manager snippet added by Site Kit', 'google-site-kit' ) );
		BC_Functions::wp_print_inline_script_tag( $tag_manager_inline_script, $tag_manager_consent_attribute );
		printf( "\n<!-- %s -->\n", esc_html__( 'End Google Tag Manager snippet added by Site Kit', 'google-site-kit' ) );
	}

	/**
	 * Outputs Tag Manager iframe for when the browser has JavaScript disabled.
	 *
	 * @since 1.24.0
	 */
	private function render_no_js() {
		// Consent-based blocking requires JS to be enabled so we need to bail here if present.
		if ( $this->get_tag_blocked_on_consent_attribute() ) {
			return;
		}

		$iframe_src = 'https://www.googletagmanager.com/ns.html?id=' . rawurlencode( $this->tag_id );

		?>
		<!-- <?php esc_html_e( 'Google Tag Manager (noscript) snippet added by Site Kit', 'google-site-kit' ); ?> -->
		<noscript>
			<iframe src="<?php echo esc_url( $iframe_src ); ?>" height="0" width="0" style="display:none;visibility:hidden"></iframe>
		</noscript>
		<!-- <?php esc_html_e( 'End Google Tag Manager (noscript) snippet added by Site Kit', 'google-site-kit' ); ?> -->
		<?php
	}
}
