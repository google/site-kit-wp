<?php
/**
 * Class Google\Site_Kit\Modules\Ads\AMP_Tag
 *
 * @package   Google\Site_Kit\Modules\Ads
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

use Google\Site_Kit\Core\Modules\Tags\Module_AMP_Tag;
use Google\Site_Kit\Core\Tags\Tag_With_Linker_Interface;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\Tag_With_Linker_Trait;

/**
 * Class for AMP tag.
 *
 * @since  1.125.0
 * @access private
 * @ignore
 */
class AMP_Tag extends Module_AMP_Tag implements Tag_With_Linker_Interface {

	use Method_Proxy_Trait;
	use Tag_With_Linker_Trait;

	/**
	 * Sets the current home domain.
	 *
	 * @since 1.125.0
	 *
	 * @param string $domain Domain name.
	 */
	public function set_home_domain( $domain ) {
		$this->home_domain = $domain;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.125.0
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
		// For Web Stories plugin.
		add_action( 'web_stories_print_analytics', $render );

		// Load amp-analytics component for AMP Reader.
		$this->enqueue_amp_reader_component_script( 'amp-analytics', 'https://cdn.ampproject.org/v0/amp-analytics-0.1.js' );

		$this->do_init_tag_action();
	}

	/**
	 * Outputs gtag <amp-analytics> tag.
	 *
	 * @since 1.125.0
	 */
	protected function render() {
		$config = $this->get_tag_config();

		$gtag_amp_opt = array(
			'optoutElementId' => '__gaOptOutExtension',
			'vars'            => array(
				'gtag_id' => $this->tag_id,
				'config'  => $config,
			),
		);

		printf( "\n<!-- %s -->\n", esc_html__( 'Google Ads AMP snippet added by Site Kit', 'google-site-kit' ) );

		printf(
			'<amp-analytics type="gtag" data-credentials="include"%s><script type="application/json">%s</script></amp-analytics>',
			$this->get_tag_blocked_on_consent_attribute(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			wp_json_encode( $gtag_amp_opt )
		);

		printf( "\n<!-- %s -->\n", esc_html__( 'End Google Ads AMP snippet added by Site Kit', 'google-site-kit' ) );
	}

	/**
	 * Gets the tag config as used in the gtag data vars.
	 *
	 * @since 1.125.0
	 *
	 * @return array Tag configuration.
	 */
	protected function get_tag_config() {
		$config = array(
			$this->tag_id => array(
				'groups' => 'default',
			),
		);

		return $this->add_linker_to_tag_config( $config );
	}
}
