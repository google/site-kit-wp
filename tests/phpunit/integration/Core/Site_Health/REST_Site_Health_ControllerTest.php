<?php
/**
 * Class Google\Site_Kit\Tests\Core\Site_Health\REST_Site_Health_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Site_Health
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Site_Health;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Site_Health\REST_Site_Health_Controller;
use Google\Site_Kit\Core\Site_Health\Tag_Placement;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class REST_Site_Health_ControllerTest extends TestCase {

	protected $controller;

	public function set_up() {
		parent::set_up();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context );
		$authentication = new Authentication( $context, $options, $user_options );
		$modules        = new Modules( $context, $options, $user_options, $authentication );
		$tag_placement  = new Tag_Placement( $modules );

		$this->controller = new REST_Site_Health_Controller( $tag_placement );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
	}
}
