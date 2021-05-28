<?php
/**
 * Class Google\Site_Kit\Tests\Core\User_Surveys\REST_User_Surveys_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Surveys
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Surveys;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Tests\TestCase;

class REST_User_Surveys_ControllerTest extends TestCase {

	/**
	 * Authentication object.
	 *
	 * @var Authentication
	 */
	private $authentication;

	public function setUp() {
		parent::setUp();
		$context              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->authentication = new Authentication( $context );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );

		$controller = new REST_User_Surveys_Controller( $this->authentication );
		$controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
	}

}
