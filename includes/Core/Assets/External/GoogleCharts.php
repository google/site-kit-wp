<?php
/**
 * Class Google\Site_Kit\Core\Assets\External\GoogleCharts
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets\External;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;

/**
 * Class representing the Google Charts script.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class GoogleCharts extends Script {

	/**
	 * Registers the asset.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function register( Context $context ) {
		wp_register_script( // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			$this->handle,
			'https://www.gstatic.com/charts/loader.js',
			(array) $this->args['dependencies'],
			null,
			$this->args['in_footer']
		);

		wp_add_inline_script(
			$this->handle,
			'google.charts.load( "current", { packages: [ "corechart" ] } );'
		);
	}

}
