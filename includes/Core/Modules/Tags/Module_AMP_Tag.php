<?php
/**
 * Class Google\Site_Kit\Core\Modules\Tags\Module_AMP_Tag
 *
 * @package   Google\Site_Kit\Core\Tags
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules\Tags;

use Google\Site_Kit\Core\Tags\Blockable_Tag_Interface;

/**
 * Base class for AMP tag.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
abstract class Module_AMP_Tag extends Module_Tag implements Blockable_Tag_Interface {

	/**
	 * Checks whether or not the tag should be blocked from rendering.
	 *
	 * @since 1.24.0
	 *
	 * @return bool TRUE if the tag should be blocked, otherwise FALSE.
	 */
	public function is_tag_blocked() {
		/**
		 * Filters whether or not the AMP tag should be blocked from rendering.
		 *
		 * @since 1.24.0
		 *
		 * @param bool $blocked Whether or not the tag output is suppressed. Default: false.
		 */
		return (bool) apply_filters( "googlesitekit_{$this->module_slug}_tag_amp_blocked", false );
	}

	/**
	 * Gets the HTML attributes for a script tag that may potentially require user consent before loading.
	 *
	 * @since 1.24.0
	 *
	 * @return string HTML attributes to add if the tag requires consent to load, or an empty string.
	 */
	public function get_tag_blocked_on_consent_attribute() {
		// @see https://amp.dev/documentation/components/amp-consent/#advanced-predefined-consent-blocking-behaviors
		$allowed_amp_block_on_consent_values = array(
			'_till_responded',
			'_till_accepted',
			'_auto_reject',
		);

		/**
		 * Filters whether the tag requires user consent before loading.
		 *
		 * @since 1.24.0
		 *
		 * @param bool|string $blocked Whether or not the tag requires user consent to load. Alternatively, this can also be one of
		 *                             the special string values '_till_responded', '_till_accepted', or '_auto_reject'. Default: false.
		 */
		$block_on_consent = apply_filters( "googlesitekit_{$this->module_slug}_tag_amp_block_on_consent", false );
		if ( in_array( $block_on_consent, $allowed_amp_block_on_consent_values, true ) ) {
			return sprintf( ' data-block-on-consent="%s"', $block_on_consent );
		}

		if ( filter_var( $block_on_consent, FILTER_VALIDATE_BOOLEAN ) ) {
			return ' data-block-on-consent';
		}

		return '';
	}

	/**
	 * Enqueues a component script for AMP Reader.
	 *
	 * @since 1.24.0
	 *
	 * @param string $handle Script handle.
	 * @param string $src Script source URL.
	 * @return callable Hook function.
	 */
	protected function enqueue_amp_reader_component_script( $handle, $src ) {
		$component_script_hook = function( $data ) use ( $handle, $src ) {
			if ( ! isset( $data['amp_component_scripts'] ) || ! is_array( $data['amp_component_scripts'] ) ) {
				$data['amp_component_scripts'] = array();
			}

			if ( ! isset( $data['amp_component_scripts'][ $handle ] ) ) {
				$data['amp_component_scripts'][ $handle ] = $src;
			}

			return $data;
		};

		add_filter( 'amp_post_template_data', $component_script_hook );

		return $component_script_hook;
	}

	/**
	 * Fires the "googlesitekit_{module_slug}_init_tag_amp" action to let 3rd party plugins to perform required setup.
	 *
	 * @since 1.24.0
	 */
	protected function do_init_tag_action() {
		/**
		 * Fires when the tag has been initialized which means that the tag will be rendered in the current request.
		 *
		 * @since 1.24.0
		 *
		 * @param string $tag_id Tag ID.
		 */
		do_action( "googlesitekit_{$this->module_slug}_init_tag_amp", $this->tag_id );
	}

}
