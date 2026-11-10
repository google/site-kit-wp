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
use Google\Site_Kit\Core\REST_API\Schema\String_List_Schema;
use Google\Site_Kit\Core\REST_API\Schema\Success_Schema;
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
	 * Survey_Timeouts instance.
	 *
	 * @since 1.73.0
	 * @var Survey_Timeouts
	 */
	protected $timeouts;

	/**
	 * Survey_Queue instance.
	 *
	 * @since 1.98.0
	 * @var Survey_Queue
	 */
	protected $queue;

	/**
	 * Constructor.
	 *
	 * @since 1.35.0
	 *
	 * @param Authentication  $authentication Authentication instance.
	 * @param Survey_Timeouts $timeouts       User timeouts setting.
	 * @param Survey_Queue    $queue          Surveys queue.
	 */
	public function __construct( Authentication $authentication, Survey_Timeouts $timeouts, Survey_Queue $queue ) {
		$this->authentication = $authentication;
		$this->timeouts       = $timeouts;
		$this->queue          = $queue;
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
	 * @since n.e.x.t Declares the argument and resource schemas of each route.
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

						if ( ! is_wp_error( $response ) && ! empty( $response['survey_id'] ) ) {
							$this->queue->enqueue( $response );
						}

						if ( ! is_wp_error( $response ) && ! empty( $data['ttl'] ) ) {
							$this->timeouts->add( $data['triggerID'], $data['ttl'] );
						}

						return new WP_REST_Response( array( 'success' => true ) );
					},
					'permission_callback' => $can_authenticate,
					'args'                => array(
						'data' => array(
							'type'        => 'object',
							'description' => __( 'The trigger of a survey to show.', 'google-site-kit' ),
							'required'    => true,
							'properties'  => array(
								'triggerID' => array(
									'type'        => 'string',
									'description' => __( 'ID of the trigger.', 'google-site-kit' ),
									'required'    => true,
									'minLength'   => 1,
								),
								'ttl'       => array(
									'type'        => 'integer',
									'description' => __( 'Seconds before this trigger can show a survey again. Zero, or leaving it out, sets no timeout.', 'google-site-kit' ),
									'minimum'     => 0,
								),
							),
						),
					),
				),
				array(
					'schema' => array( Success_Schema::class, 'get' ),
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

						$data = $request->get_param( 'data' );
						if ( isset( $data['event']['survey_shown'] ) ) {
							$this->timeouts->set_global_timeout();
						}

						$response = $proxy->send_survey_event( $creds, $access_token, $data['session'], $data['event'] );
						if ( ! is_wp_error( $response ) ) {
							$is_survey_closed    = isset( $data['event']['survey_closed'] );
							$is_completion_shown = isset( $data['event']['completion_shown'] );
							if ( $is_completion_shown || $is_survey_closed ) {
								$survey = $this->queue->find_by_session( $data['session'] );
								if ( ! empty( $survey ) ) {
									$this->queue->dequeue( $survey['survey_id'] );
								}
							}
						}

						return new WP_REST_Response( $response );
					},
					'permission_callback' => $can_authenticate,
					'args'                => array(
						'data' => array(
							'type'        => 'object',
							'description' => __( 'The survey event to send.', 'google-site-kit' ),
							'required'    => true,
							'properties'  => array(
								'session' => array(
									'type'        => 'object',
									'description' => __( 'Session of the survey the event belongs to.', 'google-site-kit' ),
									'required'    => true,
									'properties'  => array(
										'session_id'    => array(
											'type'        => 'string',
											'description' => __( 'ID of the survey session.', 'google-site-kit' ),
											'required'    => true,
											'minLength'   => 1,
										),
										'session_token' => array(
											'type'        => 'string',
											'description' => __( 'Token of the survey session.', 'google-site-kit' ),
											'required'    => true,
											'minLength'   => 1,
										),
									),
								),
								'event'   => array(
									'type'                 => 'object',
									'description'          => __( 'The event, keyed by its type, such as survey_shown.', 'google-site-kit' ),
									'required'             => true,
									'minProperties'        => 1,
									'additionalProperties' => false,
									'properties'           => array(
										'survey_shown'     => array(
											'type'        => 'object',
											'description' => __( 'The survey appeared on the screen.', 'google-site-kit' ),
										),
										'survey_closed'    => array(
											'type'        => 'object',
											'description' => __( 'The user closed the survey.', 'google-site-kit' ),
										),
										'question_answered' => array(
											'type'        => 'object',
											'description' => __( 'The user answered a question, with the question ordinal and the answer.', 'google-site-kit' ),
										),
										'completion_shown' => array(
											'type'        => 'object',
											'description' => __( 'The survey showed a completion screen, with its completion ordinal.', 'google-site-kit' ),
										),
										'follow_up_link_clicked' => array(
											'type'        => 'object',
											'description' => __( 'The user clicked the follow-up link of a completion screen, with its completion ordinal.', 'google-site-kit' ),
										),
									),
								),
							),
						),
					),
				),
				array(
					'schema' => function () {
						return $this->get_survey_event_schema();
					},
				)
			),
			'survey-timeouts' => new REST_Route(
				'core/user/data/survey-timeouts',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'permission_callback' => $can_authenticate,
					'callback'            => function () {
						return new WP_REST_Response( $this->timeouts->get_survey_timeouts() );
					},
				),
				array(
					'schema' => array( String_List_Schema::class, 'get' ),
				)
			),
			'survey'          => new REST_Route(
				'core/user/data/survey',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'permission_callback' => $can_authenticate,
					'callback'            => function () {
						return new WP_REST_Response(
							array(
								'survey' => $this->queue->front(),
							)
						);
					},
				),
				array(
					'schema' => function () {
						return $this->get_survey_schema();
					},
				)
			),
		);
	}

	/**
	 * Gets the REST schema of the reply to a survey event.
	 *
	 * @since n.e.x.t
	 *
	 * @return array REST schema.
	 */
	private function get_survey_event_schema() {
		return array(
			'$schema'              => 'http://json-schema.org/draft-04/schema#',
			'title'                => 'survey-event',
			'description'          => __( 'Reply of the Site Kit service to a survey event.', 'google-site-kit' ),
			'type'                 => 'object',
			'additionalProperties' => true,
		);
	}

	/**
	 * Gets the REST schema of the survey to show the current user.
	 *
	 * @since n.e.x.t
	 *
	 * @return array REST schema.
	 */
	private function get_survey_schema() {
		return array(
			'$schema'     => 'http://json-schema.org/draft-04/schema#',
			'title'       => 'survey',
			'description' => __( 'The survey to show the current user next.', 'google-site-kit' ),
			'type'        => 'object',
			'properties'  => array(
				'survey' => array(
					'type'        => array( 'object', 'null' ),
					'description' => __( 'The first survey in the queue of the current user, as the Site Kit service sent it, or null where the queue is empty.', 'google-site-kit' ),
					'properties'  => array(
						'survey_id'                  => array(
							'type'        => 'string',
							'description' => __( 'ID of the survey.', 'google-site-kit' ),
						),
						'session'                    => array(
							'type'        => 'object',
							'description' => __( 'Session of the survey, which each survey event sends back.', 'google-site-kit' ),
							'properties'  => array(
								'session_id'    => array(
									'type'        => 'string',
									'description' => __( 'ID of the survey session.', 'google-site-kit' ),
								),
								'session_token' => array(
									'type'        => 'string',
									'description' => __( 'Token of the survey session.', 'google-site-kit' ),
								),
							),
						),
						'survey_payload'             => array(
							'type'                 => 'object',
							'description'          => __( 'Questions and completion screens of the survey, in the format of the Site Kit service.', 'google-site-kit' ),
							'additionalProperties' => true,
						),
						'no_available_survey_reason' => array(
							'type'        => 'string',
							'description' => __( 'Why the Site Kit service had no survey to send, empty for a survey it sent.', 'google-site-kit' ),
						),
					),
				),
			),
		);
	}
}
