<?php
/**
 * Dashboard view helper trait.
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\Analytics\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Analytics_4;

trait AnalyticsDashboardView {

	/**
	 * Sets the dashboard view to GA4 mode.
	 */
	protected function set_dashboard_view_ga4() {
		$this->set_dashboard_view( Analytics_4::DASHBOARD_VIEW );
	}

	/**
	 * Sets the dashboard view to UA mode.
	 */
	protected function set_dashboard_view_ua() {
		$this->set_dashboard_view( Analytics::DASHBOARD_VIEW );
	}

	/**
	 * Sets the GA dashboard view mode.
	 *
	 * @param string $view
	 */
	protected function set_dashboard_view( $view ) {
		( new Analytics_Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) ) )->merge(
			array( 'dashboardView' => $view )
		);
	}
}
