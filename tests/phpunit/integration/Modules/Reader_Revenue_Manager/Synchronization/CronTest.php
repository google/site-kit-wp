<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronization\CronTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronization
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronization;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Cron;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\ListPublicationsResponse;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class CronTest extends TestCase {

	use Fake_Site_Connection_Trait;

	const CRON_HOOK = 'googlesitekit_test_cron_synchronize_rrm_data';

	/**
	 * Cron instance.
	 *
	 * @var Cron
	 */
	private $cron;

	/**
	 * Reader Revenue Manager module.
	 *
	 * @var Reader_Revenue_Manager
	 */
	private $module;

	/**
	 * Owner user ID.
	 *
	 * @var int
	 */
	private $owner_id;

	/**
	 * User ID that issued the faked publications request, if any.
	 *
	 * @var int|null
	 */
	private $request_user_id;

	public function set_up() {
		parent::set_up();

		$this->owner_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $this->owner_id );
		$authentication = new Authentication( $context, $options, $user_options );
		$this->module   = new Reader_Revenue_Manager( $context, $options, $user_options, $authentication );
		$this->cron     = new Cron( $this->module, $user_options, self::CRON_HOOK, 'publications' );

		$this->fake_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_granted_scopes( $this->module->get_scopes() );

		$options->set( Search_Console_Settings::OPTION, array( 'propertyID' => 'https://example.com' ) );
		$this->module->get_settings()->register();
		$this->module->get_settings()->merge(
			array(
				'ownerID'                    => $this->owner_id,
				'publicationID'              => 'publication-1',
				'publicationOnboardingState' => 'ONBOARDING_ACTION_REQUIRED',
			)
		);

		$user_options->switch_user( 0 );
		remove_all_actions( self::CRON_HOOK );
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}

	public function tear_down() {
		wp_clear_scheduled_hook( self::CRON_HOOK );

		parent::tear_down();
	}

	public function test_register() {
		$this->assertFalse( has_action( self::CRON_HOOK ), 'Cron callback should not be registered initially.' );

		$this->cron->register();

		$this->assertSame( 10, has_action( self::CRON_HOOK ), 'Cron callback should be registered.' );
	}

	public function test_maybe_schedule() {
		$this->cron->maybe_schedule();
		$scheduled = wp_next_scheduled( self::CRON_HOOK );

		$this->assertNotFalse( $scheduled, 'Cron should be scheduled for a connected module.' );

		$this->cron->maybe_schedule();

		$this->assertSame( $scheduled, wp_next_scheduled( self::CRON_HOOK ), 'An existing cron event should not be replaced.' );
	}

	public function test_maybe_schedule__does_not_schedule_when_disconnected() {
		$this->module->get_settings()->merge( array( 'publicationID' => '' ) );

		$this->cron->maybe_schedule();

		$this->assertFalse( wp_next_scheduled( self::CRON_HOOK ), 'Cron should not be scheduled for a disconnected module.' );
	}

	public function test_synchronize__fetches_datapoint_as_owner_and_restores_user() {
		$this->fake_publications_response();

		$this->assertTrue( $this->module->is_connected(), 'Reader Revenue Manager should be connected before running cron.' );
		$this->assertSame(
			'ONBOARDING_ACTION_REQUIRED',
			$this->module->get_settings()->get()['publicationOnboardingState'],
			'Onboarding state should not be complete before cron runs.'
		);

		$this->cron->register();
		do_action( self::CRON_HOOK );

		$this->assertSame(
			'ONBOARDING_COMPLETE',
			$this->module->get_settings()->get()['publicationOnboardingState'],
			'Onboarding state should be synchronized after cron.'
		);
		$this->assertSame( $this->owner_id, $this->request_user_id, 'Datapoint should be fetched as the module owner.' );
		$this->assertSame( 0, get_current_user_id(), 'The previous user should be restored after synchronization.' );
	}

	public function test_synchronize__does_not_fetch_datapoint_when_disconnected() {
		$this->fake_publications_response();
		$this->module->get_settings()->merge( array( 'publicationID' => '' ) );

		$this->cron->register();
		do_action( self::CRON_HOOK );

		$this->assertSame(
			'ONBOARDING_ACTION_REQUIRED',
			$this->module->get_settings()->get()['publicationOnboardingState'],
			'Onboarding state should remain unchanged for a disconnected module.'
		);
		$this->assertNull( $this->request_user_id, 'Datapoint should not be fetched for a disconnected module.' );
		$this->assertSame( 0, get_current_user_id(), 'The previous user should be restored after synchronization.' );
	}

	public function test_synchronize__does_not_fetch_datapoint_when_owner_lacks_permission() {
		$this->fake_publications_response();

		$subscriber_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		$this->module->get_settings()->merge( array( 'ownerID' => $subscriber_id ) );

		$this->cron->register();
		do_action( self::CRON_HOOK );

		$this->assertSame(
			'ONBOARDING_ACTION_REQUIRED',
			$this->module->get_settings()->get()['publicationOnboardingState'],
			'Onboarding state should remain unchanged when the owner lacks permission.'
		);
		$this->assertNull( $this->request_user_id, 'Datapoint should not be fetched when the owner lacks permission.' );
		$this->assertSame( 0, get_current_user_id(), 'The previous user should be restored after synchronization.' );
	}

	private function fake_publications_response() {
		FakeHttp::fake_google_http_handler(
			$this->module->get_client(),
			function ( Request $request ) {
				$url = parse_url( $request->getUri() );

				if ( '/v1/publications' === $url['path'] ) {
					$this->request_user_id = get_current_user_id();

					$publication = new Publication();
					$publication->setPublicationId( 'publication-1' );
					$publication->setOnboardingState( 'ONBOARDING_COMPLETE' );

					$response = new ListPublicationsResponse();
					$response->setPublications( array( $publication ) );

					return new FulfilledPromise(
						new Response(
							200,
							array(),
							wp_json_encode( $response )
						)
					);
				}

				return new FulfilledPromise( new Response( 200 ) );
			}
		);
	}
}
