<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\AMP_Tag
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Core\Tags\AMP_Tag as Base_AMP_Tag;

/**
 * Class for AMP tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class AMP_Tag extends Base_AMP_Tag {

	/**
	 * Home domain name.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $home_domain;

	/**
	 * Internal flag set after print_amp_gtag is invoked for the first time.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	private $did_amp_gtag = false;

	/**
	 * Sets the current home domain.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $domain Domain name.
	 */
	public function set_home_domain( $domain ) {
		$this->home_domain = $domain;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		// Which actions are run depends on the version of the AMP Plugin
		// (https://amp-wp.org/) available. Version >=1.3 exposes a
		// new, `amp_print_analytics` action.
		// For all AMP modes, AMP plugin version >=1.3.
		add_action( 'amp_print_analytics', array( $this, 'render' ) );
		// For AMP Standard and Transitional, AMP plugin version <1.3.
		add_action( 'wp_footer', array( $this, 'render' ), 20 );
		// For AMP Reader, AMP plugin version <1.3.
		add_action( 'amp_post_template_footer', array( $this, 'render' ), 20 );
		// For Web Stories plugin.
		add_action( 'web_stories_print_analytics', array( $this, 'render' ) );

		// Load amp-analytics component for AMP Reader.
		add_filter( 'amp_post_template_data', array( $this, 'amp_data_load_analytics_component' ) );

		/**
		 * Fires when the Analytics tag for AMP has been initialized.
		 *
		 * This means that the tag will be rendered in the current request.
		 * Site Kit uses `gtag.js` for its Analytics snippet.
		 *
		 * @since n.e.x.t
		 *
		 * @param string $tag_id Analytics property ID used in the tag.
		 */
		do_action( 'googlesitekit_analytics_init_tag_amp', $this->tag_id );
	}

	/**
	 * Outputs gtag <amp-analytics> tag.
	 *
	 * @since n.e.x.t
	 */
	protected function render() {
		if ( $this->did_amp_gtag ) {
			return;
		}

		$this->did_amp_gtag = true;

		$gtag_amp_opt = array(
			'optoutElementId' => '__gaOptOutExtension',
			'vars'            => array(
				'gtag_id' => $this->tag_id,
				'config'  => array(
					$this->tag_id => array(
						'groups' => 'default',
						'linker' => array(
							'domains' => array( $this->home_domain ),
						),
					),
				),
			),
		);

		/**
		 * Filters the gtag configuration options for the amp-analytics tag.
		 *
		 * You can use the {@see 'googlesitekit_gtag_opt'} filter to do the same for gtag in non-AMP.
		 *
		 * @since n.e.x.t
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

		printf(
			'<amp-analytics type="gtag" data-credentials="include"%s><script type="application/json">%s</script></amp-analytics>',
			$this->get_tag_blocked_on_consent_attribute(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			wp_json_encode( $gtag_amp_opt_filtered )
		);
	}

	/**
	 * Loads AMP analytics script if opted in.
	 *
	 * This only affects AMP Reader mode, the others are automatically covered.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $data AMP template data.
	 * @return array Filtered $data.
	 */
	public function amp_data_load_analytics_component( $data ) {
		if ( ! isset( $data['amp_component_scripts'] ) || ! is_array( $data['amp_component_scripts'] ) ) {
			$data['amp_component_scripts'] = array();
		}

		if ( ! isset( $data['amp_component_scripts']['amp-analytics'] ) ) {
			$data['amp_component_scripts']['amp-analytics'] = 'https://cdn.ampproject.org/v0/amp-analytics-0.1.js';
		}

		return $data;
	}

}
