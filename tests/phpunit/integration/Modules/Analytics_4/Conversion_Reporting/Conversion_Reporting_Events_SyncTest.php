<?php
/**
 * Conversion_Reporting_Events_SyncTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Conversion_Reporting
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Conversion_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Events_Sync;
use Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_New_Badge_Events_Sync;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Conversion_Reporting
 */
class Conversion_Reporting_Events_SyncTest extends TestCase {
	use Fake_Site_Connection_Trait;

	private $context;
	private $user;
	private $settings;
	private $analytics;
	private $new_badge_events_sync;
	private $authentication;
	private $request_handler_calls;

	/**
	 * @var Transients $transients Transients instance.
	 */
	private $transients;

	public function set_up() {
		parent::set_up();

		$this->request_handler_calls = array();

		$this->user    = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->context = $context;
		$options       = new Options( $context );
		$user_options  = new User_Options( $context, $this->user->ID );

		$this->settings = new Settings( $options );
		$this->settings->register();

		$this->transients = new Transients( $context );

		$this->authentication = new Authentication( $context, $options, $user_options );

		$this->analytics = new Analytics_4( $context, $options, $user_options, $this->authentication );

		$this->new_badge_events_sync = new Conversion_Reporting_New_Badge_Events_Sync( $this->transients );

		wp_set_current_user( $this->user->ID );
	}

	/**
	 * @dataProvider report_dimensions
	 */
	public function test_sync_detected_events( $detected_events, $report_rows ) {
		$this->setup_fake_handler_and_analytics( $report_rows );

		$event_check = $this->get_instance();
		$event_check->sync_detected_events();

		$this->assertEquals( $detected_events, $this->settings->get()['detectedEvents'] );
	}

	/**
	 * @dataProvider report_dimensions_with_new_events
	 */
	public function test_sync_newly_detected_events( $initially_saved_events, $detected_new_events, $report_rows ) {
		$this->setup_fake_handler_and_analytics( $report_rows );

		$event_check = $this->get_instance();
		$this->settings->merge(
			array(
				'detectedEvents' => $initially_saved_events,
			)
		);
		$event_check->sync_detected_events();

		$transient_detected_events = $this->transients->get( Conversion_Reporting_Events_Sync::DETECTED_EVENTS_TRANSIENT );

		$this->assertSame( $transient_detected_events, $detected_new_events );
	}

	/**
	 * @dataProvider report_dimensions_with_removed_events
	 */
	public function test_sync_detected_events_lost( $initially_saved_events, $lost_events, $report_rows ) {
		$this->setup_fake_handler_and_analytics( $report_rows );

		$event_check = $this->get_instance();
		$this->settings->merge(
			array(
				'detectedEvents' => $initially_saved_events,
			)
		);
		$event_check->sync_detected_events();

		$transient_lost_events = $this->transients->get( Conversion_Reporting_Events_Sync::LOST_EVENTS_TRANSIENT );

		$this->assertEquals( $transient_lost_events, $lost_events );
	}

	public function test_sync__newConversionEventsLastUpdateAt() {
		$this->setup_fake_handler_and_analytics(
			array(
				array(
					'dimensionValues' => array(
						array(
							'value' => 'contact',
						),
					),
				),
			)
		);

		$event_check = $this->get_instance();
		$this->settings->merge(
			array(
				'detectedEvents' => array(),
			)
		);

		$this->assertEquals( 0, $this->settings->get()['newConversionEventsLastUpdateAt'] );

		$event_check->sync_detected_events();

		$transient_detected_events = $this->transients->get( Conversion_Reporting_Events_Sync::DETECTED_EVENTS_TRANSIENT );

		$this->assertSame( $transient_detected_events, array( 'contact' ) );

		// Verify that newConversionEventsLastUpdateAt is updated.
		$this->assertEqualsWithDelta( time(), $this->settings->get()['newConversionEventsLastUpdateAt'], 2 );
	}

	public function test_sync__lostConversionEventsLastUpdateAt() {
		$this->setup_fake_handler_and_analytics(
			array(
				array(
					'dimensionValues' => array(
						array(
							'value' => 'contact',
						),
					),
				),
			)
		);

		$event_check = $this->get_instance();
		$this->settings->merge(
			array(
				'detectedEvents' => array( 'purchase' ),
			)
		);

		$this->assertEquals( 0, $this->settings->get()['lostConversionEventsLastUpdateAt'] );

		$event_check->sync_detected_events();

		$transient_lost_events = $this->transients->get( Conversion_Reporting_Events_Sync::LOST_EVENTS_TRANSIENT );

		$this->assertSame( $transient_lost_events, array( 'purchase' ) );

		// Verify that lostConversionEventsLastUpdateAt is updated.
		$this->assertEqualsWithDelta( time(), $this->settings->get()['lostConversionEventsLastUpdateAt'], 2 );
	}

	public function get_instance() {
		return new Conversion_Reporting_Events_Sync(
			$this->settings,
			$this->transients,
			$this->analytics,
			$this->new_badge_events_sync
		);
	}

	public function setup_fake_handler_and_analytics( $report_rows ) {
		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'ownerID'    => $this->user->ID,
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			$this->create_fake_http_handler( $property_id, $report_rows )
		);

		$this->analytics->register();
	}

	/**
	 * Creates a fake HTTP handler with call tracking.
	 *
	 * @param string $property_id The GA4 property ID to use.
	 */
	protected function create_fake_http_handler( $property_id, $report_rows ) {
		$this->request_handler_calls = array();

		return function ( Request $request ) use ( $property_id, $report_rows ) {
			$url    = parse_url( $request->getUri() );
			$params = json_decode( (string) $request->getBody(), true );

			$this->request_handler_calls[] = array(
				'url'    => $url,
				'params' => $params,
			);

			switch ( $url['path'] ) {
				case "/v1beta/properties/$property_id:runReport":
					// Return a mock report.
					return new Response(
						200,
						array(),
						json_encode(
							array(
								'kind'     => 'analyticsData#runReport',
								'rowCount' => 1,
								'rows'     => $report_rows,
							)
						)
					);

				default:
					return new Response( 200 );
			}
		};
	}

	public function report_dimensions() {
		return array(
			array(
				array( 'generate_lead' ),
				array(
					array(
						'dimensionValues' => array(
							array(
								'value' => 'generate_lead',
							),
						),
					),
				),
			),
			array(
				array( 'generate_lead', 'submit_lead_form' ),
				array(
					array(
						'dimensionValues' => array(
							array(
								'value' => 'generate_lead',
							),
						),
					),
					array(
						'dimensionValues' => array(
							array(
								'value' => 'submit_lead_form',
							),
						),
					),
				),
			),
			array(
				array(),
				array(),
			),
		);
	}

	public function report_dimensions_with_new_events() {
		return array(
			array(
				array( 'contact' ),
				array( 'add_to_cart' ),
				array(
					array(
						'dimensionValues' => array(
							array(
								'value' => 'add_to_cart',
							),
						),
					),
				),
			),
			array(
				array( 'add_to_cart', 'purchase' ),
				array( 'submit_lead_form' ),
				array(
					array(
						'dimensionValues' => array(
							array(
								'value' => 'submit_lead_form',
							),
						),
					),
				),
			),
			array(
				array( 'submit_lead_form' ),
				array( 'add_to_cart', 'purchase' ),
				array(
					array(
						'dimensionValues' => array(
							array(
								'value' => 'submit_lead_form',
							),
						),
					),
					array(
						'dimensionValues' => array(
							array(
								'value' => 'add_to_cart',
							),
						),
					),
					array(
						'dimensionValues' => array(
							array(
								'value' => 'purchase',
							),
						),
					),
				),
			),
			array(
				array(),
				array( 'submit_lead_form' ),
				array(
					array(
						'dimensionValues' => array(
							array(
								'value' => 'submit_lead_form',
							),
						),
					),
				),
			),
			array(
				array( 'submit_lead_form' ),
				false,
				array(
					array(
						'dimensionValues' => array(
							array(
								'value' => 'submit_lead_form',
							),
						),
					),
				),
			),
		);
	}

	public function report_dimensions_with_removed_events() {
		return array(
			array(
				array( 'generate_lead', 'add_to_cart' ),
				array( 'add_to_cart' ),
				array(
					array(
						'dimensionValues' => array(
							array(
								'value' => 'generate_lead',
							),
						),
					),
				),
			),
			array(
				array( 'purchase', 'add_to_cart', 'submit_lead_form' ),
				array( 'submit_lead_form' ),
				array(
					array(
						'dimensionValues' => array(
							array(
								'value' => 'purchase',
							),
						),
					),
					array(
						'dimensionValues' => array(
							array(
								'value' => 'add_to_cart',
							),
						),
					),
				),
			),
			array(
				array( 'generate_lead' ),
				false,
				array(
					array(
						'dimensionValues' => array(
							array(
								'value' => 'generate_lead',
							),
						),
					),
				),
			),
		);
	}
}
