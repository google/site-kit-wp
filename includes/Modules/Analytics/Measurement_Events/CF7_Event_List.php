<?php

namespace Google\Site_Kit\Modules\Analytics\Measurement_Events;

/**
 * Subclass that contains information for Contact Form 7 plugin
 *
 * @class CF7_Event_List
 */
class CF7_Event_List extends Measurement_Event_List {

	public function __construct() {
		$builder = Measurement_Event::create_builder([
			'pluginName' => 'Contact Form 7',
			'category' => 'engagement',
			'action' => 'contact_form_submit',
			'selector' => '.wpcf7-form .wpcf7-submit',
			'on' => 'click'
		]);
		$this->add_event($builder->build());
	}

}
