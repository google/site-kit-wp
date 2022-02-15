<?php
/**
 * Module_With_Service_Entity_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Optimize;
use Google\Site_Kit\Tests\FakeHttpClient;
use Google\Site_Kit\Tests\TestCase_Context_Trait;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Response;

trait Module_With_Service_Entity_ContractTests {

	use TestCase_Context_Trait;

	/**
	 * @return Module|Module_With_Service_Entity
	 */
	abstract protected function get_module_with_service_entity();

	public function test_check_service_entity_access() {

		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_service_entity();

		$this->setup_preconditions( $module );

		$fake_http_client = new FakeHttpClient();
		$module->get_client()->setHttpClient( $fake_http_client );

		$fake_http_client->set_request_handler( $this->request_handler_success() );
		$testcase->assertEquals( true, $module->check_service_entity_access() );

		// the `check_service_entity_access` method of Optimize module will always return true.
		// This is because Optimize module does not have an api to check service entity.
		// Therefore, we can't test for the other response codes.
		if ( $module instanceof Optimize ) {
			return;
		}

		$fake_http_client->set_request_handler( $this->request_handler_forbidden() );
		$testcase->assertEquals( false, $module->check_service_entity_access() );

		$fake_http_client->set_request_handler( $this->request_handler_error() );
		$testcase->assertEquals( true, is_wp_error( $module->check_service_entity_access() ) );
	}

	protected function setup_preconditions( Module $module ) {
		if ( $module instanceof AdSense ) {
			$module->get_settings()->merge(
				array(
					'accountID' => 'pub-12345678',
				)
			);
		}

		if ( $module instanceof Analytics_4 ) {
			$module->get_settings()->merge(
				array(
					'propertyID' => '123456789',
				)
			);
		}
	}

	protected function request_handler_success() {
		return function () {
			return new Response( 200 );
		};
	}

	protected function request_handler_forbidden() {
		return function () {
			return new Response( 403 );
		};
	}

	protected function request_handler_error() {
		return function () {
			return new Response( 401 );
		};
	}

}
