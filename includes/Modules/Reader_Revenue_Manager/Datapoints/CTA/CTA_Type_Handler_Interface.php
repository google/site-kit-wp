<?php
/**
 * Interface Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\CTA_Type_Handler_Interface
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA;

use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta;

/**
 * Interface for configuring a CTA model for a supported CTA type.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface CTA_Type_Handler_Interface {

	/**
	 * Gets the CTA type handled by this instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return string CTA type.
	 */
	public function get_type();

	/**
	 * Validates and applies type-specific configuration to a CTA model.
	 *
	 * @since n.e.x.t
	 *
	 * @param Cta   $cta    CTA model.
	 * @param array $config Type-specific configuration.
	 */
	public function configure_cta( Cta $cta, array $config );
}
