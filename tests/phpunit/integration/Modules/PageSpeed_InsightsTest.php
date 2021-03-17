<?php
/**
 * PageSpeed_InsightsTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\PageSpeed_Insights;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class PageSpeed_InsightsTest extends TestCase {
	use Module_With_Scopes_ContractTests;

	public function test_is_connected() {
		$pagespeed = new PageSpeed_Insights( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertTrue( $pagespeed->is_connected() );
	}

	public function test_get_datapoints() {
		$pagespeed = new PageSpeed_Insights( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'pagespeed',
			),
			$pagespeed->get_datapoints()
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new PageSpeed_Insights( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}
