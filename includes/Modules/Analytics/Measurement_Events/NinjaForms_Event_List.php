<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Measurement_Events\NinjaForms_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Measurement_Events;

/**
 * Subclass that contains information for Ninja Forms plugin
 *
 * @class NinjaForms_Event_List
 */
class NinjaForms_Event_List extends Measurement_Event_List {

	/**
	 * NinjaForms_Event_List constructor.
	 */
	public function __construct() {
		$builder = Measurement_Event::create_builder(
			array(
			'pluginName' => 'Ninja Forms',
			'category' => 'engagement',
			'action' => 'form_submit',
			'selector' => 'div.nf-field-container.submit-container [type="button"]',
			'on' => 'click',
			)
		);
		$this->add_event( $builder->build() );
	}

}
