<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\CF7_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Subclass that contains information for Contact Form 7 plugin
 *
 * @class CF7_Event_List
 */
class CF7_Event_List extends Measurement_Event_List {

	/**
	 * CF7_Event_List constructor.
	 */
	public function __construct() {
		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Contact Form 7',
				'category'   => 'engagement',
				'action'     => 'form_submit',
				'selector'   => '.wpcf7-form .wpcf7-submit',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );
	}

}
