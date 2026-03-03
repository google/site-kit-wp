<?php
/**
 * Class Google\Site_Kit\Tests\Core\Golinks\GolinksTest
 *
 * @package   Google\Site_Kit\Tests\Core\Golinks
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Golinks;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Golinks\Dashboard_Golink_Handler;
use Google\Site_Kit\Core\Golinks\Golink_Handler_Interface;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use InvalidArgumentException;
use stdClass;
use WP_Error;
use WPDieException;

/**
 * @group Golinks
 */
class GolinksTest extends TestCase {

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Golinks instance.
	 *
	 * @var Golinks
	 */
	private $golinks;

	public function set_up() {
		parent::set_up();

		remove_all_actions( 'admin_action_' . Golinks::ACTION_GO );

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$this->golinks = new Golinks( $this->context );
		$this->golinks->register();
	}

	public function test_get_url__returns_expected_format() {
		$this->assertSame(
			add_query_arg(
				array(
					'action' => Golinks::ACTION_GO,
					'to'     => 'dashboard',
				),
				admin_url( 'index.php' )
			),
			$this->golinks->get_url( 'dashboard' ),
			'Expected registered golink URL to use the go action format.'
		);

		$this->assertSame(
			add_query_arg(
				array(
					'action' => Golinks::ACTION_GO,
					'to'     => 'unregistered',
				),
				admin_url( 'index.php' )
			),
			$this->golinks->get_url( 'unregistered' ),
			'Expected unregistered golink key to still return a go action URL.'
		);
	}

	public function test_handle_go__redirects_to_handler_destination() {
		$destination_url = admin_url( 'admin.php?page=googlesitekit-dashboard' );
		$this->golinks->register_handler( 'destination', $this->create_destination_handler( $destination_url ) );
		$_GET['to'] = 'destination';

		try {
			do_action( 'admin_action_' . Golinks::ACTION_GO );
			$this->fail( 'Expected RedirectException!' );
		} catch ( RedirectException $redirect_exception ) {
			$this->assertSame( $destination_url, $redirect_exception->get_location(), 'Expected redirect to handler destination URL.' );
			$this->assertSame( 302, $redirect_exception->get_status(), 'Expected default redirect status code.' );
		}
	}

	public function test_handle_go__dashboard_handler_forwards_deeplink_args() {
		$this->golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );
		$_GET['to']     = 'dashboard';
		$_GET['slug']   = 'analytics-4';
		$_GET['reAuth'] = 'true';

		try {
			do_action( 'admin_action_' . Golinks::ACTION_GO );
			$this->fail( 'Expected RedirectException!' );
		} catch ( RedirectException $redirect_exception ) {
			$query = wp_parse_url( $redirect_exception->get_location(), PHP_URL_QUERY );
			parse_str( $query, $query_args );

			$this->assertSame( 'googlesitekit-dashboard', $query_args['page'], 'Expected redirect to dashboard page.' );
			$this->assertSame( 'analytics-4', $query_args['slug'], 'Expected slug query arg to be forwarded.' );
			$this->assertSame( 'true', $query_args['reAuth'], 'Expected reAuth query arg to be forwarded.' );
		}
	}

	public function test_handle_go__dies_with_404_and_dashboard_link_for_invalid_key() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$_GET['to']               = 'invalid-key';
		$grant_view_dashboard_cap = function ( $caps, $cap ) {
			if ( Permissions::VIEW_DASHBOARD === $cap ) {
				return array();
			}

			return $caps;
		};
		add_filter( 'map_meta_cap', $grant_view_dashboard_cap, 20, 4 );
		$wp_die_handler_spy = $this->spy_on_wp_die_handler();

		try {
			do_action( 'admin_action_' . Golinks::ACTION_GO );
			$this->fail( 'Expected WPDieException!' );
		} catch ( WPDieException $exception ) {
			list( $message, $title, $args ) = $wp_die_handler_spy->args;
			$this->assertSame( 404, $args['response'], 'Expected 404 response code for invalid golink.' );
			$this->assertStringContainsString( 'The link you followed is invalid.', $message, 'Expected invalid golink message.' );
			$this->assertSame( $this->context->admin_url( 'dashboard' ), $args['link_url'], 'Expected dashboard link URL in invalid golink error args.' );
		}
	}

	public function test_handle_go__dies_with_404_and_splash_link_for_invalid_key() {
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$_GET['to']         = 'invalid-key';
		$wp_die_handler_spy = $this->spy_on_wp_die_handler();

		try {
			do_action( 'admin_action_' . Golinks::ACTION_GO );
			$this->fail( 'Expected WPDieException!' );
		} catch ( WPDieException $exception ) {
			list( $message, $title, $args ) = $wp_die_handler_spy->args;
			$this->assertSame( 404, $args['response'], 'Expected 404 response code for invalid golink.' );
			$this->assertStringContainsString( 'The link you followed is invalid.', $message, 'Expected invalid golink message.' );
			$this->assertSame( $this->context->admin_url( 'splash' ), $args['link_url'], 'Expected splash link URL in invalid golink error args.' );
		}
	}

	public function test_handle_go__dies_with_handler_error() {
		$this->golinks->register_handler(
			'error',
			$this->create_destination_handler(
				new WP_Error(
					'golink_error',
					'Test golink error',
					array(
						'status' => 400,
					)
				)
			)
		);
		$_GET['to']         = 'error';
		$wp_die_handler_spy = $this->spy_on_wp_die_handler();

		try {
			do_action( 'admin_action_' . Golinks::ACTION_GO );
			$this->fail( 'Expected WPDieException!' );
		} catch ( WPDieException $exception ) {
			list( $message, $title, $args ) = $wp_die_handler_spy->args;
			$this->assertSame( 400, $args['response'], 'Expected status code from handler WP_Error.' );
			$this->assertStringContainsString( 'Test golink error', $message, 'Expected WP_Error message to be shown via wp_die.' );
		}
	}

	public function test_register_handler__throws_for_duplicate_key() {
		$this->golinks->register_handler( 'dashboard', $this->create_destination_handler( 'https://example.com/dashboard' ) );

		try {
			$this->golinks->register_handler( 'dashboard', $this->create_destination_handler( 'https://example.com/new-dashboard' ) );
			$this->fail( 'Expected InvalidArgumentException!' );
		} catch ( InvalidArgumentException $exception ) {
			$this->assertStringContainsString( 'already registered', $exception->getMessage(), 'Expected duplicate handler registration message.' );
		}
	}

	private function create_destination_handler( $destination ) {
		$handler = $this->createMock( Golink_Handler_Interface::class );
		$handler->method( 'handle' )->willReturn( $destination );

		return $handler;
	}

	/**
	 * Decorates the wp_die handler to spy on its arguments.
	 * @return stdClass
	 */
	protected function spy_on_wp_die_handler() {
		$spy = new stdClass();

		add_filter(
			'wp_die_handler',
			function ( $handler ) use ( $spy ) {
				return function ( ...$args ) use ( $handler, $spy ) {
					// Capture the args the handler is called with.
					$spy->args = $args;

					return $handler( ...$args );
				};
			}
		);

		return $spy;
	}
}
