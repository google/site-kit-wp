<?php

namespace Google\Site_Kit\Modules\Analytics\Measurement_Events;

/**
 * Subclass that contains information for Ninja Forms plugin
 *
 * @class NinjaForms_Event_List
 */
class NinjaForms_Event_List extends Measurement_Event_List {

	public function __construct() {
		$builder = Measurement_Event::create_builder([
			'pluginName' => 'Ninja Forms',
			'category' => 'engagement',
			'action' => 'form_submit',
			'selector' => 'div.nf-field-container.submit-container [type="button"]',
			'on' => 'click'
		]);
		$this->add_event($builder->build());
	}

}
