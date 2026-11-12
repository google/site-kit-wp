<?php
/**
 * Trait Google\Site_Kit\Tests\Benchmarking_Insight_Datapoints_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Token;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use WP_Error;

/**
 * Trait for testing the benchmarking insight datapoints through the REST API, with a fake Site Kit service.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Benchmarking_Insight_Datapoints_Trait {

	use Dashboard_Sharing_Trait;

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	protected $options;

	/**
	 * Modules instance the REST routes answer from.
	 *
	 * @since n.e.x.t
	 * @var Modules
	 */
	protected $modules;

	/**
	 * Analytics 4 module instance built for the current user.
	 *
	 * @since n.e.x.t
	 * @var Analytics_4
	 */
	protected $analytics;

	/**
	 * The ID of the administrator who connected Site Kit and owns Analytics.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	protected $admin_id;

	/**
	 * Each request the fake service received, with its `url` and its `args`.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $service_requests = array();

	/**
	 * What the fake service answers with: an array with the `status`, the
	 * `body` it encodes as JSON and the `headers` of the response, or the
	 * error of a request that did not reach it.
	 *
	 * @since n.e.x.t
	 * @var array|WP_Error
	 */
	protected $service_response = array(
		'status'  => 200,
		'body'    => array(),
		'headers' => array(),
	);

	/**
	 * Connects Site Kit and Analytics under the administrator's account, with
	 * the administrator as the module's owner, registers the REST routes of
	 * the modules, and sends every request to the Site Kit service's AI
	 * endpoints to the fake service.
	 *
	 * The feature flags of the datapoints stay off; a test turns them on with
	 * `enable_insight_datapoints()`.
	 *
	 * @since n.e.x.t
	 */
	protected function set_up_benchmarking_insight_datapoints() {
		$this->admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->admin_id );

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $this->context );

		$this->authenticate_user( $this->admin_id, array( Analytics_4::READONLY_SCOPE ) );

		$user_options    = new User_Options( $this->context, $this->admin_id );
		$authentication  = new Authentication( $this->context, $this->options, $user_options );
		$this->modules   = new Modules( $this->context, $this->options, $user_options, $authentication );
		$this->analytics = new Analytics_4( $this->context, $this->options, $user_options, $authentication );

		$this->analytics->get_settings()->merge(
			array(
				'accountID'       => '12345',
				'propertyID'      => '67890',
				'webDataStreamID' => '13579',
				'measurementID'   => 'G-ABCDEF1234',
				'ownerID'         => $this->admin_id,
			)
		);
		$this->options->set( Modules::OPTION_ACTIVE_MODULES, array( Analytics_4::MODULE_SLUG ) );

		$this->register_modules_rest_routes( $this->modules );
		$this->switch_to_user( $this->admin_id );
		$this->fake_service();
	}

	/**
	 * Turns on the `typicalTraffic` and `trafficInsights` feature flags, and
	 * builds the modules again for the current user, so they define the
	 * datapoints.
	 *
	 * @since n.e.x.t
	 *
	 * @param string[] $features Optional. The feature flags to turn on. Default both flags of the datapoints.
	 */
	protected function enable_insight_datapoints( array $features = array( 'typicalTraffic', 'trafficInsights' ) ) {
		foreach ( $features as $feature ) {
			$this->enable_feature( $feature );
		}

		// A module builds its datapoints once, so it is built again with the
		// flags on.
		$this->switch_to_user( get_current_user_id() );
	}

	/**
	 * Makes the given user the current one, and builds the Analytics module
	 * the REST routes answer from for that user.
	 *
	 * A module reads the token of the user it was built for, so the
	 * administrator and a view-only reader each need a module built for them.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id The user the module is built for.
	 */
	protected function switch_to_user( $user_id ) {
		wp_set_current_user( $user_id );

		$user_options    = new User_Options( $this->context, $user_id );
		$authentication  = new Authentication( $this->context, $this->options, $user_options );
		$this->analytics = new Analytics_4( $this->context, $this->options, $user_options, $authentication );

		$this->force_set_property( $this->modules, 'modules', array( Analytics_4::MODULE_SLUG => $this->analytics ) );
		$this->register_permissions_for_user( $user_id, $this->modules );
	}

	/**
	 * Shares Analytics with the Editor role, and creates an editor who views
	 * the shared dashboard without an account of their own.
	 *
	 * @since n.e.x.t
	 *
	 * @return int The ID of the view-only reader.
	 */
	protected function create_view_only_reader_of_analytics() {
		$this->share_modules_with_editors( array( Analytics_4::MODULE_SLUG ) );

		return $this->create_view_only_reader();
	}

	/**
	 * Leaves the administrator who owns Analytics without a Google account
	 * that the request of a view-only reader can run with.
	 *
	 * The owner can be left in one of three states:
	 * - `recoverable`: the module is recoverable, which is how `Modules` marks
	 *   a shared module whose owner lost access to it. The request then runs
	 *   with the reader's own account, which has granted no scopes.
	 * - `no_scopes`: the owner has neither a token nor the scopes they granted,
	 *   so the request runs with the reader's own account too.
	 * - `no_token`: the owner has no token, keeps the scopes they granted, and
	 *   the module is not recoverable, so the request reaches the datapoint
	 *   with the owner's account.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $state The state the owner is left in: `recoverable`, `no_scopes` or `no_token`.
	 */
	protected function disconnect_owner_of_analytics( $state ) {
		if ( 'recoverable' === $state ) {
			add_filter( 'googlesitekit_is_module_recoverable', '__return_true', 100 );

			return;
		}

		$owner_options = new User_Options( $this->context, $this->admin_id );

		( new Token( $owner_options ) )->delete();

		if ( 'no_scopes' === $state ) {
			// A scope that was not required when the owner granted it is
			// kept apart from the required ones.
			$owner_options->delete( OAuth_Client::OPTION_AUTH_SCOPES );
			$owner_options->delete( OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES );

			return;
		}

		// The plugin registers this filter when it loads, and its callback
		// reports a module whose owner has no token as recoverable. Without
		// it the module is not recoverable, so the owner's account is used.
		remove_all_filters( 'googlesitekit_is_module_recoverable' );
	}

	/**
	 * Makes the fake service answer with the given response.
	 *
	 * @since n.e.x.t
	 *
	 * @param int   $status  The status of the response.
	 * @param mixed $body    The body of the response, which the fake service encodes as JSON.
	 * @param array $headers Optional. The headers of the response, keyed by their lowercase names. Default empty array.
	 */
	protected function answer_service_with( $status, $body, array $headers = array() ) {
		$this->service_response = array(
			'status'  => $status,
			'body'    => $body,
			'headers' => $headers,
		);
	}

	/**
	 * Makes a request to the fake service fail before it reaches the service,
	 * as an unreachable host does.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Error $error The error the request fails with.
	 */
	protected function fail_service_requests_with( WP_Error $error ) {
		$this->service_response = $error;
	}

	/**
	 * Gets the URL of a path of the Site Kit service.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $path The path, such as `/v1/ai/benchmarking`.
	 * @return string The URL.
	 */
	protected function get_service_url( $path ) {
		return ( new Google_Proxy( $this->context ) )->url( $path );
	}

	/**
	 * Sends each request to the Site Kit service's AI endpoints to the fake
	 * service, which records it in `$service_requests` and answers with
	 * `$service_response`.
	 *
	 * @since n.e.x.t
	 */
	private function fake_service() {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( 0 !== strpos( $url, $this->get_service_url( '/v1/ai/' ) ) ) {
					return $preempt;
				}

				$this->service_requests[] = array(
					'url'  => $url,
					'args' => $args,
				);

				if ( is_wp_error( $this->service_response ) ) {
					return $this->service_response;
				}

				return array(
					'headers'       => $this->service_response['headers'],
					'body'          => wp_json_encode( $this->service_response['body'] ),
					'response'      => array(
						'code'    => $this->service_response['status'],
						'message' => get_status_header_desc( $this->service_response['status'] ),
					),
					'cookies'       => array(),
					'http_response' => null,
				);
			},
			10,
			3
		);
	}
}
