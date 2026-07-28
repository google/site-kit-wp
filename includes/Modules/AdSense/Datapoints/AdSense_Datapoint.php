<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Datapoints\AdSense_Datapoint
 *
 * @package   Google\Site_Kit\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Modules\AdSense\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Modules\AdSense;

/**
 * Base class for AdSense datapoints.
 *
 * @since 1.190.0
 * @access private
 * @ignore
 */
abstract class AdSense_Datapoint extends Datapoint {

	/**
	 * Module instance.
	 *
	 * @since 1.190.0
	 * @var AdSense
	 */
	protected $module;

	/**
	 * Constructor.
	 *
	 * @since 1.190.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		if ( isset( $definition['module'] ) ) {
			$this->module = $definition['module'];
		}
	}

	/**
	 * Gets the module instance.
	 *
	 * @since 1.190.0
	 *
	 * @return AdSense Module instance.
	 */
	protected function get_module() {
		return $this->module;
	}
}
