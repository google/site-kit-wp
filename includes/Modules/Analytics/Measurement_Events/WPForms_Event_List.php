<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Measurement_Events\WPForms_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Measurement_Events;

/**
 * Subclass that contains information for WPForms plugin
 *
 * @class WPForms_Event_List
 */
class WPForms_Event_List extends Measurement_Event_List {

	/**
	 * WPForms_Event_List constructor.
	 */
	public function __construct() {
		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'WPForms',
				'category'   => 'engagement',
				'action'     => 'form_submit',
				'selector'   => '.wpforms-submit-container button',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );
	}
}
