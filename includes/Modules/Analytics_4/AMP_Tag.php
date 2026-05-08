<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\AMP_Tag
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Modules\Tags\Module_AMP_Tag;
use Google\Site_Kit\Core\Tags\Tag_With_Linker_Interface;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\Tag_With_Linker_Trait;

/**
 * Class for AMP tag.
 *
 * @since  1.104.0
 * @access private
 * @ignore
 */
class AMP_Tag extends Module_AMP_Tag implements Tag_Interface, Tag_With_Linker_Interface {

	use Method_Proxy_Trait;
	use Tag_With_Linker_Trait;

	/**
	 * Custom dimensions data.
	 *
	 * @since 1.113.0
	 * @var array
	 */
	private $custom_dimensions;

	/**
	 * Sets the current home domain.
	 *
	 * @since 1.118.0
	 *
	 * @param string $domain Domain name.
	 */
	public function set_home_domain( $domain ) {
		$this->home_domain = $domain;
	}


	/**
	 * Sets custom dimensions data.
	 *
	 * @since 1.113.0
	 *
	 * @param string $custom_dimensions Custom dimensions data.
	 */
	public function set_custom_dimensions( $custom_dimensions ) {
		$this->custom_dimensions = $custom_dimensions;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.104.0
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
	 * @since 1.104.0
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

		printf( "\n<!-- %s -->\n", esc_html__( 'Google Analytics AMP snippet added by Site Kit', 'google-site-kit' ) );

		printf(
			'<amp-analytics type="gtag" data-credentials="include"%s><script type="application/json">%s</script></amp-analytics>',
			$this->get_tag_blocked_on_consent_attribute(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			wp_json_encode( $gtag_amp_opt_filtered )
		);

		printf( "\n<!-- %s -->\n", esc_html__( 'End Google Analytics AMP snippet added by Site Kit', 'google-site-kit' ) );
	}

	/**
	 * Extends gtag vars config with the GA4 tag config.
	 *
	 * @since 1.104.0
	 *
	 * @param array $opt AMP gtag config.
	 * @return array
	 */
	protected function extend_gtag_opt( $opt ) {
		$opt['vars']['config'] = array_merge(
			$opt['vars']['config'],
			$this->get_tag_config()
		);
		// `gtag_id` isn't used in a multi-destination configuration.
		// See https://developers.google.com/analytics/devguides/collection/amp-analytics/#sending_data_to_multiple_destinations.
		unset( $opt['vars']['gtag_id'] );

		return $opt;
	}

	/**
	 * Gets the tag config as used in the gtag data vars.
	 *
	 * @since 1.113.0
	 *
	 * @return array Tag configuration.
	 */
	protected function get_tag_config() {
		$config = array(
			$this->tag_id => array(
				'groups' => 'default',
			),
		);

		if ( ! empty( $this->custom_dimensions ) ) {
			$config[ $this->tag_id ] = array_merge(
				$config[ $this->tag_id ],
				$this->custom_dimensions
			);
		}

		return $this->add_linker_to_tag_config( $config );
	}
}
