<?php
/**
 * Class Google\Site_Kit\Core\User_Input\REST_User_Input_Controller
 *
 * @package   Google\Site_Kit\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Input;

use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed_By;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\User_Surveys\Survey_Queue;
use Google\Site_Kit\Core\Util\Feature_Flags;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling User Input settings rest routes.
 *
 * @since 1.90.0
 * @access private
 * @ignore
 */
class REST_User_Input_Controller {

	/**
	 * User_Input instance.
	 *
	 * @since 1.90.0
	 * @var User_Input
	 */
	protected $user_input;

	/**
	 * Survey_Queue instance.
	 *
	 * @since 1.104.0
	 * @var Survey_Queue
	 */
	protected $survey_queue;

	/**
	 * Key_Metrics_Setup_Completed_By instance.
	 *
	 * @since 1.113.0
	 * @var Key_Metrics_Setup_Completed_By
	 */
	protected $key_metrics_setup_completed_by;

	/**
	 * Constructor.
	 *
	 * @since 1.90.0
	 *
	 * @param User_Input                     $user_input                     User_Input instance.
	 * @param Survey_Queue                   $survey_queue                   Survey_Queue instance.
	 * @param Key_Metrics_Setup_Completed_By $key_metrics_setup_completed_by Key_Metrics_Setup_Completed_By instance.
	 */
	public function __construct(
		User_Input $user_input,
		Survey_Queue $survey_queue,
		Key_Metrics_Setup_Completed_By $key_metrics_setup_completed_by
	) {
		$this->user_input                     = $user_input;
		$this->survey_queue                   = $survey_queue;
		$this->key_metrics_setup_completed_by = $key_metrics_setup_completed_by;
	}

	/**
	 * Registers functionality.
	 *
	 * @since 1.90.0
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
						'/' . REST_Routes::REST_ROOT . '/core/user/data/user-input-settings',
					)
				);
			}
		);
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since 1.90.0
	 * @since n.e.x.t Declares the argument and resource schemas of each route.
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		return array(
			new REST_Route(
				'core/user/data/user-input-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							$response = rest_ensure_response( $this->user_input->get_answers() );

							// Iterating over each setting in the response data to remove the 'author' key.
							// We use pass-by-reference (&$setting) to directly modify the original $response data.
							// This is done to ensure that if the current user doesn't have the `list_users` capability,
							// they won't be able to see the `{setting}.author` key of each answer object.
							if ( ! current_user_can( 'list_users' ) ) {
								foreach ( $response->data as &$setting ) {
									if ( isset( $setting['author'] ) ) {
										unset( $setting['author'] );
									}
								}
							}

							return $response;
						},
						'permission_callback' => function () {
							return current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD );
						},
					),
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$data = $request->get_param( 'data' );

							$answers = $this->user_input->set_answers( $data['settings'] );

							if ( ! empty( $answers['purpose']['values'] ) ) {
								$key_metrics_setup_already_done_by_user = $this->key_metrics_setup_completed_by->get();

								if ( empty( $key_metrics_setup_already_done_by_user ) ) {
									$current_user_id = get_current_user_id();

									$this->key_metrics_setup_completed_by->set( $current_user_id );
								}
							}

							$response = rest_ensure_response( $answers );

							if ( $response instanceof WP_REST_Response ) {
								$this->survey_queue->dequeue(
									'user_input_answered_other_survey'
								);
							}

							return $response;
						},
						'permission_callback' => function () {
							return current_user_can( Permissions::AUTHENTICATE );
						},
						'args'                => array(
							'data' => array(
								'type'        => 'object',
								'description' => __( 'User input answers to save.', 'google-site-kit' ),
								'required'    => true,
								'properties'  => array(
									'settings' => array(
										'type'        => 'object',
										'description' => __( 'Answers to save, by question.', 'google-site-kit' ),
										'required'    => true,
										'additionalProperties' => false,
										'properties'  => array_fill_keys(
											array_keys( User_Input::get_questions() ),
											array(
												'type'     => 'array',
												'description' => __( 'Values picked as the answer to the question.', 'google-site-kit' ),
												'required' => true,
												'items'    => array( 'type' => 'string' ),
											)
										),
									),
								),
							),
						),
					),
				),
				array(
					'schema' => function () {
						return $this->get_user_input_settings_schema();
					},
				)
			),
		);
	}

	/**
	 * Gets the REST schema of the user input answers.
	 *
	 * @since n.e.x.t
	 *
	 * @return array REST schema.
	 */
	private function get_user_input_settings_schema() {
		$answer = array(
			'type'        => 'object',
			'description' => __( 'Answer to the question.', 'google-site-kit' ),
			'properties'  => array(
				'values'     => array(
					'type'        => 'array',
					'description' => __( 'Values picked as the answer.', 'google-site-kit' ),
					'items'       => array(
						'type' => 'string',
					),
				),
				'scope'      => array(
					'type'        => 'string',
					'description' => __( 'Whether the answer is for the whole site or for the current user alone.', 'google-site-kit' ),
					'enum'        => array( 'site', 'user' ),
				),
				'answeredBy' => array(
					'type'        => 'integer',
					'description' => __( 'ID of the user who answered a site question.', 'google-site-kit' ),
				),
				'author'     => array(
					'type'        => 'object',
					'description' => __( 'The user who answered a site question, where that is another user. Only a user who can list users gets it.', 'google-site-kit' ),
					'properties'  => array(
						'photo' => array(
							'type'        => 'string',
							'description' => __( 'Avatar URL of that user.', 'google-site-kit' ),
						),
						'login' => array(
							'type'        => array( 'string', 'boolean' ),
							'description' => __( 'Login name of that user, or false where that user no longer exists.', 'google-site-kit' ),
						),
					),
				),
			),
		);

		return array(
			'$schema'     => 'http://json-schema.org/draft-04/schema#',
			'title'       => 'user-input-settings',
			'description' => __( 'Answers to the user input questions, by question.', 'google-site-kit' ),
			'type'        => 'object',
			'properties'  => array_fill_keys( array_keys( User_Input::get_questions() ), $answer ),
		);
	}
}
