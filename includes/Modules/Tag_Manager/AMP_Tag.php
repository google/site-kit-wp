<?php
/**
 * Class Google\Site_Kit\Modules\Tag_Manager\AMP_Tag
 *
 * @package   Google\Site_Kit\Modules\Tag_Manager
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Tag_Manager;

use Google\Site_Kit\Core\Modules\Tags\Module_AMP_Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for AMP tag.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
class AMP_Tag extends Module_AMP_Tag {

	use Method_Proxy_Trait;

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.24.0
	 */
	public function register() {
		$render = $this->get_method_proxy_once( 'render' );

		// Which actions are run depends on the version of the AMP Plugin
		// (https://amp-wp.org/) available. Version >=1.3 exposes a
		// new, `amp_print_analytics` action.
		// For all AMP modes, AMP plugin version >=1.3.
		add_action( 'amp_print_analytics', $render );
		// For AMP Standard and Transitional, AMP plugin version <1.3.
		add_action( 'wp_footer', $render, 20 );
		// For AMP Reader, AMP plugin version <1.3.
		add_action( 'amp_post_template_footer', $render, 20 );

		// Load amp-analytics component for AMP Reader.
		$this->enqueue_amp_reader_component_script( 'amp-analytics', 'https://cdn.ampproject.org/v0/amp-analytics-0.1.js' );

		$this->do_init_tag_action();
	}

	/**
	 * Outputs Tag Manager <amp-analytics> tag.
	 *
	 * @since 1.24.0
	 */
	protected function render() {
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
