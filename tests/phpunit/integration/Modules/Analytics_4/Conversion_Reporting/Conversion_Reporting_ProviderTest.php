<?php
/**
 * Conversion_Reporting_ProviderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Conversion_Reporting
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Conversion_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Provider;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Settings;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeEcommerceEventProvider_Active;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeLeadEventProvider_Active;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;


/**
 * @group Conversion_Reporting
 */
class Conversion_Reporting_ProviderTest extends TestCase {

	/** @var Settings */
	protected $settings;
	/** @var User_Options */
	protected $user_options;
	/** @var Analytics_4 */
	protected $analytics_4;
	/** @var Context */
	protected $context;

	public function set_up() {
		parent::set_up();

		remove_all_actions( 'load-toplevel_page_googlesitekit-dashboard' );

		$context = new Context( __FILE__ );
		$options = new Options( $context );

		$this->settings = new Settings( $options );
		$this->settings->register();

		$this->user_options = new User_Options( $context );

		$this->analytics_4 = new Analytics_4( $context, $options, $this->user_options );

		$this->context = $context;
	}

	public function test_register() {
		$provider = new Conversion_Reporting_Provider(
			$this->context,
			$this->settings,
			$this->user_options,
			$this->analytics_4
		);

		$provider->register();

		$this->assertTrue( has_action( 'load-toplevel_page_googlesitekit-dashboard' ) );
	}

	public function test_cron_callback__does_not_update_site_goals_when_no_active_providers() {
		$property_id = '123456789';
		$options     = new Options( $this->context );
		$user_id     = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$authentication = new Authentication( $this->context, $options, $this->user_options );
		$analytics_4    = new Analytics_4( $this->context, $options, $this->user_options, $authentication );

		$this->settings->merge(
			array(
				'ownerID'    => $user_id,
				'propertyID' => $property_id,
			)
		);

		$authentication->get_oauth_client()->set_granted_scopes( $analytics_4->get_scopes() );

		FakeHttp::fake_google_http_handler(
			$analytics_4->get_client(),
			function ( Request $request ) use ( $property_id ) {
				$url = parse_url( $request->getUri() );
				if ( "/v1beta/properties/{$property_id}:runReport" === $url['path'] ) {
					return new FulfilledPromise(
						new Response(
							200,
							array(),
							json_encode(
								array(
									'kind'     => 'analyticsData#runReport',
									'rowCount' => 1,
									'rows'     => array(
										array(
											'dimensionValues' => array(
												array( 'value' => 'purchase' ),
											),
										),
									),
								)
							)
						)
					);
				}
				return new FulfilledPromise( new Response( 200 ) );
			}
		);

		$analytics_4->register();

		// No providers registered — activeWidgets should not be updated.
		Conversion_Tracking::$providers = array();

		$provider = new Conversion_Reporting_Provider(
			$this->context,
			$this->settings,
			$this->user_options,
			$analytics_4
		);

		$this->invoke_cron_callback( $provider );

		$site_goals_settings = new Site_Goals_Settings( $options );
		$site_goals_settings->register();

		$this->assertEmpty( $site_goals_settings->get()['activeWidgets'], 'With no active providers, the cron callback should not add any activeWidgets.' );
	}

	public function test_cron_callback__updates_site_goals_with_ecommerce_widget() {
		$property_id = '123456789';
		$options     = new Options( $this->context );
		$user_id     = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->user_options->switch_user( $user_id );

		$authentication = new Authentication( $this->context, $options, $this->user_options );
		$analytics_4    = new Analytics_4( $this->context, $options, $this->user_options, $authentication );

		$this->settings->merge(
			array(
				'ownerID'    => $user_id,
				'propertyID' => $property_id,
			)
		);

		$authentication->get_oauth_client()->set_granted_scopes( $analytics_4->get_scopes() );

		FakeHttp::fake_google_http_handler(
			$analytics_4->get_client(),
			function ( Request $request ) use ( $property_id ) {
				$url = parse_url( $request->getUri() );
				if ( "/v1beta/properties/{$property_id}:runReport" === $url['path'] ) {
					return new FulfilledPromise(
						new Response(
							200,
							array(),
							json_encode(
								array(
									'kind'     => 'analyticsData#runReport',
									'rowCount' => 1,
									'rows'     => array(
										array(
											'dimensionValues' => array(
												array( 'value' => 'purchase' ),
											),
										),
									),
								)
							)
						)
					);
				}
				return new FulfilledPromise( new Response( 200 ) );
			}
		);

		$analytics_4->register();

		// Register active ecommerce provider.
		Conversion_Tracking::$providers = array(
			FakeEcommerceEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeEcommerceEventProvider_Active::class,
		);

		$provider = new Conversion_Reporting_Provider(
			$this->context,
			$this->settings,
			$this->user_options,
			$analytics_4
		);

		$this->invoke_cron_callback( $provider );

		$site_goals_settings = new Site_Goals_Settings( $options );
		$site_goals_settings->register();
		$active_widgets = $site_goals_settings->get()['activeWidgets'];

		$this->assertContains( 'ecommerce', $active_widgets, 'A detected ecommerce event with an active ecommerce provider should add the ecommerce widget.' );
		$this->assertNotContains( 'lead', $active_widgets, 'Without a lead provider, the lead widget should not be added.' );
	}

	public function test_cron_callback__updates_site_goals_with_lead_widget() {
		$property_id = '123456789';
		$options     = new Options( $this->context );
		$user_id     = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->user_options->switch_user( $user_id );

		$authentication = new Authentication( $this->context, $options, $this->user_options );
		$analytics_4    = new Analytics_4( $this->context, $options, $this->user_options, $authentication );

		$this->settings->merge(
			array(
				'ownerID'    => $user_id,
				'propertyID' => $property_id,
			)
		);

		$authentication->get_oauth_client()->set_granted_scopes( $analytics_4->get_scopes() );

		FakeHttp::fake_google_http_handler(
			$analytics_4->get_client(),
			function ( Request $request ) use ( $property_id ) {
				$url = parse_url( $request->getUri() );
				if ( "/v1beta/properties/{$property_id}:runReport" === $url['path'] ) {
					return new FulfilledPromise(
						new Response(
							200,
							array(),
							json_encode(
								array(
									'kind'     => 'analyticsData#runReport',
									'rowCount' => 1,
									'rows'     => array(
										array(
											'dimensionValues' => array(
												array( 'value' => 'contact' ),
											),
										),
									),
								)
							)
						)
					);
				}
				return new FulfilledPromise( new Response( 200 ) );
			}
		);

		$analytics_4->register();

		// Register active lead provider.
		Conversion_Tracking::$providers = array(
			FakeLeadEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeLeadEventProvider_Active::class,
		);

		$provider = new Conversion_Reporting_Provider(
			$this->context,
			$this->settings,
			$this->user_options,
			$analytics_4
		);

		$this->invoke_cron_callback( $provider );

		$site_goals_settings = new Site_Goals_Settings( $options );
		$site_goals_settings->register();
		$active_widgets = $site_goals_settings->get()['activeWidgets'];

		$this->assertContains( 'lead', $active_widgets, 'A detected lead event with an active lead provider should add the lead widget.' );
		$this->assertNotContains( 'ecommerce', $active_widgets, 'Without an ecommerce provider, the ecommerce widget should not be added.' );
	}

	/**
	 * Invokes the protected cron_callback method on a Conversion_Reporting_Provider instance.
	 *
	 * @param Conversion_Reporting_Provider $provider Provider instance.
	 */
	private function invoke_cron_callback( Conversion_Reporting_Provider $provider ) {
		$method = new \ReflectionMethod( $provider, 'cron_callback' );
		$method->setAccessible( true );
		$method->invoke( $provider );
	}

	public function tear_down() {
		parent::tear_down();
		Conversion_Tracking::$providers = array();
	}
}
