<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Synchronize_PropertyTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_4_Settings;
use Google\Site_Kit\Modules\Analytics\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Analytics_4\Synchronize_Property;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;

/**
 * @group Modules
 * @group Analytics_4
 */
class Synchronize_PropertyTest extends TestCase {

	use Fake_Site_Connection_Trait;

	/**
	 * @var Synchronize_Property
	 */
	protected $synchronize_property;

	/**
	 * @var Analytics_4
	 */
	protected $analytics_4;

	/**
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var Authentication
	 */
	protected $authentication;

	public function set_up() {
		parent::set_up();

		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$context              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $context );
		$this->user_options   = new User_Options( $context );
		$this->authentication = new Authentication( $context, $this->options, $this->user_options );

		// Fake a valid authentication token on the client.
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );
		$this->authentication->verification()->set( true );

		$this->fake_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$this->analytics_4 = new Analytics_4(
			$context,
			$this->options,
			$this->user_options,
			$this->authentication
		);

		$this->set_analytics_settings();

		$this->synchronize_property = new Synchronize_Property(
			$this->analytics_4,
			$this->user_options,
			$this->authentication
		);
	}

	public function set_analytics_settings() {
		// Ensure Analytics 4 module is connected
		$this->options->set(
			Analytics_4_Settings::OPTION,
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'G-A1B2C3D4E5',
			)
		);

		// Set owner ID, using base analytics settings.
		$this->options->set(
			Analytics_Settings::OPTION,
			array(
				'ownerID' => get_current_user_id(),
			)
		);
	}

	public function get_mocked_analytics_property_object( $property_id, $create_time ) {
		$property = new GoogleAnalyticsAdminV1betaProperty();
		$property->setName( "properties/{$property_id}" );
		$property->setCreateTime( $create_time );

		return $property;
	}

	public function fake_analytics_4_property_response( $property_id, $create_time ) {
		FakeHttp::fake_google_http_handler(
			$this->analytics_4->get_client(),
			function ( Request $request ) use ( $property_id, $create_time ) {
				$url = parse_url( $request->getUri() );

				$property = $this->get_mocked_analytics_property_object( $property_id, $create_time );

				if ( "/v1beta/properties/{$property_id}" === $url['path'] ) {
					return new Response(
						200,
						array(),
						json_encode(
							$property
						)
					);
				}

				return new Response( 200 );
			}
		);
	}

	public function test_register() {
		remove_all_actions( Synchronize_Property::CRON_SYNCHRONIZE_PROPERTY );

		$this->synchronize_property->register();

		$this->assertTrue( has_action( Synchronize_Property::CRON_SYNCHRONIZE_PROPERTY ) );
	}

	public function test_maybe_schedule_synchronize_property() {
		remove_all_actions( Synchronize_Property::CRON_SYNCHRONIZE_PROPERTY );

		$this->synchronize_property->maybe_schedule_synchronize_property();

		$this->assertTrue(
			(bool) wp_next_scheduled( Synchronize_Property::CRON_SYNCHRONIZE_PROPERTY )
		);
	}

	public function test_schedule_synchronize_property__cron_callback() {
		$property_id    = '987654321';
		$create_time    = '2014-10-02T15:01:23Z';
		$create_time_ms = Synchronize_Property::convert_time_to_unix_ms( $create_time );

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics_4->get_scopes()
		);

		$this->fake_analytics_4_property_response( $property_id, $create_time );

		// Confirm that module is connected, as it will be needed in the cron callback.
		$this->assertTrue( $this->analytics_4->is_connected() );

		$this->synchronize_property->register();

		$settings             = $this->analytics_4->get_settings()->get();
		$property_create_time = $settings['propertyCreateTime'];

		$this->assertNotEquals( $create_time_ms, $property_create_time );

		// Invoke cron callback function.
		do_action( Synchronize_Property::CRON_SYNCHRONIZE_PROPERTY );

		$settings             = $this->analytics_4->get_settings()->get();
		$property_create_time = $settings['propertyCreateTime'];

		// Property create time should be synced from the retrieved property object.
		$this->assertEquals( $create_time_ms, $property_create_time );
	}

	public function test_convert_time_to_unix_ms() {
		$create_time    = '2014-10-02T15:01:23Z';
		$create_time_ms = Synchronize_Property::convert_time_to_unix_ms( $create_time );

		$this->assertEquals( 1412262083000, $create_time_ms );
	}
}
