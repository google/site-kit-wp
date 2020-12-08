<?php
/**
 * Class Google\Site_Kit\Modules\Tag_Manager\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Tag_Manager
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Tag_Manager;

use Google\Site_Kit\Core\Tags\Web_Tag as Base_Web_Tag;

/**
 * Class for Web tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Web_Tag extends Base_Web_Tag {

	/**
	 * Internal flag set after print_gtm_no_js invoked for the first time.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	private $did_gtm_no_js = false;

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'wp_head', array( $this, 'render' ) );

		// For non-AMP (if `wp_body_open` supported).
		add_action( 'wp_body_open', array( $this, 'print_gtm_no_js' ), -9999 );
		// For non-AMP (as fallback).
		add_action( 'wp_footer', array( $this, 'print_gtm_no_js' ) );

		/**
		 * Fires when the Tag Manager tag has been initialized.
		 *
		 * This means that the tag will be rendered in the current request.
		 *
		 * @since n.e.x.t
		 *
		 * @param string $tag_id Tag Manager container ID used in the tag.
		 */
		do_action( 'googlesitekit_tagmanager_init_tag', $this->tag_id );
	}

	/**
	 * Outputs Tag Manager script.
	 *
	 * @since n.e.x.t
	 */
	public function render() {
		?>
<!-- Google Tag Manager added by Site Kit -->
<script<?php echo $this->get_tag_blocked_on_consent_attribute(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
( function( w, d, s, l, i ) {
	w[l] = w[l] || [];
	w[l].push( {'gtm.start': new Date().getTime(), event: 'gtm.js'} );
	var f = d.getElementsByTagName( s )[0],
		j = d.createElement( s ), dl = l != 'dataLayer' ? '&l=' + l : '';
	j.async = true;
	j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
	f.parentNode.insertBefore( j, f );
} )( window, document, 'script', 'dataLayer', '<?php echo esc_js( $this->tag_id ); ?>' );
</script>
<!-- End Google Tag Manager -->
		<?php
	}

	/**
	 * Outputs Tag Manager iframe for when the browser has JavaScript disabled.
	 *
	 * @since n.e.x.t
	 */
	public function print_gtm_no_js() {
		// Bail if this has already been run.
		if ( $this->did_gtm_no_js ) {
			return;
		}

		$this->did_gtm_no_js = true;

		// Consent-based blocking requires JS to be enabled so we need to bail here if present.
		if ( $this->get_tag_blocked_on_consent_attribute() ) {
			return;
		}

		$iframe_src = 'https://www.googletagmanager.com/ns.html?id=' . rawurlencode( $this->tag_id );

		?>
		<!-- Google Tag Manager (noscript) added by Site Kit -->
		<noscript>
			<iframe src="<?php echo esc_url( $iframe_src ); ?>" height="0" width="0" style="display:none;visibility:hidden"></iframe>
		</noscript>
		<!-- End Google Tag Manager (noscript) -->
		<?php
	}

}
