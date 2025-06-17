<?php
/**
 * Module_With_Scopes_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Tests\TestCase_Context_Trait;

trait Module_With_Scopes_ContractTests {

	use TestCase_Context_Trait;

	/**
	 * @return Module_With_Scopes
	 */
	abstract protected function get_module_with_scopes();

	public function test_get_scopes() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_scopes();

		$scopes = $module->get_scopes();

		$testcase->assertIsArray( $scopes );

		// Test that anything else is only a Google scope.
		$scopes = array_diff( $scopes, array( 'openid', 'profile', 'email' ) );

		foreach ( $scopes as $scope ) {
			$testcase->assertStringStartsWith( 'https://www.googleapis.com/auth/', $scope );
		}
	}
}
