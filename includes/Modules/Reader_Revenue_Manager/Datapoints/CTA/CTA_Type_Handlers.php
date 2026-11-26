<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\CTA_Type_Handlers
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA;

use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Registry of the supported CTA type handlers, shared by the CTA datapoints.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class CTA_Type_Handlers {

	/**
	 * Gets the supported CTA type handlers, keyed by CTA type.
	 *
	 * @since n.e.x.t
	 *
	 * @return CTA_Type_Handler_Interface[] CTA type handlers.
	 */
	public function get_handlers() {
		$type_handlers = array(
			new Newsletter_Signup_CTA_Type_Handler(),
		);

		if ( Feature_Flags::enabled( 'rrmSurveyCTA' ) ) {
			$type_handlers[] = new Survey_CTA_Type_Handler();
		}

		$handlers = array();

		foreach ( $type_handlers as $handler ) {
			$handlers[ $handler->get_type() ] = $handler;
		}

		return $handlers;
	}
}
