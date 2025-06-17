<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Synchronize_AdSenseLinkedTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\AdSense\Settings as Adsense_Settings;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Synchronize_AdSenseLinked;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\ModulesHelperTrait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink;
use Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse;

/**
 * @group Modules
 * @group Analytics_4
 */
class Synchronize_AdSenseLinkedTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use ModulesHelperTrait;

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
	}

	protected function fake_adsense_linked_response( $client_id ) {
		$property_id = $this->analytics_4->get_settings()->get()['propertyID'];

		FakeHttp::fake_google_http_handler(
			$this->analytics_4->get_client(),
			function ( Request $request ) use ( $property_id, $client_id ) {
				$url = parse_url( $request->getUri() );

				$property = new GoogleAnalyticsAdminV1betaProperty();
				$property->setName( "properties/{$property_id}" );

				if ( "/v1alpha/properties/{$property_id}/adSenseLinks" === $url['path'] ) {
					$mock_adSenseLink = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink();
					$mock_adSenseLink->setName( "properties/{$property_id}/adSenseLinks/{$property_id}" );
					$mock_adSenseLink->setAdClientCode( $client_id );

					$response = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse();
					$response->setAdsenseLinks( array( $mock_adSenseLink ) );
					return new FulfilledPromise(
						new Response(
							200,
							array(),
							json_encode(
								$response
							)
						)
					);
				}

				return new FulfilledPromise( new Response( 200 ) );
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
		$this->force_connect_modules( Analytics_4::MODULE_SLUG, AdSense::MODULE_SLUG );

		$this->synchronize_adsense_linked->maybe_schedule_synchronize_adsense_linked();

		$this->assertTrue(
			(bool) wp_next_scheduled( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED )
		);
	}

	/**
	 * @dataProvider data_adsense_linked
	 * @param array $test_parameters {
	 *     Parameters for the test.
	 *
	 *     @type string $adSenseLink_clientID The client ID to be returned in the adSenseLinks response.
	 *     @type string $adSenseSettings_clientID The client ID to be set in AdSense module settings.
	 *     @type bool $expected_match Whether the two are expected to match.
	 * }
	 */
	public function test_cron_synchronize_adsense_linked_data( $test_parameters ) {
		$adsense_settings = new Adsense_Settings( $this->options );

		$this->fake_adsense_linked_response( $test_parameters['adSenseLink_clientID'] );

		// Confirm that module is connected, as it will be needed in the cron callback.
		$this->assertTrue( $this->analytics_4->is_connected() );

		$settings = $this->analytics_4->get_settings()->get();
		$this->synchronize_adsense_linked->register();

		$this->assertFalse( $settings['adSenseLinked'] );

		$adsense_settings->merge(
			array( 'clientID' => $test_parameters['adSenseSettings_clientID'] )
		);

		// Invoke cron callback function.
		do_action( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED );
		$test_synced_at = time();

		$settings = $this->analytics_4->get_settings()->get();
		// Assert that the adSenseLinked status is true when the adClientCode from AdSense
		// links data and clientID from adSense settings are identical.
		$this->assertSame( $test_parameters['expected_match'], $settings['adSenseLinked'] );

		// Assert that the timestamp is always updated.
		$this->assertEqualsWithDelta(
			$test_synced_at,
			$settings['adSenseLinkedLastSyncedAt'],
			1 // 1 second threshold to allow for micro changes at runtime.
		);
	}

	public function data_adsense_linked() {
		$client_id_alpha = 'ca-pub-12345';
		$client_id_beta  = 'ca-pub-99999';

		return array(
			'matching client ID'      => array(
				array(
					'adSenseLink_clientID'     => $client_id_alpha,
					'adSenseSettings_clientID' => $client_id_alpha,
					'expected_match'           => true,
				),
			),
			'non-matching client IDs' => array(
				array(
					'adSenseLink_clientID'     => $client_id_alpha,
					'adSenseSettings_clientID' => $client_id_beta,
					'expected_match'           => false,
				),
			),
		);
	}
}
