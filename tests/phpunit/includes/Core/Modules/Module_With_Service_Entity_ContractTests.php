<?php
/**
 * Module_With_Service_Entity_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase_Context_Trait;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

trait Module_With_Service_Entity_ContractTests {

	use TestCase_Context_Trait;

	/**
	 * @return Module|Module_With_Service_Entity
	 */
	abstract protected function get_module_with_service_entity();

	/**
	 * All service entities return 403 for the permission denied error,
	 * except for Tag Manager which returns a 404.
	 */
	protected function get_service_entity_no_access_error_code() {
		return 403;
	}

	/**
	 * @group Module_With_Service_Entity
	 */
	public function test_check_service_entity_access_success() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_service_entity();

		$this->mock_service_entity_access( $module, 200 );
		$this->set_up_check_service_entity_access( $module );

		$access = $module->check_service_entity_access();

		$testcase->assertNotWPError( $access );
		$testcase->assertEquals( true, $access );
	}

	/**
	 * @group Module_With_Service_Entity
	 */
	public function test_check_service_entity_access_no_access() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_service_entity();

		$no_access_error_code = $this->get_service_entity_no_access_error_code();
		$this->mock_service_entity_access( $module, $no_access_error_code );
		$this->set_up_check_service_entity_access( $module );

		$access = $module->check_service_entity_access();

		$testcase->assertNotWPError( $access );
		$testcase->assertEquals( false, $access );
	}

	/**
	 * @group Module_With_Service_Entity
	 */
	public function test_check_service_entity_access_error() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_service_entity();

		$this->mock_service_entity_access( $module, 401 );
		$this->set_up_check_service_entity_access( $module );

		$testcase->assertWPError( $module->check_service_entity_access() );
	}

	protected function set_up_check_service_entity_access( Module $module ) {
		// Override in implementing test case class if needed.
	}

	protected function mock_service_entity_access( Module $module, $status_code ) {
		FakeHttp::fake_google_http_handler(
			$module->get_client(),
			function () use ( $status_code ) {
				return new Response( $status_code );
			}
		);
	}

}
