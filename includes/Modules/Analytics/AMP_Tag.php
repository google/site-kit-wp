<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\AMP_Tag
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Core\Modules\Tags\Module_AMP_Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for AMP tag.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
class AMP_Tag extends Module_AMP_Tag implements Tag_Interface {

	use Method_Proxy_Trait;

	/**
	 * Home domain name.
	 *
	 * @since 1.24.0
	 * @var string
	 */
	private $home_domain;

	/**
	 * Ads conversion ID.
	 *
	 * @since 1.32.0
	 * @var string
	 */
	private $ads_conversion_id;

	/**
	 * Sets the current home domain.
	 *
	 * @since 1.24.0
	 *
	 * @param string $domain Domain name.
	 */
	public function set_home_domain( $domain ) {
		$this->home_domain = $domain;
	}

	/**
	 * Sets whether or not to anonymize IP addresses.
	 *
	 * @since 1.32.0
	 *
	 * @param bool $anonymize_ip Whether to anonymize IP addresses or not.
	 */
	public function set_anonymize_ip( $anonymize_ip ) {
		// Data from AMP documents is always IP anonymized.
		// See https://support.google.com/analytics/answer/6343176.
	}

	/**
	 * Sets the ads conversion ID.
	 *
	 * @since 1.32.0
	 *
	 * @param string $ads_conversion_id Ads ID.
	 */
	public function set_ads_conversion_id( $ads_conversion_id ) {
		$this->ads_conversion_id = $ads_conversion_id;
	}

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
		// For Web Stories plugin.
		add_action( 'web_stories_print_analytics', $render );

		// Load amp-analytics component for AMP Reader.
		$this->enqueue_amp_reader_component_script( 'amp-analytics', 'https://cdn.ampproject.org/v0/amp-analytics-0.1.js' );

		$this->do_init_tag_action();
	}

	/**
	 * Outputs gtag <amp-analytics> tag.
	 *
	 * @since 1.24.0
	 */
	protected function render() {
		$config = array(
			$this->tag_id => array(
				'groups' => 'default',
				'linker' => array(
					'domains' => array( $this->home_domain ),
				),
			),
		);

		if ( ! empty( $this->ads_conversion_id ) ) {
			$config[ $this->ads_conversion_id ] = array(
				'groups' => 'default',
			);
		}

		$gtag_amp_opt = array(
			'optoutElementId' => '__gaOptOutExtension',
			'vars'            => array(
				'gtag_id' => $this->tag_id,
				'config'  => $config,
			),
		);

		/**
		 * Filters the gtag configuration options for the amp-analytics tag.
		 *
		 * You can use the {@see 'googlesitekit_gtag_opt'} filter to do the same for gtag in non-AMP.
		 *
		 * @since 1.24.0
		 * @see https://developers.google.com/gtagjs/devguide/amp
		 *
		 * @param array $gtag_amp_opt gtag config options for AMP.
		 */
		$gtag_amp_opt_filtered = apply_filters( 'googlesitekit_amp_gtag_opt', $gtag_amp_opt );

		// Ensure gtag_id is set to the correct value.
		if ( ! is_array( $gtag_amp_opt_filtered ) ) {
			$gtag_amp_opt_filtered = $gtag_amp_opt;
		}

		if ( ! isset( $gtag_amp_opt_filtered['vars'] ) || ! is_array( $gtag_amp_opt_filtered['vars'] ) ) {
			$gtag_amp_opt_filtered['vars'] = $gtag_amp_opt['vars'];
		}

		$gtag_amp_opt_filtered['vars']['gtag_id'] = $this->tag_id;

		printf( "\n<!-- %s -->\n", esc_html__( 'Google Analytics AMP snippet added by Site Kit', 'google-site-kit' ) );

		printf(
			'<amp-analytics type="gtag" data-credentials="include"%s><script type="application/json">%s</script></amp-analytics>',
			$this->get_tag_blocked_on_consent_attribute(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			wp_json_encode( $gtag_amp_opt_filtered )
		);

		printf( "\n<!-- %s -->\n", esc_html__( 'End Google Analytics AMP snippet added by Site Kit', 'google-site-kit' ) );
	}

}
