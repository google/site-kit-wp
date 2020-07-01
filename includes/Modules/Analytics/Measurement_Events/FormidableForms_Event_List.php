<?php

namespace Google\Site_Kit\Modules\Analytics\Measurement_Events;

/**
 * Subclass that contains information for Formidable Forms plugin
 *
 * @class FormidableForms_Event_List
 */
class FormidableForms_Event_List extends Measurement_Event_List {

	public function __construct() {
		$builder = Measurement_Event::create_builder([
			'pluginName' => 'Formidable Forms',
			'category' => 'engagement',
			'action' => 'form_submit',
			'selector' => '.frm_fields_container .frm_button_submit',
			'on' => 'click'
		]);
		$this->add_event($builder->build());
	}

}
