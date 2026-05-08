<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Web_Tag
 *
 * @package   Google\Site_Kit\Modules\AdSense
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense;

use Google\Site_Kit\Core\Tags\Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\Tag_With_DNS_Prefetch_Trait;

/**
 * Class for Ad Blocking Recovery tag.
 *
 * @since 1.105.0
 * @access private
 * @ignore
 */
class Ad_Blocking_Recovery_Web_Tag extends Tag {

	use Method_Proxy_Trait;
	use Tag_With_DNS_Prefetch_Trait;

	/**
	 * Ad_Blocking_Recovery_Tag instance.
	 *
	 * @since 1.105.0
	 * @var Ad_Blocking_Recovery_Tag
	 */
	protected $ad_blocking_recovery_tag;

	/**
	 * Use Error Protection Snippet.
	 *
	 * @since 1.105.0
	 * @var bool
	 */
	protected $use_error_protection_snippet;

	/**
	 * Constructor.
	 *
	 * @since 1.105.0
	 *
	 * @param Ad_Blocking_Recovery_Tag $ad_blocking_recovery_tag Ad_Blocking_Recovery_Tag instance.
	 * @param bool                     $use_error_protection_snippet Use Error Protection Snippet.
	 */
	public function __construct( Ad_Blocking_Recovery_Tag $ad_blocking_recovery_tag, $use_error_protection_snippet ) {
		$this->ad_blocking_recovery_tag     = $ad_blocking_recovery_tag;
		$this->use_error_protection_snippet = $use_error_protection_snippet;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.105.0
	 */
	public function register() {
		add_action( 'wp_head', $this->get_method_proxy_once( 'render' ) );

		add_filter(
			'wp_resource_hints',
			$this->get_dns_prefetch_hints_callback( '//fundingchoicesmessages.google.com' ),
			10,
			2
		);
	}

	/**
	 * Outputs the AdSense script tag.
	 *
	 * @since 1.105.0
	 */
	protected function render() {
		$tags = $this->ad_blocking_recovery_tag->get();

		if ( empty( $tags['tag'] ) || empty( $tags['error_protection_code'] ) ) {
			return;
		}

		printf( "\n<!-- %s -->\n", esc_html__( 'Google AdSense Ad Blocking Recovery snippet added by Site Kit', 'google-site-kit' ) );
		echo $tags['tag']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		printf( "\n<!-- %s -->\n", esc_html__( 'End Google AdSense Ad Blocking Recovery snippet added by Site Kit', 'google-site-kit' ) );
		if ( $this->use_error_protection_snippet ) {
			printf( "\n<!-- %s -->\n", esc_html__( 'Google AdSense Ad Blocking Recovery Error Protection snippet added by Site Kit', 'google-site-kit' ) );
			echo $tags['error_protection_code']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			printf( "\n<!-- %s -->\n", esc_html__( 'End Google AdSense Ad Blocking Recovery Error Protection snippet added by Site Kit', 'google-site-kit' ) );
		}
	}
}
