<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_NoticesTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Core\Email_Reporting\Email_Notice_Golink_Handler;
use Google\Site_Kit\Core\Email_Reporting\Email_Notices;
use Google\Site_Kit\Core\Email_Reporting\Notices\Analytics_Setup_Email_Notice;
use Google\Site_Kit\Core\Email_Reporting\Notices\Enable_Conversion_Events_Email_Notice;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client_Base;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Modules\Disconnected_Modules;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Prompts\Dismissed_Prompts;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_4_Settings;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Email_NoticesTest extends TestCase {

	private $context;
	private $options;
	private $authentication;
	private $modules;
	private $golinks;
	private $email_notices;
	private $conversion_tracking;
	private $manage_options_cap_filter;

	public function set_up() {
		parent::set_up();

		remove_all_actions( 'admin_action_' . Golinks::ACTION_GO );

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$options              = new Options( $this->context );
		$this->options        = $options;
		$user_options         = new User_Options( $this->context );
		$this->authentication = new Authentication( $this->context, $options, $user_options );

		$this->modules             = new Modules( $this->context, $options, $user_options, $this->authentication );
		$this->golinks             = new Golinks( $this->context );
		$this->conversion_tracking = $this->createMock( Conversion_Tracking::class );
		$this->conversion_tracking->method( 'get_active_providers' )->willReturn( array( 'mock-provider' => true ) );
		$this->email_notices = new Email_Notices(
			$this->context,
			$this->golinks,
			array(
				new Analytics_Setup_Email_Notice( $this->context, $this->modules, $this->golinks ),
				new Enable_Conversion_Events_Email_Notice(
					$this->context,
					$this->modules,
					$this->golinks,
					new Conversion_Tracking_Settings( $options ),
					$this->conversion_tracking
				),
			)
		);

		$this->manage_options_cap_filter = function ( $caps, $cap ) {
			if ( Permissions::MANAGE_OPTIONS === $cap ) {
				return array( 'manage_options' );
			}

			return $caps;
		};

		add_filter( 'map_meta_cap', $this->manage_options_cap_filter, 99, 2 );
	}

	public function tear_down() {
		unset( $_GET['to'], $_GET['notice_id'] );
		delete_option( Disconnected_Modules::OPTION );
		delete_option( Conversion_Tracking_Settings::OPTION );

		parent::tear_down();
	}

	public function test_get_header_notices__returns_analytics_setup_notice_and_tracks_impression() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		$notices = $this->email_notices->get_header_notices( $user );

		$this->assertCount( 1, $notices, 'Expected one eligible header notice.' );
		$this->assertSame( Analytics_Setup_Email_Notice::ID, $notices[0]['id'], 'Expected Analytics setup notice ID.' );
		$this->assertNotEmpty( $notices[0]['title'], 'Expected notice title to be present.' );
		$this->assertNotEmpty( $notices[0]['body'], 'Expected notice body to be present.' );
		$this->assertNotEmpty( $notices[0]['learn_more_label'], 'Expected notice learn more label to be present.' );
		$this->assertNotEmpty( $notices[0]['learn_more_url'], 'Expected notice learn more URL to be present.' );
		$this->assertNotEmpty( $notices[0]['cta_label'], 'Expected notice CTA label to be present.' );
		$this->assertStringContainsString( 'notice_id=' . Analytics_Setup_Email_Notice::ID, $notices[0]['cta_url'], 'Expected notice CTA URL to include notice_id.' );
		$this->assertStringContainsString( 'to=' . Email_Notices::GOLINK_NOTICE, $notices[0]['cta_url'], 'Expected notice CTA URL to route through golink proxy.' );

		$state = $this->get_notice_prompt_state( $user_id, Analytics_Setup_Email_Notice::DISMISSAL_SLUG );
		$this->assertNotEmpty( $state, 'Expected notice prompt state to be stored.' );
		$this->assertSame( 1, (int) $state['count'], 'Expected first impression count to be 1.' );
		$this->assertGreaterThan( time(), (int) $state['expires'], 'Expected notice impression to be temporarily dismissed after inclusion.' );
	}

	public function test_get_header_notices__does_not_return_notice_for_user_without_manage_options() {
		$user_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );
		$user    = get_user_by( 'id', $user_id );

		$notices = $this->email_notices->get_header_notices( $user );

		$this->assertSame( array(), $notices, 'Expected no notices for users that cannot manage options.' );
	}

	public function test_get_header_notices__does_not_return_notice_when_analytics_was_previously_connected() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		update_option(
			Disconnected_Modules::OPTION,
			array(
				Analytics_4::MODULE_SLUG => time(),
			)
		);

		$notices = $this->email_notices->get_header_notices( $user );

		$this->assertSame( array(), $notices, 'Expected no notices when Analytics has been disconnected previously.' );
	}

	public function test_get_header_notices__auto_dismisses_notice_after_two_impressions() {
		$user_id           = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user              = get_user_by( 'id', $user_id );
		$dismissed_prompts = new Dismissed_Prompts( new User_Options( $this->context, $user_id ) );
		$slug              = Analytics_Setup_Email_Notice::DISMISSAL_SLUG;

		$dismissed_prompts->set(
			array(
				$slug => array(
					'expires' => time() - 10,
					'count'   => 2,
				),
			)
		);

		$notices = $this->email_notices->get_header_notices( $user );
		$this->assertSame( array(), $notices, 'Expected notice to be suppressed after two impressions.' );

		$state = $this->get_notice_prompt_state( $user_id, Analytics_Setup_Email_Notice::DISMISSAL_SLUG );
		$this->assertSame( 0, (int) $state['expires'], 'Expected notice to be permanently dismissed after reaching max impressions.' );
	}

	public function test_get_header_notices__shows_notice_for_first_two_impressions_and_hides_on_third() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		$first_impression = $this->email_notices->get_header_notices( $user );

		$this->assertCount( 1, $first_impression, 'Expected notice on first impression.' );

		$hidden_while_unexpired = $this->email_notices->get_header_notices( $user );
		$this->assertSame( array(), $hidden_while_unexpired, 'Expected notice to be hidden while temporary dismissal is unexpired.' );

		$dismissed_prompts = new Dismissed_Prompts( new User_Options( $this->context, $user_id ) );
		$dismissed_prompts->set(
			array(
				Analytics_Setup_Email_Notice::DISMISSAL_SLUG => array(
					'expires' => time() - 10,
					'count'   => 1,
				),
			)
		);

		$second_impression = $this->email_notices->get_header_notices( $user );
		$third_impression  = $this->email_notices->get_header_notices( $user );

		$this->assertCount( 1, $second_impression, 'Expected notice on second impression after temporary dismissal expires.' );
		$this->assertSame( array(), $third_impression, 'Expected notice to be hidden on third impression.' );

		$state = $this->get_notice_prompt_state( $user_id, Analytics_Setup_Email_Notice::DISMISSAL_SLUG );
		$this->assertSame( 0, (int) $state['expires'], 'Expected notice to be permanently dismissed after second impression.' );
		$this->assertGreaterThanOrEqual( 2, (int) $state['count'], 'Expected notice prompt count to be at least two impressions.' );
	}

	public function test_get_section_notices__returns_enable_conversion_events_notice_when_eligible() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		$this->set_analytics_settings_connected();

		$notices = $this->email_notices->get_section_notices( $user, Enable_Conversion_Events_Email_Notice::SECTION_KEY );

		$this->assertCount( 1, $notices, 'Expected one eligible section notice.' );
		$this->assertSame( Enable_Conversion_Events_Email_Notice::ID, $notices[0]['id'], 'Expected conversion events notice ID.' );
		$this->assertStringContainsString( 'notice_id=' . Enable_Conversion_Events_Email_Notice::ID, $notices[0]['cta_url'], 'Expected section notice CTA URL to include notice_id.' );
		$this->assertStringContainsString( 'to=' . Email_Notices::GOLINK_NOTICE, $notices[0]['cta_url'], 'Expected section notice CTA URL to route through golink proxy.' );

		$state = $this->get_notice_prompt_state( $user_id, Enable_Conversion_Events_Email_Notice::DISMISSAL_SLUG );
		$this->assertSame( 1, (int) $state['count'], 'Expected first section notice impression count to be 1.' );
	}

	public function test_get_section_notices__does_not_return_notice_when_conversion_tracking_is_enabled() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		$this->set_analytics_settings_connected();
		( new Conversion_Tracking_Settings( new Options( $this->context ) ) )->set( array( 'enabled' => true ) );

		$notices = $this->email_notices->get_section_notices( $user, Enable_Conversion_Events_Email_Notice::SECTION_KEY );
		$this->assertSame( array(), $notices, 'Expected no section notice when conversion tracking is already enabled.' );
	}

	public function test_get_section_notices__does_not_return_notice_when_no_supported_conversion_provider_is_detected() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		$this->set_analytics_settings_connected();
		$conversion_tracking = $this->createMock( Conversion_Tracking::class );
		$conversion_tracking->method( 'get_active_providers' )->willReturn( array() );
		$email_notices = new Email_Notices(
			$this->context,
			$this->golinks,
			array(
				new Analytics_Setup_Email_Notice( $this->context, $this->modules, $this->golinks ),
				new Enable_Conversion_Events_Email_Notice(
					$this->context,
					$this->modules,
					$this->golinks,
					new Conversion_Tracking_Settings( $this->options ),
					$conversion_tracking
				),
			)
		);

		$notices = $email_notices->get_section_notices( $user, Enable_Conversion_Events_Email_Notice::SECTION_KEY );
		$this->assertSame( array(), $notices, 'Expected no section notice when there are no supported active conversion providers.' );
	}

	public function test_get_section_notices__auto_dismisses_notice_after_two_impressions() {
		$user_id           = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user              = get_user_by( 'id', $user_id );
		$dismissed_prompts = new Dismissed_Prompts( new User_Options( $this->context, $user_id ) );
		$slug              = Enable_Conversion_Events_Email_Notice::DISMISSAL_SLUG;

		$this->set_analytics_settings_connected();

		$dismissed_prompts->set(
			array(
				$slug => array(
					'expires' => time() - 10,
					'count'   => 2,
				),
			)
		);

		$notices = $this->email_notices->get_section_notices( $user, Enable_Conversion_Events_Email_Notice::SECTION_KEY );
		$this->assertSame( array(), $notices, 'Expected section notice to be suppressed after two impressions.' );

		$state = $this->get_notice_prompt_state( $user_id, $slug );
		$this->assertSame( 0, (int) $state['expires'], 'Expected section notice to be permanently dismissed after reaching max impressions.' );
	}

	public function test_email_notice_golink_handler__dismisses_notice_and_redirects_to_analytics_setup() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'test-token',
				'expires_in'   => HOUR_IN_SECONDS,
				'created'      => time(),
			)
		);
		( new User_Options( $this->context, $user_id ) )->set(
			OAuth_Client_Base::OPTION_AUTH_SCOPES,
			array(
				'openid',
				'https://www.googleapis.com/auth/userinfo.profile',
				'https://www.googleapis.com/auth/userinfo.email',
				Analytics_4::READONLY_SCOPE,
				Analytics_4::EDIT_SCOPE,
			)
		);

		$this->golinks->register();
		$this->golinks->register_handler(
			Email_Notices::GOLINK_NOTICE,
			new Email_Notice_Golink_Handler( $this->email_notices, $this->modules, $this->authentication )
		);

		$_GET['to']        = Email_Notices::GOLINK_NOTICE;
		$_GET['notice_id'] = Analytics_Setup_Email_Notice::ID;

		try {
			do_action( 'admin_action_' . Golinks::ACTION_GO );
			$this->fail( 'Expected RedirectException!' );
		} catch ( RedirectException $exception ) {
			$query = wp_parse_url( $exception->get_location(), PHP_URL_QUERY );
			parse_str( is_string( $query ) ? $query : '', $query_args );

			if ( Authentication::ACTION_CONNECT === $query_args['action'] ) {
				$this->assertArrayHasKey( 'redirect', $query_args, 'Expected connect URL to include redirect destination.' );

				$redirect_destination = rawurldecode( (string) $query_args['redirect'] );
				$this->assertStringContainsString( 'action=' . Golinks::ACTION_GO, $redirect_destination, 'Expected redirect destination to go through dashboard golink.' );
				$this->assertStringContainsString( 'to=dashboard', $redirect_destination, 'Expected redirect destination to use dashboard golink.' );
				$this->assertStringContainsString( 'slug=' . Analytics_4::MODULE_SLUG, $redirect_destination, 'Expected redirect destination to include Analytics module slug.' );
				$this->assertStringContainsString( 'reAuth=true', $redirect_destination, 'Expected redirect destination to include reAuth=true.' );
			} else {
				$this->assertSame( Golinks::ACTION_GO, $query_args['action'], 'Expected redirect to dashboard golink action.' );
				$this->assertSame( 'dashboard', $query_args['to'], 'Expected redirect to dashboard golink.' );
				$this->assertSame( Analytics_4::MODULE_SLUG, $query_args['slug'], 'Expected redirect to Analytics setup flow.' );
				$this->assertSame( 'true', $query_args['reAuth'], 'Expected reAuth parameter in redirect URL.' );
			}
		}

		$state = $this->get_notice_prompt_state( $user_id, Analytics_Setup_Email_Notice::DISMISSAL_SLUG );
		$this->assertSame( 0, (int) $state['expires'], 'Expected notice to be dismissed permanently on CTA click.' );
		$this->assertTrue( $this->modules->is_module_active( Analytics_4::MODULE_SLUG ), 'Expected Analytics module to be activated before redirecting to setup.' );
	}

	public function test_email_notice_golink_handler__routes_through_connect_when_reauthentication_is_required() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$authentication = new Authentication(
			$this->context,
			new Options( $this->context ),
			new User_Options( $this->context, $user_id )
		);

		$authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'test-token',
				'expires_in'   => HOUR_IN_SECONDS,
				'created'      => time(),
			)
		);
		$authentication->get_oauth_client()->set_granted_scopes( array() );

		$this->golinks->register();
		$this->golinks->register_handler(
			Email_Notices::GOLINK_NOTICE,
			new Email_Notice_Golink_Handler( $this->email_notices, $this->modules, $authentication )
		);

		$_GET['to']        = Email_Notices::GOLINK_NOTICE;
		$_GET['notice_id'] = Analytics_Setup_Email_Notice::ID;

		try {
			do_action( 'admin_action_' . Golinks::ACTION_GO );
			$this->fail( 'Expected RedirectException!' );
		} catch ( RedirectException $exception ) {
			$location = $exception->get_location();
			$query    = wp_parse_url( $location, PHP_URL_QUERY );
			parse_str( is_string( $query ) ? $query : '', $query_args );

			$this->assertSame( Authentication::ACTION_CONNECT, $query_args['action'], 'Expected redirect to connect action when reauthentication is required.' );
			$this->assertSame( 'true', $query_args['status'], 'Expected status=true in connect URL.' );
			$this->assertArrayHasKey( 'redirect', $query_args, 'Expected connect URL to include redirect destination.' );

			$redirect_destination = rawurldecode( (string) $query_args['redirect'] );
			$this->assertStringContainsString( 'action=' . Golinks::ACTION_GO, $redirect_destination, 'Expected redirect destination to use dashboard golink action.' );
			$this->assertStringContainsString( 'to=dashboard', $redirect_destination, 'Expected redirect destination to use dashboard golink.' );
			$this->assertStringContainsString( 'slug=' . Analytics_4::MODULE_SLUG, $redirect_destination, 'Expected redirect destination to include Analytics module slug.' );
			$this->assertStringContainsString( 'reAuth=true', $redirect_destination, 'Expected redirect destination to include reAuth=true.' );
		}

		$state = $this->get_notice_prompt_state( $user_id, Analytics_Setup_Email_Notice::DISMISSAL_SLUG );
		$this->assertSame( 0, (int) $state['expires'], 'Expected notice to be dismissed permanently on CTA click.' );
		$this->assertTrue( $this->modules->is_module_active( Analytics_4::MODULE_SLUG ), 'Expected Analytics module to be activated before redirecting to connect flow.' );
	}

	/**
	 * Gets persisted prompt state for a notice slug and user.
	 *
	 * @param int $user_id User ID.
	 * @param string $slug Notice dismissal slug.
	 * @return array
	 */
	private function get_notice_prompt_state( $user_id, $slug ) {
		$prompts = ( new Dismissed_Prompts( new User_Options( $this->context, $user_id ) ) )->get();

		return $prompts[ $slug ] ?? array();
	}

	/**
	 * Marks Analytics as connected for notice eligibility checks.
	 */
	private function set_analytics_settings_connected() {
		$this->options->set( Modules::OPTION_ACTIVE_MODULES, array( Analytics_4::MODULE_SLUG ) );

		$settings = new Analytics_4_Settings( $this->options );
		$settings->merge(
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);
	}
}
