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
use WP_Error;
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
			function( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		if ( Feature_Flags::enabled( 'keyMetrics' ) ) {
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
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since 1.90.0
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
						'callback'            => function() {
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
						'permission_callback' => function() {
							return current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD );
						},
					),
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$data = $request->get_param( 'data' );

							if ( ! isset( $data['settings'] ) || ! is_array( $data['settings'] ) ) {
								return new WP_Error(
									'rest_missing_callback_param',
									__( 'Missing settings data.', 'google-site-kit' ),
									array( 'status' => 400 )
								);
							}

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
						'permission_callback' => function() {
							return current_user_can( Permissions::AUTHENTICATE );
						},
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'settings' => array(
										'type'      => 'object',
										'required'  => true,
										'questions' => array_fill_keys(
											array_keys( User_Input::get_questions() ),
											array(
												'type'  => 'array',
												'items' => array( 'type' => 'string' ),
											)
										),
									),
								),
							),
						),
					),
				)
			),
		);
	}
}
