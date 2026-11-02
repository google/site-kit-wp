<?php
/**
 * Trait Google\Site_Kit\Tests\Dashboard_Sharing_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Modules\REST_Modules_Controller;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit_Dependencies\Google\Client as Google_Client;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * Trait for testing a REST datapoint that a view-only user reads through Dashboard Sharing, with a fake Google API.
 *
 * @since 1.191.0
 * @access private
 * @ignore
 */
trait Dashboard_Sharing_Trait {

	use Fake_Site_Connection_Trait;
	use RestTestTrait;

	/**
	 * The `Authorization` header of each request that a fake Google API of `fake_google_api()` answered, by the host of the API, such as `analyticsdata.googleapis.com`.
	 *
	 * @since 1.191.0
	 * @var array
	 */
	protected $google_api_authorizations = array();

	/**
	 * Connects Site Kit, and signs the given user in to Google with the token `valid-token` and the given scopes.
	 *
	 * @since 1.191.0
	 *
	 * @param int      $user_id The ID of the user, such as the administrator who owns the shared modules.
	 * @param string[] $scopes  The scopes the user granted besides the required ones, such as `Analytics_4::READONLY_SCOPE`.
	 */
	protected function authenticate_user( $user_id, array $scopes ) {
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$authentication = new Authentication( $context, new Options( $context ), new User_Options( $context, $user_id ) );

		$this->fake_proxy_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-token' ) );
		$authentication->get_oauth_client()->set_granted_scopes(
			array_merge( $authentication->get_oauth_client()->get_required_scopes(), $scopes )
		);
	}

	/**
	 * Shares the given modules with the Editor role.
	 *
	 * @since 1.191.0
	 *
	 * @param string[] $module_slugs The slugs of the modules, such as `analytics-4`.
	 */
	protected function share_modules_with_editors( array $module_slugs ) {
		( new Module_Sharing_Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) ) )->set(
			array_fill_keys( $module_slugs, array( 'sharedRoles' => array( 'editor' ) ) )
		);
	}

	/**
	 * Creates an editor who can view the shared dashboard without an account of their own.
	 *
	 * @since 1.191.0
	 *
	 * @return int The editor's user ID.
	 */
	protected function create_view_only_reader() {
		$reader_id = $this->factory()->user->create( array( 'role' => 'editor' ) );

		// `Permissions` lets an editor with no Google account of their own read
		// the shared dashboard only once they dismiss its splash screen.
		( new Dismissed_Items( new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $reader_id ) ) )->add( 'shared_dashboard_splash', 0 );

		return $reader_id;
	}

	/**
	 * Registers the REST routes of `REST_Modules_Controller` on a new REST server, so they answer from the given modules.
	 *
	 * A REST server that an earlier test class left behind keeps that class's
	 * routes, because `rest_get_server()` registers routes only when it builds a
	 * server. So a class that calls this unsets `$GLOBALS['wp_rest_server']` in
	 * its `tear_down()` too.
	 *
	 * @since 1.191.0
	 *
	 * @param Modules $modules The modules the REST routes answer from.
	 */
	protected function register_modules_rest_routes( Modules $modules ) {
		unset( $GLOBALS['wp_rest_server'] );

		remove_all_filters( 'googlesitekit_rest_routes' );
		( new REST_Modules_Controller( $modules ) )->register();
		$this->register_rest_routes();
	}

	/**
	 * Sends each request of the given Google clients to a fake Google API, which refuses a request with no token.
	 *
	 * The fake API saves the `Authorization` header of each request it answers
	 * in `$google_api_authorizations`.
	 *
	 * @since 1.191.0
	 *
	 * @param Google_Client[] $clients The clients, such as a module's client and the client of its owner.
	 * @param callable        $answer  Gets each request that has a token, and returns the response of the fake API.
	 */
	protected function fake_google_api( array $clients, callable $answer ) {
		$handler = function ( Request $request ) use ( $answer ) {
			if ( '' === $request->getHeaderLine( 'Authorization' ) ) {
				return new FulfilledPromise( new Response( 401 ) );
			}

			$this->google_api_authorizations[ $request->getUri()->getHost() ][] = $request->getHeaderLine( 'Authorization' );

			return new FulfilledPromise( $answer( $request ) );
		};

		foreach ( $clients as $client ) {
			FakeHttp::fake_google_http_handler( $client, $handler );
		}
	}

	/**
	 * Registers the capability map for a user.
	 *
	 * The instance the plugin registered at bootstrap stays bound to the user
	 * it was built for, so a test that switches users needs its own.
	 *
	 * @since 1.190.0
	 * @since 1.191.0 Moved from `Get_Benchmarking_DataTest`, and takes the modules the capabilities are checked against.
	 *
	 * @param int     $user_id The user the capabilities are resolved for.
	 * @param Modules $modules The modules the capabilities are checked against.
	 */
	protected function register_permissions_for_user( $user_id, Modules $modules ) {
		remove_all_filters( 'map_meta_cap' );
		remove_all_filters( 'user_has_cap' );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );

		// Authentication reads the token of the user it was built for, so a
		// reader checked against the administrator's would look authenticated.
		( new Permissions(
			$context,
			new Authentication( $context, new Options( $context ), $user_options ),
			$modules,
			$user_options,
			new Dismissed_Items( $user_options )
		) )->register();
	}
}
