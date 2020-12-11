<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\AdSense
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense;

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for Web tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag {

	use Method_Proxy_Trait;

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	protected function register_hooks() {
		add_action( 'wp_head', $this->get_method_proxy_once( 'output_adsense_script' ) );
		$this->do_init_tag_action();
	}

	/**
	 * Outputs the AdSense script tag.
	 *
	 * @since n.e.x.t
	 */
	private function output_adsense_script() {
		// If we haven't completed the account connection yet, we still insert the AdSense tag
		// because it is required for account verification.
		printf(
			'<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"%s></script>', // // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
			$this->get_tag_blocked_on_consent_attribute() // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);

		printf(
			'<script>(adsbygoogle = window.adsbygoogle || []).push(%s);</script>',
			wp_json_encode(
				array(
					'google_ad_client'      => $this->tag_id,
					'enable_page_level_ads' => true,
					'tag_partner'           => 'site_kit',
				)
			)
		);
	}

}
