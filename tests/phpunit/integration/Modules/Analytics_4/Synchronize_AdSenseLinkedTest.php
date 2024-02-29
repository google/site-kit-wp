<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Synchronize_AdSenseLinkedTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Synchronize_AdSenseLinked;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;
use Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse;
use Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink;
use Google\Site_Kit\Modules\AdSense\Settings as Adsense_Settings;

/**
 * @group Modules
 * @group Analytics_4
 */
class Synchronize_AdSenseLinkedTest extends TestCase {

	use Fake_Site_Connection_Trait;

	/**
	 * @var Synchronize_AdSenseLinked
	 */
	protected $synchronize_adsense_linked;

	/**
	 * @var Analytics_4
	 */
	protected $analytics_4;

	/**
	 * @var AdSense
	 */
	protected $adsense;

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

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		$context              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $context );
		$this->user_options   = new User_Options( $context, $user_id );
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
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics_4->get_scopes()
		);

		// Clear user context which was only needed for setting values for the module owner.
		$this->user_options->switch_user( 0 );

		$this->analytics_4->get_settings()->register();

		// Ensure Analytics 4 module is connected.
		$this->analytics_4->get_settings()->merge(
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'G-A1B2C3D4E5',
				'ownerID'         => $user_id,
			)
		);

		$this->synchronize_adsense_linked = new Synchronize_AdSenseLinked(
			$this->analytics_4,
			$this->user_options,
			$this->options
		);

		// Force modules to be connected.
		add_filter(
			'googlesitekit_is_module_connected',
			array(
				$this,
				'force_module_connection',
			)
		);
	}

	public function tear_down() {
		parent::tear_down();

		// Remove filter that forces modules to be connected.
		remove_filter(
			'googlesitekit_is_module_connected',
			array(
				$this,
				'force_module_connection',
			)
		);
	}

	public function force_module_connection() {
		return true;
	}

	public function fake_adsense_linked_response( $property_id ) {
		FakeHttp::fake_google_http_handler(
			$this->analytics_4->get_client(),
			function ( Request $request ) use ( $property_id ) {
				$url = parse_url( $request->getUri() );

				$property = new GoogleAnalyticsAdminV1betaProperty();
				$property->setName( "properties/{$property_id}" );

				if ( "/v1alpha/properties/{$property_id}/adSenseLinks" === $url['path'] ) {
					$mock_adSenseLink = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink();
					$mock_adSenseLink->setName( "properties/{$property_id}/adSenseLinks/{$property_id}" );
					$mock_adSenseLink->setAdClientCode( 'ca-pub-12345' );

					$response = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse();
					$response->setAdsenseLinks( array( $mock_adSenseLink ) );
					return new Response(
						200,
						array(),
						json_encode(
							$response
						)
					);
				}

				return new Response( 200 );
			}
		);
	}

	public function test_register() {
		remove_all_actions( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED );

		$this->synchronize_adsense_linked->register();

		$this->assertTrue( has_action( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED ) );
	}

	public function test_maybe_schedule_synchronize_adsense_linked() {
		remove_all_actions( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED );

		$this->synchronize_adsense_linked->maybe_schedule_synchronize_adsense_linked();

		$this->assertTrue(
			(bool) wp_next_scheduled( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED )
		);
	}

	public function test_schedule_synchronize_adsense_linked__cron_callback() {
		$property_id = '987654321';

		$this->fake_adsense_linked_response( $property_id );

		// Confirm that module is connected, as it will be needed in the cron callback.
		$this->assertTrue( $this->analytics_4->is_connected() );

		$this->synchronize_adsense_linked->register();

		$settings              = $this->analytics_4->get_settings()->get();
		$adsense_linked_status = $settings['adSenseLinked'];

		$this->assertFalse( $adsense_linked_status );

		// Set matching clientID, link status should resolve as true following this.
		( new Adsense_Settings( $this->options ) )->merge(
			array(
				'clientID' => 'ca-pub-12345',
			)
		);

		// Invoke cron callback function.
		do_action( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED );

		$settings              = $this->analytics_4->get_settings()->get();
		$adsense_linked_status = $settings['adSenseLinked'];

		// Assert that the account status is linked when clientID and adsense-linked values are identical.
		$this->assertTrue( $adsense_linked_status );

		// Set non-matching clientID, link status should resolve as true following this.
		( new Adsense_Settings( $this->options ) )->merge(
			array(
				'clientID' => 'ca-pub-54321',
			)
		);

		// Invoke cron callback function.
		do_action( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED );

		$settings              = $this->analytics_4->get_settings()->get();
		$adsense_linked_status = $settings['adSenseLinked'];
		$adsense_linked_time   = $settings['adSenseLinkedLastSyncedAt'];

		// Assert that the account status is NOT linked when clientID and adsense-linked values are identical.
		$this->assertFalse( $adsense_linked_status );

		// Assert that the updated time is the same as the current time.
		$this->assertEquals( $adsense_linked_time, time() );
	}
}
