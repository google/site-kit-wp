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

/**
 * Class for AMP tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class AMP_Tag extends \Google\Site_Kit\Core\Tags\AMP_Tag {

	/**
	 * Internal flag set after print_amp_gtm is invoked for the first time.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	private $did_amp_gtm = false;

	/**
	 * Tag Manager container ID used in the tag.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $container_id;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $slug The module slug.
	 * @param string $container_id Tag Manager container ID used in the tag.
	 */
	public function __construct( $slug, $container_id ) {
		parent::__construct( $slug );
		$this->container_id = $container_id;
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

		// Load amp-analytics component for AMP Reader.
		add_filter( 'amp_post_template_data', array( $this, 'amp_data_load_analytics_component' ) );

		/**
		 * Fires when the Tag Manager tag for AMP has been initialized.
		 *
		 * This means that the tag will be rendered in the current request.
		 *
		 * @since 1.14.0
		 *
		 * @param string $container_id Tag Manager container ID used in the tag.
		 */
		do_action( 'googlesitekit_tagmanager_init_tag_amp', $this->container_id );
	}

	/**
	 * Renders tag output.
	 *
	 * @since n.e.x.t
	 */
	public function render() {
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
			esc_url( 'https://www.googletagmanager.com/amp.json?id=' . rawurlencode( $this->container_id ) ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			$this->get_tag_amp_block_on_consent_attribute(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			wp_json_encode( $gtm_amp_opt )
		);
		printf( '%s<!-- End Google Tag Manager -->%s', "\n", "\n" );
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
