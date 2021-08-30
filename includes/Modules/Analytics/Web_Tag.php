<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\Tag_With_DNS_Prefetch_Trait;

/**
 * Class for Web tag.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag implements Tag_Interface {

	use Method_Proxy_Trait, Tag_With_DNS_Prefetch_Trait;

	/**
	 * Home domain name.
	 *
	 * @since 1.24.0
	 * @var string
	 */
	private $home_domain;

	/**
	 * Whether or not to anonymize IP addresses.
	 *
	 * @since 1.24.0
	 * @var bool
	 */
	private $anonymize_ip;

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
	 * @since 1.24.0
	 *
	 * @param bool $anonymize_ip Whether to anonymize IP addresses or not.
	 */
	public function set_anonymize_ip( $anonymize_ip ) {
		$this->anonymize_ip = (bool) $anonymize_ip;
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
		add_action( 'wp_enqueue_scripts', $this->get_method_proxy( 'enqueue_gtag_script' ) );
		add_filter(
			'wp_resource_hints',
			$this->get_dns_prefetch_hints_callback( '//www.googletagmanager.com' ),
			10,
			2
		);

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
	 * Enqueues gtag script.
	 *
	 * @since 1.24.0
	 */
	protected function enqueue_gtag_script() {
		$gtag_opt = array();
		$gtag_src = 'https://www.googletagmanager.com/gtag/js?id=' . rawurlencode( $this->tag_id );

		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_enqueue_script( 'google_gtagjs', $gtag_src, false, null, false );
		wp_script_add_data( 'google_gtagjs', 'script_execution', 'async' );
		wp_add_inline_script( 'google_gtagjs', 'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}' );

		if ( ! empty( $this->home_domain ) ) {
			$gtag_opt['linker'] = array( 'domains' => array( $this->home_domain ) );
		}

		if ( $this->anonymize_ip ) {
			// See https://developers.google.com/analytics/devguides/collection/gtagjs/ip-anonymization.
			$gtag_opt['anonymize_ip'] = true;
		}

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
			$linker = wp_json_encode( $gtag_opt['linker'] );
			$linker = sprintf( "gtag('set', 'linker', %s );", $linker );
			wp_add_inline_script( 'google_gtagjs', $linker );
		}

		unset( $gtag_opt['linker'] );

		wp_add_inline_script( 'google_gtagjs', 'gtag("js", new Date());' );
		wp_add_inline_script( 'google_gtagjs', 'gtag("set", "developer_id.dZTNiMT", true);' ); // Site Kit developer ID.

		if ( empty( $gtag_opt ) ) {
			$config = sprintf( 'gtag("config", "%s");', esc_js( $this->tag_id ) );
			wp_add_inline_script( 'google_gtagjs', $config );
		} else {
			$config = sprintf( 'gtag("config", "%s", %s);', esc_js( $this->tag_id ), wp_json_encode( $gtag_opt ) );
			wp_add_inline_script( 'google_gtagjs', $config );
		}

		$this->add_inline_ads_conversion_id_config();

		$block_on_consent_attrs = $this->get_tag_blocked_on_consent_attribute();

		$filter_google_gtagjs = function ( $tag, $handle ) use ( $block_on_consent_attrs, $gtag_src ) {
			if ( 'google_gtagjs' !== $handle ) {
				return $tag;
			}

			$snippet_comment_begin = sprintf( "\n<!-- %s -->\n", esc_html__( 'Google Analytics snippet added by Site Kit', 'google-site-kit' ) );
			$snippet_comment_end   = sprintf( "\n<!-- %s -->\n", esc_html__( 'End Google Analytics snippet added by Site Kit', 'google-site-kit' ) );

			if ( $block_on_consent_attrs ) {
				$tag = str_replace(
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

			return $snippet_comment_begin . $tag . $snippet_comment_end;
		};

		add_filter( 'script_loader_tag', $filter_google_gtagjs, 10, 2 );

	}

	/**
	 * Adds an inline script to configure ads conversion tracking.
	 *
	 * @since 1.32.0
	 */
	protected function add_inline_ads_conversion_id_config() {
		if ( $this->ads_conversion_id ) {
			wp_add_inline_script(
				'google_gtagjs',
				sprintf( 'gtag("config", "%s");', esc_js( $this->ads_conversion_id ) )
			);
		}
	}

}
