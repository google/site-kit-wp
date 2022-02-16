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
use Google\Site_Kit\Tests\FakeHttpClient;
use Google\Site_Kit\Tests\TestCase_Context_Trait;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Response;

trait Module_With_Service_Entity_ContractTests {

	use TestCase_Context_Trait;

	/**
	 * @return Module|Module_With_Service_Entity
	 */
	abstract protected function get_module_with_service_entity();

	public function test_check_service_entity_access_success() {

		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_service_entity();

		$this->setup_test_check_service_entity_access( $module, 200 );

		$testcase->assertEquals( true, $module->check_service_entity_access() );
	}

	public function test_check_service_entity_access_no_access() {

		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_service_entity();

		$this->setup_test_check_service_entity_access( $module, 403 );

		$testcase->assertEquals( false, $module->check_service_entity_access() );
	}

	public function test_check_service_entity_access_error() {

		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_service_entity();

		$this->setup_test_check_service_entity_access( $module, 401 );

		$testcase->assertWPError( $module->check_service_entity_access() );
	}

	public static function setup_test_check_service_entity_access( Module $module, $status_code ) {

		$fake_http_client = new FakeHttpClient();

		$fake_http_client->set_request_handler(
			function () use ( $status_code ) {
				return new Response( $status_code );
			}
		);

		$module->get_client()->setHttpClient( $fake_http_client );
	}

}
