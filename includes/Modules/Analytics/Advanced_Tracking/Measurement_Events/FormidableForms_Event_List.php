<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\FormidableForms_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Class for containing tracking event information for Formidable Forms plugin.
 *
 * @since n.e.x.t.
 * @access ignore
 * @ignore
 */
final class FormidableForms_Event_List extends Measurement_Event_List {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t.
	 */
	public function register() {
		add_filter(
			'do_shortcode_tag',
			function( $output, $tag, $attr ) {
				if ( 'formidable' == $tag ) {
					$this->collect_formidable_shortcode( $attr['id'] );
				}
				return $output;
			},
			15,
			3
		);
	}

	/** Creates a new Measurement_Event object when a Formidable Forms shortcode is rendered.
	 *
	 * @since n.e.x.t.
	 *
	 * @param string $id The form's id.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function collect_formidable_shortcode( $id ) {
		$params                   = array();
		$params['event_category'] = 'engagement';
		$params['event_label']    = $id;
		$event                    = new Measurement_Event(
			array(
				'pluginName' => 'Formidable Forms',
				'action'     => 'form_submit',
				'selector'   => 'div.frm_forms[id="frm_form_' . $id . '_container"] .frm_fields_container .frm_button_submit',
				'on'         => 'click',
				'metadata'   => $params,
			)
		);
		$this->add_event( $event );
	}
}
