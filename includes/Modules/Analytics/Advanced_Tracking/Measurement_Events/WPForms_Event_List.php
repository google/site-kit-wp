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
	 * WPForms_Event_List constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {
		/*$event = new Measurement_Event(
			array(
				'pluginName' => 'WPForms',
				'category'   => 'engagement',
				'action'     => 'form_submit',
				'selector'   => '.wpforms-submit-container button',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	var formId = element.closest('.wpforms-submit-container').querySelector('input[name="wpforms[id]"]').value;
	params['event_label'] = formId;
	return params;
}
CALLBACK
			,
			)
		);
		$this->add_event( $event );*/
	}

	public function register() {
		add_filter(
			'do_shortcode_tag',
			function( $output, $tag, $attr ) {
				if ( 'wpforms' == $tag ) {
					$this->collect_wpform_shortcode( $attr['id'] );
				}
				return $output;
			},
			15,
			3
		);
	}

	private function collect_wpform_shortcode( $id ) {
		$params = array();
		$params['event_category'] = 'engagement';
		$params['event_label'] = $id;
		$event = new Measurement_Event(
			array(
				'pluginName' => 'WPForms',
				'action'     => 'form_submit',
				'selector'   => '.wpforms-submit-container button',
				'on'         => 'click',
				'metadata'   => $params,
			)
		);
		$this->add_event( $event );
	}
}
