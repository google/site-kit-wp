<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\AMP_Tag
 *
 * @package   Google\Site_Kit\Modules\AdSense
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense;

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
		// For AMP Reader, and AMP Native and Transitional (if `wp_body_open` supported).
		add_action( 'wp_body_open', array( $this, 'render' ), -9999 );
		// For AMP Reader, and AMP Native and Transitional (as fallback).
		add_filter( 'the_content', array( $this, 'amp_content_add_auto_ads' ) );

		// Load amp-auto-ads component for AMP Reader.
		$this->enqueue_amp_reader_component_script( 'amp-auto-ads', 'https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js' );

		/**
		 * Fires when the AdSense tag for AMP has been initialized.
		 *
		 * This means that the tag will be rendered in the current request.
		 *
		 * @since n.e.x.t
		 *
		 * @param string $tag_id AdSense client ID used in the tag.
		 */
		do_action( 'googlesitekit_adsense_init_tag_amp', $this->tag_id );
	}

	/**
	 * Outputs the <amp-auto-ads> tag.
	 *
	 * @since n.e.x.t
	 */
	public function render() {
		if ( $this->adsense_tag_printed ) {
			return;
		}

		$this->adsense_tag_printed = true;

		printf(
			'<amp-auto-ads type="adsense" data-ad-client="%s"%s></amp-auto-ads>',
			esc_attr( $this->tag_id ),
			$this->get_tag_blocked_on_consent_attribute() // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);
	}

	/**
	 * Adds the AMP auto ads tag if opted in.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content The page content.
	 * @return string Filtered $content.
	 */
	public function amp_content_add_auto_ads( $content ) {
		// Only run for the primary application of the `the_content` filter.
		if ( $this->adsense_tag_printed || ! in_the_loop() ) {
			return $content;
		}

		$this->adsense_tag_printed = true;

		return sprintf(
			'<amp-auto-ads type="adsense" data-ad-client="%s"%s></amp-auto-ads> %s',
			esc_attr( $this->tag_id ),
			$this->get_tag_blocked_on_consent_attribute(),
			$content
		);
	}

}
