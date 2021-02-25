<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\AMP_Tag
 *
 * @package   Google\Site_Kit\Modules\AdSense
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense;

use Google\Site_Kit\Core\Modules\Tags\Module_AMP_Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for AMP tag.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
class AMP_Tag extends Module_AMP_Tag {

	use Method_Proxy_Trait;

	/**
	 * Internal flag for whether the AdSense tag has been printed.
	 *
	 * @since 1.24.0
	 * @var bool
	 */
	private $adsense_tag_printed = false;

	/**
	 * Web Story Ad Slot ID.
	 *
	 * @since 1.27.0
	 * @var string
	 */
	private $story_ad_slot_id = '';

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.24.0
	 */
	public function register() {
		if ( is_singular( 'web-story' ) ) {
			// If Web Stories are enabled, render the auto ads code.
			add_action( 'web_stories_print_analytics', $this->get_method_proxy( 'render_story_auto_ads' ) );
		} else {
			// For AMP Reader, and AMP Native and Transitional (if `wp_body_open` supported).
			add_action( 'wp_body_open', $this->get_method_proxy( 'render' ), -9999 );
			// For AMP Reader, and AMP Native and Transitional (as fallback).
			add_filter( 'the_content', $this->get_method_proxy( 'amp_content_add_auto_ads' ) );

			// Load amp-auto-ads component for AMP Reader.
			$this->enqueue_amp_reader_component_script( 'amp-auto-ads', 'https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js' );
		}

		$this->do_init_tag_action();
	}

	/**
	 * Outputs the <amp-auto-ads> tag.
	 *
	 * @since 1.24.0
	 */
	protected function render() {
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
	 * @since 1.24.0
	 *
	 * @param string $content The page content.
	 * @return string Filtered $content.
	 */
	private function amp_content_add_auto_ads( $content ) {
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

	/**
	 * Set Web Story Ad Slot ID
	 *
	 * @since 1.27.0
	 *
	 * @param string $ad_slot_id The Ad Slot ID.
	 */
	public function set_story_ad_slot_id( $ad_slot_id ) {
		$this->story_ad_slot_id = $ad_slot_id;
	}

	/**
	 * Adds the AMP Web Story auto ads code if enabled.
	 *
	 * @since 1.27.0
	 */
	private function render_story_auto_ads() {
		$config = array(
			'ad-attributes' => array(
				'type'           => 'adsense',
				'data-ad-client' => $this->tag_id,
				'data-ad-slot'   => $this->story_ad_slot_id,
			),
		);
		printf( '<amp-story-auto-ads><script type="application/json">%s</script></amp-story-auto-ads>', wp_json_encode( $config ) );
	}
}
