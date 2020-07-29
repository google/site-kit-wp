<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\CF7_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Class for containing tracking event information for Contact Form 7 plugin.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class CF7_Event_List extends Measurement_Event_List {
	// TODO: Implement metadata callbacks.

	/**
	 * CF7_Event_List constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {
		$event = new Measurement_Event(
			array(
				'pluginName' => 'Contact Form 7',
				'category'   => 'engagement',
				'action'     => 'form_submit',
				'selector'   => '.wpcf7-form .wpcf7-submit',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );
	}

}
