<?php
/**
 * Class Google\Site_Kit\Modules\Tag_Manager\AMP_Tag
 *
 * @package   Google\Site_Kit\Modules\Tag_Manager
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Tag_Manager;

use Google\Site_Kit\Core\Tags\AMP_Tag as Base_AMP_Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for AMP tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class AMP_Tag extends Base_AMP_Tag {

	use Method_Proxy_Trait;

	/**
	 * Internal flag set after print_amp_gtm is invoked for the first time.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	private $did_amp_gtm = false;

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$print_amp_gtm = $this->get_method_proxy( 'print_amp_gtm' );

		// Which actions are run depends on the version of the AMP Plugin
		// (https://amp-wp.org/) available. Version >=1.3 exposes a
		// new, `amp_print_analytics` action.
		// For all AMP modes, AMP plugin version >=1.3.
		add_action( 'amp_print_analytics', $print_amp_gtm );
		// For AMP Standard and Transitional, AMP plugin version <1.3.
		add_action( 'wp_footer', $print_amp_gtm, 20 );
		// For AMP Reader, AMP plugin version <1.3.
		add_action( 'amp_post_template_footer', $print_amp_gtm, 20 );

		// Load amp-analytics component for AMP Reader.
		$this->enqueue_amp_reader_component_script( 'amp-analytics', 'https://cdn.ampproject.org/v0/amp-analytics-0.1.js' );

		$this->do_init_tag_action();
	}

	/**
	 * Outputs Tag Manager <amp-analytics> tag.
	 *
	 * @since n.e.x.t
	 */
	private function print_amp_gtm() {
		if ( $this->did_amp_gtm ) {
			return;
		}

		$this->did_amp_gtm = true;

		// Add the optoutElementId for compatibility with our Analytics opt-out mechanism.
		// This configuration object will be merged with the configuration object returned
		// by the `config` attribute URL.
		$gtm_amp_opt = array(
			'optoutElementId' => '__gaOptOutExtension',
		);

		printf( '%s<!-- Google Tag Manager added by Site Kit -->%s', "\n", "\n" );
		printf(
			'<amp-analytics config="%s" data-credentials="include"%s><script type="application/json">%s</script></amp-analytics>',
			esc_url( 'https://www.googletagmanager.com/amp.json?id=' . rawurlencode( $this->tag_id ) ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			$this->get_tag_blocked_on_consent_attribute(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			wp_json_encode( $gtm_amp_opt )
		);
		printf( '%s<!-- End Google Tag Manager -->%s', "\n", "\n" );
	}

}
