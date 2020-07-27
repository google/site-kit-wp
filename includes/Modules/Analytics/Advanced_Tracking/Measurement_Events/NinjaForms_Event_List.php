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
	 * NinjaForms_Event_List constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {
		$event = new Measurement_Event(
			array(
				'pluginName' => 'Ninja Forms',
				'category'   => 'engagement',
				'action'     => 'form_submit',
				'selector'   => 'div.nf-field-container.submit-container [type="button"]',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	var formIdLong = element.closest('.nf-form-cont').querySelector('.nf-form-title').id;
	var formId = formIdLong.substring( 14 );
	params['event_label'] = formId;
	return params;
}
CALLBACK
			,
			)
		);
		$this->add_event( $event );
	}

}
