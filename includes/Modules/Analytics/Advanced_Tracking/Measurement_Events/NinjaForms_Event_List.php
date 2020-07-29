<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\NinjaForms_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Class for containing tracking event information for Ninja Forms plugin.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class NinjaForms_Event_List extends Measurement_Event_List {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t.
	 */
	public function register() {
		add_filter(
			'do_shortcode_tag',
			function( $output, $tag, $attr ) {
				if ( 'ninja_form' == $tag ) {
					$this->collect_ninja_form_shortcode( $attr['id'] );
				}


				return $output;
			},
			15,
			3
		);
	}

	/** Creates a new Measurement_Event object when a Ninja Forms shortcode is rendered.
	 *
	 * @since n.e.x.t.
	 *
	 * @param string $id The form's id.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function collect_ninja_form_shortcode( $id ) {
		$params                   = array();
		$params['event_category'] = 'engagement';
		$params['event_label']    = $id;
		$event                    = new Measurement_Event(
			array(
				'pluginName' => 'Ninja Forms',
				'action'     => 'form_submit',
				'selector'   => 'div.nf-field-container.submit-container [type="button"]',
				'on'         => 'click',
				'metadata'   => $params,
			)
		);
		$this->add_event( $event );
	}
}
