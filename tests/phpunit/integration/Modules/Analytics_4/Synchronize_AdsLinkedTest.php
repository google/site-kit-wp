<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Synchronize_AdsLinkedTest
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
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Synchronize_AdsLinked;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\ModulesHelperTrait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaGoogleAdsLink;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListGoogleAdsLinksResponse;

/**
 * @group Modules
 * @group Analytics_4
 */
class Synchronize_AdsLinkedTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use ModulesHelperTrait;

	/**
	 * @var Synchronize_AdsLinked
	 */
	protected $synchronize_ads_linked;

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

		$this->synchronize_ads_linked = new Synchronize_AdsLinked( $this->analytics_4, $this->user_options );
	}

	protected function fake_ads_linked_response() {
		$property_id = $this->analytics_4->get_settings()->get()['propertyID'];

		FakeHttp::fake_google_http_handler(
			$this->analytics_4->get_client(),
			function ( Request $request ) use ( $property_id ) {
				$url = parse_url( $request->getUri() );

				$property = new GoogleAnalyticsAdminV1betaProperty();
				$property->setName( "properties/{$property_id}" );

				if ( "/v1beta/properties/{$property_id}/googleAdsLinks" === $url['path'] ) {
					$mock_adsLink = new GoogleAnalyticsAdminV1betaGoogleAdsLink();
					$mock_adsLink->setName( "properties/{$property_id}/googleAdsLinks/{$property_id}" );

					$response = new GoogleAnalyticsAdminV1betaListGoogleAdsLinksResponse();
					$response->setGoogleAdsLinks( array( $mock_adsLink ) );
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
		remove_all_actions( Synchronize_AdsLinked::CRON_SYNCHRONIZE_ADS_LINKED );

		$this->synchronize_ads_linked->register();

		$this->assertTrue( has_action( Synchronize_AdsLinked::CRON_SYNCHRONIZE_ADS_LINKED ) );
	}

	public function test_maybe_schedule_synchronize_ads_linked() {
		remove_all_actions( Synchronize_AdsLinked::CRON_SYNCHRONIZE_ADS_LINKED );
		$this->force_connect_modules( Analytics_4::MODULE_SLUG );

		$this->synchronize_ads_linked->maybe_schedule_synchronize_ads_linked();

		$this->assertTrue(
			(bool) wp_next_scheduled( Synchronize_AdsLinked::CRON_SYNCHRONIZE_ADS_LINKED )
		);
	}

	public function test_cron_synchronize_ads_linked_data() {
		$this->fake_ads_linked_response();

		// Confirm that module is connected, as it will be needed in the cron callback.
		$this->assertTrue( $this->analytics_4->is_connected() );

		$settings = $this->analytics_4->get_settings()->get();
		$this->synchronize_ads_linked->register();

		$this->assertFalse( $settings['adsLinked'] );

		// Invoke cron callback function.
		do_action( Synchronize_AdsLinked::CRON_SYNCHRONIZE_ADS_LINKED );
		$test_synced_at = time();

		$settings = $this->analytics_4->get_settings()->get();
		$this->assertTrue( $settings['adsLinked'] );

		// Assert that the timestamp is always updated.
		$this->assertEqualsWithDelta(
			$test_synced_at,
			$settings['adsLinkedLastSyncedAt'],
			1 // 1 second threshold to allow for micro changes at runtime.
		);
	}
}
