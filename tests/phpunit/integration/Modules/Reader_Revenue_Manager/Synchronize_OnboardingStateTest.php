<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronize_OnboardingStateTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronize_OnboardingState;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\ModulesHelperTrait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\ListPublicationsResponse;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class Synchronize_OnboardingStateTest extends TestCase {

		use Fake_Site_Connection_Trait;
		use ModulesHelperTrait;

		/**
		* @var Synchronize_OnboardingState
		*/
		protected $synchronize_onboarding_state;

		/**
		* @var Reader_Revenue_Manager
		*/
		protected $reader_revenue_manager;

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

		$this->reader_revenue_manager = new Reader_Revenue_Manager( $context, $this->options, $this->user_options, $this->authentication );
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->reader_revenue_manager->get_scopes()
		);
		$this->user_options->switch_user( 0 );
		$this->reader_revenue_manager->get_settings()->register();

		$this->reader_revenue_manager->get_settings()->merge(
			array(
				'publicationID'                     => '123456789',
				'publicationOnboardingState'        => 'ONBOARDING_ACTION_REQUIRED',
				'publicationOnboardingStateChanged' => false,
				'ownerID'                           => $user_id,
			),
		);

		$this->synchronize_onboarding_state = new Synchronize_OnboardingState( $this->reader_revenue_manager, $this->user_options );
	}

	public function fake_sync_onboarding_state() {
		$publication_id = $this->reader_revenue_manager->get_settings()->get()['publicationID'];

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( $publication_id ) {
				$url = parse_url( $request->getUri() );

				if ( '/v1/publications' === $url['path'] ) {
					$response    = new ListPublicationsResponse();
					$publication = new Publication();
					$publication->setPublicationId( $publication_id );
					$publication->setOnboardingState( 'ONBOARDING_COMPLETE' );
					$response->setPublications( array( $publication ) );

					return new Response(
						200,
						array( 'content-type' => 'application/json' ),
						json_encode( $response )
					);
				}

				return new Response( 200 );
			}
		);
	}

	public function test_register() {
		remove_all_actions( Synchronize_OnboardingState::CRON_SYNCHRONIZE_ONBOARDING_STATE );
		$this->synchronize_onboarding_state->register();

		$this->assertEquals( 10, has_action( Synchronize_OnboardingState::CRON_SYNCHRONIZE_ONBOARDING_STATE ) );
	}

	public function test_cron_synchronize_publication_data() {
		$this->fake_sync_onboarding_state();

		$this->assertTrue( $this->reader_revenue_manager->is_connected() );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->synchronize_onboarding_state->register();

		$this->assertFalse( $settings['publicationOnboardingStateChanged'] );

		do_action( Synchronize_OnboardingState::CRON_SYNCHRONIZE_ONBOARDING_STATE );
		$test_synced_at = time();

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->assertTrue( $settings['publicationOnboardingStateChanged'] );
	}

	public function test_maybe_schedule_synchronize_onboarding_state() {
		$this->assertFalse( wp_next_scheduled( Synchronize_OnboardingState::CRON_SYNCHRONIZE_ONBOARDING_STATE ) );
		$this->synchronize_onboarding_state->maybe_schedule_synchronize_onboarding_state();

		// Get cron list and check if the cron is scheduled.
		$crons       = _get_cron_array();
		$cron_exists = false;

		foreach ( $crons as $timestamp => $cron_events ) {
			foreach ( $cron_events as $event_key => $cron_event ) {
				if ( Synchronize_OnboardingState::CRON_SYNCHRONIZE_ONBOARDING_STATE === $event_key ) {
					$cron_exists = true;
					break 2;
				}
			}
		}

		$this->assertTrue( $cron_exists );
	}
}
