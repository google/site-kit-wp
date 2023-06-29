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
	 * Constructor.
	 *
	 * @since 1.90.0
	 *
	 * @param User_Input   $user_input   User_Input instance.
	 * @param Survey_Queue $survey_queue Survey_Queue instance.
	 */
	public function __construct( User_Input $user_input, Survey_Queue $survey_queue ) {
		$this->user_input   = $user_input;
		$this->survey_queue = $survey_queue;
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

		if ( Feature_Flags::enabled( 'userInput' ) ) {
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
		$can_authenticate = function() {
			return current_user_can( Permissions::AUTHENTICATE );
		};

		return array(
			new REST_Route(
				'core/user/data/user-input-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function() {
							return rest_ensure_response( $this->user_input->get_answers() );
						},
						'permission_callback' => $can_authenticate,
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

							$response = rest_ensure_response(
								$this->user_input->set_answers(
									$data['settings']
								)
							);

							if ( $response instanceof WP_REST_Response ) {
								$this->survey_queue->dequeue(
									'user_input_answered_other_survey'
								);
							}

							return $response;
						},
						'permission_callback' => $can_authenticate,
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
