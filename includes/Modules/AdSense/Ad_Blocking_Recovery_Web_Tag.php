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

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\Tag_With_DNS_Prefetch_Trait;

/**
 * Class for Web tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Ad_Blocking_Recovery_Web_Tag extends Module_Web_Tag {

	use Method_Proxy_Trait, Tag_With_DNS_Prefetch_Trait;

	/**
	 * Ad_Blocking_Recovery_Tag instance.
	 *
	 * @since n.e.x.t
	 * @var Ad_Blocking_Recovery_Tag
	 */
	protected $ad_blocking_recovery_tag;

	/**
	 * Use Error Protection Snippet.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	protected $use_error_protection_snippet;


	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'wp_head', $this->get_method_proxy_once( 'render' ) );

		add_filter(
			'wp_resource_hints',
			$this->get_dns_prefetch_hints_callback( '//fundingchoicesmessages.google.com' ),
			10,
			2
		);

		$this->do_init_tag_action();
	}

	/**
	 * Outputs the AdSense script tag.
	 *
	 * @since n.e.x.t
	 */
	protected function render() {

		$ep_kses_allowed_html_tags = array(
			'script' => array(
				'async' => true,
				'src'   => true,
				'nonce' => true,
			),
		);

		$tags = $this->ad_blocking_recovery_tag->get();

		if ( empty( $tags['tag'] ) || empty( $option['error_protection_code'] ) ) {
			return;
		}

		printf( "\n<!-- %s -->\n", esc_html__( 'Google AdSense snippet added by Site Kit', 'google-site-kit' ) );
		wp_kses( $tags['tag'], $ep_kses_allowed_html_tags );
		if ( $this->use_error_protection_snippet ) {
			wp_kses( $tags['error_protection_code'], $ep_kses_allowed_html_tags );
		}
		printf( "\n<!-- %s -->\n", esc_html__( 'End Google AdSense snippet added by Site Kit', 'google-site-kit' ) );
	}

	/**
	 * Sets the Ad_Blocking_Recovery_Tag instance.
	 *
	 * @since n.e.x.t
	 *
	 * @param Ad_Blocking_Recovery_Tag $ad_blocking_recovery_tag Ad_Blocking_Recovery_Tag instance.
	 */
	public function set_ad_blocking_recovery_tag( Ad_Blocking_Recovery_Tag $ad_blocking_recovery_tag ) {
		$this->ad_blocking_recovery_tag = $ad_blocking_recovery_tag;
	}

	/**
	 * Sets Use Error Protection Snippet.
	 *
	 * @since n.e.x.t
	 *
	 * @param bool $use_error_protection_snippet Whether to use the Ad Blocking Recovery Error Protection Snippet.
	 */
	public function set_use_error_snippet( $use_error_protection_snippet ) {
		$this->use_error_protection_snippet = $use_error_protection_snippet;
	}

}
