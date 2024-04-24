<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Core\Tags\Tag_With_DNS_Prefetch_Trait;
use Google\Site_Kit\Core\Tags\Tag_With_Linker_Trait;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\Tag_With_Linker_Interface;

/**
 * Class for Web tag.
 *
 * @since 1.31.0
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag implements Tag_Interface, Tag_With_Linker_Interface {

	use Method_Proxy_Trait, Tag_With_DNS_Prefetch_Trait, Tag_With_Linker_Trait;

	/**
	 * Custom dimensions data.
	 *
	 * @since 1.113.0
	 * @var array
	 */
	private $custom_dimensions;

	/**
	 * Ads conversion ID.
	 *
	 * @since 1.32.0
	 * @var string
	 */
	private $ads_conversion_id;

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
	 * Gets args to use if blocked_on_consent is deprecated.
	 *
	 * @since 1.122.0
	 *
	 * @return array args to pass to apply_filters_deprecated if deprecated ($version, $replacement, $message)
	 */
	protected function get_tag_blocked_on_consent_deprecated_args() {
		return array(
			'1.122.0', // Deprecated in this version.
			'',
			__( 'Please use the Consent Mode feature instead.', 'google-site-kit' ),
		);
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.31.0
	 */
	public function register() {
		add_action( 'googlesitekit_setup_gtag', $this->get_method_proxy( 'setup_gtag' ) );

		$this->do_init_tag_action();
	}

	/**
	 * Outputs gtag snippet.
	 *
	 * @since 1.24.0
	 */
	protected function render() {
		// Do nothing, gtag script is enqueued.
	}

	/**
	 * Configures gtag script.
	 *
	 * @since 1.24.0
	 * @since 1.124.0 Renamed and refactored to use new GTag infrastructure.
	 *
	 * @param GTag $gtag GTag instance.
	 */
	protected function setup_gtag( GTag $gtag ) {
		$gtag_opt = $this->get_tag_config();

		/**
		 * Filters the gtag configuration options for the Analytics snippet.
		 *
		 * You can use the {@see 'googlesitekit_amp_gtag_opt'} filter to do the same for gtag in AMP.
		 *
		 * @since 1.24.0
		 *
		 * @see https://developers.google.com/gtagjs/devguide/configure
		 *
		 * @param array $gtag_opt gtag config options.
		 */
		$gtag_opt = apply_filters( 'googlesitekit_gtag_opt', $gtag_opt );

		if ( ! empty( $gtag_opt['linker'] ) ) {
			$gtag->add_command( 'set', array( 'linker', $gtag_opt['linker'] ) );

			unset( $gtag_opt['linker'] );
		}

		$gtag->add_tag( $this->tag_id, $gtag_opt );

		// TODO: Lift this out to the Ads module when it's ready.
		if ( $this->ads_conversion_id ) {
			$gtag->add_tag( $this->ads_conversion_id );
		}

		$filter_google_gtagjs = function ( $tag, $handle ) use ( $gtag ) {
			if ( GTag::HANDLE !== $handle ) {
				return $tag;
			}

			// Retain this comment for detection of Site Kit placed tag.
			$snippet_comment = sprintf( "\n<!-- %s -->\n", esc_html__( 'Google Analytics snippet added by Site Kit', 'google-site-kit' ) );

			$block_on_consent_attrs = $this->get_tag_blocked_on_consent_attribute();

			if ( $block_on_consent_attrs ) {
				$gtag_src = $gtag->get_gtag_src();

				$tag = $this->add_legacy_block_on_consent_attributes( $tag, $gtag_src, $block_on_consent_attrs );
			}

			return $snippet_comment . $tag;
		};

		add_filter( 'script_loader_tag', $filter_google_gtagjs, 10, 2 );
	}

	/**
	 * Gets the tag config as used in the gtag data vars.
	 *
	 * @since 1.113.0
	 *
	 * @return array Tag configuration.
	 */
	protected function get_tag_config() {
		$config = array();

		if ( ! empty( $this->custom_dimensions ) ) {
			$config = array_merge( $config, $this->custom_dimensions );
		}

		return $this->add_linker_to_tag_config( $config );
	}

	/**
	 * Adds HTML attributes to the gtag script tag to block it until user consent is granted.
	 *
	 * This mechanism for blocking the tag is deprecated and the Consent Mode feature should be used instead.
	 *
	 * @since 1.122.0
	 *
	 * @param string $tag     The script tag.
	 * @param string $gtag_src The gtag script source URL.
	 * @param string $block_on_consent_attrs The attributes to add to the script tag to block it until user consent is granted.
	 * @return string The script tag with the added attributes.
	 */
	protected function add_legacy_block_on_consent_attributes( $tag, $gtag_src, $block_on_consent_attrs ) {
		return str_replace(
			array(
				"<script src='$gtag_src'", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
					"<script src=\"$gtag_src\"", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
					"<script type='text/javascript' src='$gtag_src'", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
					"<script type=\"text/javascript\" src=\"$gtag_src\"", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
			),
			array( // `type` attribute intentionally excluded in replacements.
				"<script{$block_on_consent_attrs} src='$gtag_src'", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
					"<script{$block_on_consent_attrs} src=\"$gtag_src\"", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
					"<script{$block_on_consent_attrs} src='$gtag_src'", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
					"<script{$block_on_consent_attrs} src=\"$gtag_src\"", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
			),
			$tag
		);
	}
}
