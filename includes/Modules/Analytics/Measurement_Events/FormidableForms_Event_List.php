<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Measurement_Events\FormidableForms_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Measurement_Events;

/**
 * Subclass that contains information for Formidable Forms plugin
 *
 * @class FormidableForms_Event_List
 */
class FormidableForms_Event_List extends Measurement_Event_List {

	/**
	 * FormidableForms_Event_List constructor.
	 */
	public function __construct() {
		$builder = Measurement_Event::create_builder(
			array(
			'pluginName' => 'Formidable Forms',
			'category' => 'engagement',
			'action' => 'form_submit',
			'selector' => '.frm_fields_container .frm_button_submit',
			'on' => 'click',
			)
		);
		$this->add_event( $builder->build() );
	}
}
