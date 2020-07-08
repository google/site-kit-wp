<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\NinjaForms_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Subclass that contains information for Ninja Forms plugin
 *
 * @class NinjaForms_Event_List
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
			)
		);
		$this->add_event( $event );
	}

}
