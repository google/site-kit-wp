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
	 * Internal flag for whether the AdSense tag has been printed.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	private $adsense_tag_printed = false;

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'wp_head', array( $this, 'render' ) );

		/**
		 * Fires when the AdSense tag has been initialized.
		 *
		 * This means that the tag will be rendered in the current request.
		 *
		 * @since n.e.x.t
		 *
		 * @param string $tag_id AdSense client ID used in the tag.
		 */
		do_action( 'googlesitekit_adsense_init_tag', $this->tag_id );
	}

	/**
	 * Outputs the AdSense script tag.
	 *
	 * @since n.e.x.t
	 */
	public function render() {
		if ( $this->adsense_tag_printed ) {
			return;
		}

		$this->adsense_tag_printed = true;

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
