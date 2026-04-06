<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Google_Tag_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Google_Tag_Settings;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\TagManager as Google_Service_TagManager;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\Container;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Google_Tag_SettingsTest extends TestCase {

	/**
	 * Get_Google_Tag_Settings datapoint instance.
	 *
	 * @var Get_Google_Tag_Settings
	 */
	private $datapoint;

	/**
	 * Tag Manager container lookup request instance.
	 *
	 * @var Request
	 */
	private $tag_settings_request;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	public function set_up() {
		parent::set_up();

		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options         = new Options( $context );
		$user            = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options    = new User_Options( $context, $user->ID );
		$authentication  = new Authentication( $context, $options, $user_options );
		$this->analytics = new Analytics_4( $context, $options, $user_options, $authentication );

		$this->analytics->get_client()->withDefer( true );
		$service = new Google_Service_TagManager( $this->analytics->get_client() );

		$this->datapoint = new Get_Google_Tag_Settings(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
				'scopes'  => array( 'https://www.googleapis.com/auth/tagmanager.readonly' ),
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->tag_settings_request = $request;

				$container = new Container();
				$container->setAccountId( '12345' );
				$container->setContainerId( '67890' );
				$container->setTagIds( array( 'GT-ABCDEFG' ) );

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $container ) ) );
			}
		);
	}

	public function test_create_request__requires_measurement_id() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'google-tag-settings', array() );
		$response     = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Missing measurementID should return a WP_Error response.' );
		$this->assertEquals( 'missing_required_param', $response->get_error_code(), 'Missing measurementID should return missing_required_param.' );
	}

	public function test_create_request() {
		$this->tag_settings_request = null;

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'google-tag-settings',
			array(
				'measurementID' => 'G-12345',
			)
		);

		$request = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://tagmanager.googleapis.com/tagmanager/v2/accounts/containers:lookup?destinationId=G-12345',
			(string) $this->tag_settings_request->getUri(),
			'The request should be made to the correct GTM container lookup endpoint.'
		);
	}

	public function test_parse_response() {
		$container = new Container();
		$container->setAccountId( '12345' );
		$container->setContainerId( '67890' );
		$container->setTagIds( array( 'GT-ABCDEFG' ) );

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'google-tag-settings',
			array(
				'measurementID' => 'G-12345',
			)
		);

		$response = $this->datapoint->parse_response( $container, $data_request );

		$this->assertEquals( '12345', $response['googleTagAccountID'], 'The response should include the googleTagAccountID.' );
		$this->assertEquals( '67890', $response['googleTagContainerID'], 'The response should include the googleTagContainerID.' );
		$this->assertEquals( 'GT-ABCDEFG', $response['googleTagID'], 'The response should include the googleTagID.' );
	}

	public function test_parse_response__single_tag_id_returned() {
		$container = new Container();
		$container->setAccountId( '12345' );
		$container->setContainerId( '67890' );
		$container->setTagIds( array( 'G-ONLYONE' ) );

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'google-tag-settings',
			array(
				'measurementID' => 'G-ONLYONE',
			)
		);

		$response = $this->datapoint->parse_response( $container, $data_request );

		$this->assertEquals( 'G-ONLYONE', $response['googleTagID'], 'When there is only one tag ID, it should be returned.' );
	}

	public function test_parse_response__prefers_gt_prefix_over_g_prefix() {
		$container = new Container();
		$container->setAccountId( '12345' );
		$container->setContainerId( '67890' );
		$container->setTagIds( array( 'G-FIRST', 'GT-SECOND' ) );

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'google-tag-settings',
			array(
				'measurementID' => 'G-FIRST',
			)
		);

		$response = $this->datapoint->parse_response( $container, $data_request );

		$this->assertEquals( 'GT-SECOND', $response['googleTagID'], 'When multiple tag IDs exist, a GT- prefixed tag should be preferred.' );
	}

	public function test_parse_response__falls_back_to_measurement_id_match() {
		$container = new Container();
		$container->setAccountId( '12345' );
		$container->setContainerId( '67890' );
		$container->setTagIds( array( 'G-OTHER1', 'G-MEASURED' ) );

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'google-tag-settings',
			array(
				'measurementID' => 'G-MEASURED',
			)
		);

		$response = $this->datapoint->parse_response( $container, $data_request );

		$this->assertEquals( 'G-MEASURED', $response['googleTagID'], 'When no GT- tag exists but measurementID is in the list, it should be returned.' );
	}
}
