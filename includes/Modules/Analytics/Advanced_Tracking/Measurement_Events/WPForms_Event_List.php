<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\WPForms_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Class for containing tracking event information for WPForms plugin.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class WPForms_Event_List extends Measurement_Event_List {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t.
	 */
	public function register() {
		add_filter(
			'do_shortcode_tag',
			function( $output, $tag, $attr ) {
				if ( 'wpforms' === $tag && ! empty( $attr['id'] ) ) {
					$this->collect_wpform_shortcode( $attr['id'] );
				}
				return $output;
			},
			10,
			3
		);
	}

	/**
	 * Creates a new Measurement_Event object when a WPForms shortcode is rendered.
	 *
	 * @since n.e.x.t.
	 *
	 * @param string $id The form's id.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function collect_wpform_shortcode( $id ) {
		$params                   = array();
		$params['event_category'] = 'engagement';
		$params['event_label']    = $id;
		$event                    = new Measurement_Event(
			array(
				'pluginName' => 'WPForms',
				'action'     => 'form_submit',
				'selector'   => '.wpforms-submit-container button#wpforms-submit-' . $id,
				'on'         => 'click',
				'metadata'   => $params,
			)
		);
		$this->add_event( $event );
	}
}
