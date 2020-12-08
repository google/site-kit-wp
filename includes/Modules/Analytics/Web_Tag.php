<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

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
	 * Home domain name.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $home_domain;

	/**
	 * The current AMP mode.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $amp_mode;

	/**
	 * Whether or not to anonymize IP addresses.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	private $anonymize_ip = false;

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
	 * Sets the current amp mode.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $amp_mode AMP mode.
	 */
	public function set_amp_mode( $amp_mode ) {
		$this->amp_mode = $amp_mode;
	}

	/**
	 * Sets whether or not to anonymize IP addresses.
	 *
	 * @since n.e.x.t
	 *
	 * @param bool $anonymize_ip Anonymize or not.
	 */
	public function set_anonymize_ip( $anonymize_ip ) {
		$this->anonymize_ip = $anonymize_ip;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'wp_enqueue_scripts', array( $this, 'render' ) );

		/**
		 * Fires when the Analytics tag has been initialized.
		 *
		 * This means that the tag will be rendered in the current request.
		 * Site Kit uses `gtag.js` for its Analytics snippet.
		 *
		 * @since n.e.x.t
		 *
		 * @param string $tag_id Analytics property ID used in the tag.
		 */
		do_action( 'googlesitekit_analytics_init_tag', $this->tag_id );
	}

	/**
	 * Outputs gtag snippet.
	 *
	 * @since n.e.x.t
	 */
	public function render() {
		$gtag_opt = array();
		$gtag_src = 'https://www.googletagmanager.com/gtag/js?id=' . rawurldecode( $this->tag_id );

		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_enqueue_script( 'google_gtagjs', $gtag_src, false, null, false );
		wp_script_add_data( 'google_gtagjs', 'script_execution', 'async' );
		wp_add_inline_script( 'google_gtagjs', 'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}' );

		if ( $this->amp_mode ) {
			$gtag_opt['linker'] = array(
				'domains' => array( $this->home_domain ),
			);
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
		 * @since n.e.x.t
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

		$block_on_consent_attrs = $this->get_tag_blocked_on_consent_attribute();
		if ( $block_on_consent_attrs ) {
			$apply_block_on_consent_attrs = function ( $tag, $handle ) use ( $block_on_consent_attrs, $gtag_src ) {
				if ( 'google_gtagjs' !== $handle ) {
					return $tag;
				}

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
			};

			add_filter( 'script_loader_tag', $apply_block_on_consent_attrs, 10, 2 );
		}
	}

}
