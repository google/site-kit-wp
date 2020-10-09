<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Blockable_Tags_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Trait for a module that has blockable tags.
 *
 * @since 1.18.0
 * @access private
 * @ignore
 */
trait Module_With_Blockable_Tags_Trait {

	/**
	 * Checks whether or not the tag should be blocked from rendering.
	 *
	 * @since 1.18.0
	 *
	 * @return bool
	 */
	protected function is_tag_blocked() {
		/* @var Module $this The module instance. */

		if ( $this->context->is_amp() ) {
			/**
			 * Filters whether or not the AMP tag should be blocked from rendering.
			 *
			 * @since 1.18.0
			 *
			 * @param bool $blocked Whether or not the tag output is suppressed. Default: false.
			 */
			return (bool) apply_filters( "googlesitekit_{$this->slug}_tag_amp_blocked", false );
		} else {
			/**
			 * Filters whether or not the tag should be blocked from rendering.
			 *
			 * @since 1.18.0
			 *
			 * @param bool $blocked Whether or not the tag output is suppressed. Default: false.
			 */
			return (bool) apply_filters( "googlesitekit_{$this->slug}_tag_blocked", false );
		}
	}

	/**
	 * Gets the HTML attributes for a script tag that may potentially require user consent before loading.
	 *
	 * @since 1.18.0
	 *
	 * @return string HTML attributes to add if the tag requires consent to load, or an empty string.
	 */
	protected function get_tag_block_on_consent_attribute() {
		/* @var Module $this The module instance. */

		/**
		 * Filters whether the tag requires user consent before loading.
		 *
		 * @since 1.18.0
		 *
		 * @param bool $blocked Whether or not the tag requires user consent to load. Default: false.
		 */
		if ( apply_filters( "googlesitekit_{$this->slug}_tag_block_on_consent", false ) ) {
			return ' type="text/plain" data-block-on-consent';
		}

		return '';
	}

	/**
	 * Gets the HTML attributes for an AMP tag that may potentially require user consent before loading.
	 *
	 * @since 1.18.0
	 *
	 * @return string HTML attributes to add if the tag requires consent to load, or an empty string.
	 */
	protected function get_tag_amp_block_on_consent_attribute() {
		/* @var Module $this The module instance. */

		/**
		 * Filters whether the tag requires user consent before loading.
		 *
		 * @since 1.18.0
		 *
		 * @param bool|string $blocked Whether or not the tag requires user consent to load. Alternatively, this can also be one of
		 *                             the special string values '_till_responded', '_till_accepted', or '_auto_reject'. Default: false.
		 */
		$block_on_consent = apply_filters( "googlesitekit_{$this->slug}_tag_amp_block_on_consent", false );

		if ( in_array( $block_on_consent, $this->get_allowed_amp_block_on_consent_values(), true ) ) {
			return sprintf( ' data-block-on-consent="%s"', $block_on_consent );
		}

		if ( filter_var( $block_on_consent, FILTER_VALIDATE_BOOLEAN ) ) {
			return ' data-block-on-consent';
		}

		return '';
	}

	/**
	 * Gets the list of allowed block on consent values for AMP.
	 *
	 * @see https://amp.dev/documentation/components/amp-consent/#advanced-predefined-consent-blocking-behaviors
	 *
	 * @since 1.18.0
	 *
	 * @return string[] Block on consent attribute values.
	 */
	protected function get_allowed_amp_block_on_consent_values() {
		return array(
			'_till_responded',
			'_till_accepted',
			'_auto_reject',
		);
	}
}
