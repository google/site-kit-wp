<?php
/**
 * REST_Entity_Search_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Util\REST_Entity_Search_Controller;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;
use WP_REST_Server;

class REST_Entity_Search_ControllerTest extends TestCase {

	/**
	 * Controller instance.
	 *
	 * @var REST_Entity_Search_Controller
	 */
	private $controller;

	public function set_up() {
		parent::set_up();

		$context          = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->controller = new REST_Entity_Search_Controller( $context );
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
		unset( $GLOBALS['current_user'] );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );

		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'REST routes filter should be registered.' );
	}

	public function test_unauthorized_request() {
		$this->controller->register();

		$request = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/search/data/entity-search' );
		$request->set_query_params(
			array(
				'query' => 'foo',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertNotEquals( 200, $response->get_status(), 'Unauthorized request should not return 200 status.' );
		$this->assertArrayHasKey( 'code', $data, 'Error response should contain code key.' );
		$this->assertEquals( 'rest_forbidden', $data['code'], 'Unauthorized request should return rest_forbidden error.' );
	}

	public function test_authorized_request() {
		$this->controller->register();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/search/data/entity-search' );
		$request->set_query_params(
			array(
				'query' => 'foo',
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'Authorized request should return 200 status.' );
	}

	public function test_authorized_request_without_query() {
		$this->controller->register();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/search/data/entity-search' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 400, $response->get_status(), 'Request without query should return 400 status.' );
		$this->assertArrayHasKey( 'code', $data, 'Error response should contain code key.' );
		$this->assertEquals( 'rest_missing_callback_param', $data['code'], 'Request without query should return missing callback param error.' );
	}

	public function test_post_search() {
		$this->controller->register();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$earthID = $this->factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Hello Earth',
			)
		);

		$marsID = $this->factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Hello Mars',
			)
		);

		$this->factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Howdy Jupiter',
			)
		);

		$request = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/search/data/entity-search' );
		$request->set_query_params(
			array(
				'query' => 'hello',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status(), 'Post search should return 200 status.' );
		$this->assertEquals( 2, count( $data ), 'Should find exactly 2 posts matching query.' );
		$this->assertEquals( 'post', $data[0]['type'], 'First result should be a post type.' );
		$this->assertArrayHasKey( 'title', $data[0], 'Post result should have title key.' );
		$this->assertArrayHasKey( 'url', $data[0], 'Post result should have url key.' );

		$postIDs = wp_list_pluck( $data, 'id' );

		$this->assertContains( $earthID, $postIDs, 'Search results should contain Earth post.' );
		$this->assertContains( $marsID, $postIDs, 'Search results should contain Mars post.' );
	}

	public function test_entity_search() {
		$this->controller->register();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$term = $this->factory()->term->create_and_get(
			array(
				'taxonomy' => 'category',
				'name'     => 'Test Category A',
			)
		);

		$this->factory()->term->create(
			array(
				'taxonomy' => 'category',
				'name'     => 'Test Category B',
			)
		);

		$request = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/search/data/entity-search' );
		$request->set_query_params(
			array(
				'query' => get_term_link( $term ),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status(), 'Term search should return 200 status.' );
		$this->assertEquals( 1, count( $data ), 'Should find exactly 1 term matching query.' );
		$this->assertEquals( $term->term_id, $data[0]['id'], 'Search result should match the created term ID.' );
		$this->assertEquals( 'term', $data[0]['type'], 'Search result should be a term type.' );
	}
}
