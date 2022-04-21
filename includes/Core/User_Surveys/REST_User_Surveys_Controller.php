<?php
/**
 * Class Google\Site_Kit\Core\User_Surveys\REST_User_Surveys_Controller
 *
 * @package   Google\Site_Kit\Core\User_Surveys
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Surveys;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling user survey rest routes.
 *
 * @since 1.35.0
 * @access private
 * @ignore
 */
class REST_User_Surveys_Controller {

	/**
	 * Authentication instance.
	 *
	 * @since 1.35.0
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Survey_Timeouts isntance.
	 *
	 * @since 1.73.0
	 * @var Survey_Timeouts
	 */
	protected $timeouts;

	/**
	 * Constructor.
	 *
	 * @since 1.35.0
	 *
	 * @param Authentication  $authentication Authentication instance.
	 * @param Survey_Timeouts $timeouts       User timeouts setting.
	 */
	public function __construct( Authentication $authentication, Survey_Timeouts $timeouts ) {
		$this->authentication = $authentication;
		$this->timeouts       = $timeouts;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.35.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) {
				return array_merge(
					$paths,
					array(
						'/' . REST_Routes::REST_ROOT . '/core/user/data/survey-timeouts',
					)
				);
			}
		);
	}


	/**
	 * Gets REST route instances.
	 *
	 * @since 1.35.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_authenticate = function () {
			return $this->authentication->is_authenticated()
				&& $this->authentication->credentials()->using_proxy();
		};

		return array(
			'survey-trigger'  => new REST_Route(
				'core/user/data/survey-trigger',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$proxy        = $this->authentication->get_google_proxy();
						$creds        = $this->authentication->credentials();
						$access_token = (string) $this->authentication->get_oauth_client()->get_access_token();
						$data         = $request->get_param( 'data' );

						$response = $proxy->send_survey_trigger( $creds, $access_token, $data['triggerID'] );
						$response = rest_ensure_response( $response );

						return $response;
					},
					'permission_callback' => $can_authenticate,
					'args'                => array(
						'data' => array(
							'type'       => 'object',
							'required'   => true,
							'properties' => array(
								'triggerID' => array(
									'type'     => 'string',
									'required' => true,
								),
							),
						),
					),
				)
			),
			'survey-event'    => new REST_Route(
				'core/user/data/survey-event',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$proxy        = $this->authentication->get_google_proxy();
						$creds        = $this->authentication->credentials();
						$access_token = (string) $this->authentication->get_oauth_client()->get_access_token();
						$data         = $request->get_param( 'data' );

						$response = $proxy->send_survey_event( $creds, $access_token, $data['session'], $data['event'] );
						$response = rest_ensure_response( $response );

						return $response;
					},
					'permission_callback' => $can_authenticate,
					'args'                => array(
						'data' => array(
							'type'       => 'object',
							'required'   => true,
							'properties' => array(
								'session' => array(
									'type'       => 'object',
									'required'   => true,
									'properties' => array(
										'session_id'    => array(
											'type'     => 'string',
											'required' => true,
										),
										'session_token' => array(
											'type'     => 'string',
											'required' => true,
										),
									),
								),
								'event'   => array(
									'type'       => 'object',
									'required'   => true,
									'properties' => array(
										'survey_shown'     => array(
											'type' => 'object',
										),
										'survey_closed'    => array(
											'type' => 'object',
										),
										'question_answered' => array(
											'type' => 'object',
										),
										'completion_shown' => array(
											'type' => 'object',
										),
										'follow_up_link_clicked' => array(
											'type' => 'object',
										),
									),
								),
							),
						),
					),
				)
			),
			'survey-timeout'  => new REST_Route(
				'core/user/data/survey-timeout',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => $can_authenticate,
					'callback'            => function ( WP_REST_Request $request ) {
						$data = $request['data'];

						if ( empty( $data['slug'] ) ) {
							return new WP_Error(
								'missing_required_param',
								/* translators: %s: Missing parameter name */
								sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'slug' ),
								array( 'status' => 400 )
							);
						}

						$timeout = HOUR_IN_SECONDS;
						if ( isset( $data['timeout'] ) && intval( $data['timeout'] ) > 0 ) {
							$timeout = $data['timeout'];
						}

						$this->timeouts->add( $data['slug'], $timeout );

						return new WP_REST_Response( $this->timeouts->get_survey_timeouts() );
					},
					'args'                => array(
						'data' => array(
							'type'     => 'object',
							'required' => true,
						),
					),
				)
			),
			'survey-timeouts' => new REST_Route(
				'core/user/data/survey-timeouts',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'permission_callback' => $can_authenticate,
					'callback'            => function ( WP_REST_Request $request ) {
						return new WP_REST_Response( $this->timeouts->get_survey_timeouts() );
					},
				)
			),
		);
	}

}
