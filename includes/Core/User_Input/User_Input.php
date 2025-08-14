<?php
/**
 * Class Google\Site_Kit\Core\User_Input\User_Input
 *
 * @package   Google\Site_Kit\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Input;

use ArrayAccess;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed_By;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User_Surveys\Survey_Queue;
use WP_Error;
use WP_User;

/**
 * Class for handling User Input settings.
 *
 * @since 1.90.0
 * @access private
 * @ignore
 */
class User_Input {

	/**
	 * Site_Specific_Answers instance.
	 *
	 * @since 1.90.0
	 * @var Site_Specific_Answers
	 */
	protected $site_specific_answers;

	/**
	 * User_Options instance.
	 *
	 * @since 1.90.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * User_Specific_Answers instance.
	 *
	 * @since 1.90.0
	 * @var User_Specific_Answers
	 */
	protected $user_specific_answers;

	/**
	 * REST_User_Input_Controller instance.
	 *
	 * @since 1.90.0
	 * @var REST_User_Input_Controller
	 */
	protected $rest_controller;

	/**
	 * User Input questions.
	 *
	 * @since 1.90.0
	 * @var array|ArrayAccess
	 */
	private static $questions = array(
		'purpose'                 => array(
			'scope' => 'site',
		),
		'postFrequency'           => array(
			'scope' => 'user',
		),
		'goals'                   => array(
			'scope' => 'user',
		),
		'includeConversionEvents' => array(
			'scope' => 'site',
		),
	);

	/**
	 * Constructor.
	 *
	 * @since 1.90.0
	 *
	 * @param Context      $context         Plugin context.
	 * @param Options      $options         Optional. Options instance. Default a new instance.
	 * @param User_Options $user_options    Optional. User_Options instance. Default a new instance.
	 * @param Survey_Queue $survey_queue    Optional. Survey_Queue instance. Default a new instance.
	 */
	public function __construct(
		Context $context,
		?Options $options = null,
		?User_Options $user_options = null,
		?Survey_Queue $survey_queue = null
	) {
		$this->site_specific_answers = new Site_Specific_Answers( $options ?: new Options( $context ) );
		$this->user_options          = $user_options ?: new User_Options( $context );
		$this->user_specific_answers = new User_Specific_Answers( $this->user_options );
		$this->rest_controller       = new REST_User_Input_Controller(
			$this,
			$survey_queue ?: new Survey_Queue( $this->user_options ),
			new Key_Metrics_Setup_Completed_By( $options ?: new Options( $context ) )
		);
	}

	/**
	 * Registers functionality.
	 *
	 * @since 1.90.0
	 */
	public function register() {
		$this->site_specific_answers->register();
		$this->user_specific_answers->register();
		$this->rest_controller->register();
	}

	/**
	 * Gets the set of user input questions.
	 *
	 * @since 1.90.0
	 *
	 * @return array The user input questions.
	 */
	public static function get_questions() {
		return static::$questions;
	}

	/**
	 * Gets user input answers.
	 *
	 * @since 1.90.0
	 *
	 * @return array|WP_Error User input answers.
	 */
	public function get_answers() {
		$questions    = static::$questions;
		$site_answers = $this->site_specific_answers->get();
		$user_answers = $this->user_specific_answers->get();

		$settings = array_merge(
			is_array( $site_answers ) ? $site_answers : array(),
			is_array( $user_answers ) ? $user_answers : array()
		);

		// If there are no settings, return default empty values.
		if ( empty( $settings ) ) {
			array_walk(
				$questions,
				function ( &$question ) {
					$question['values'] = array();
				}
			);

			return $questions;
		}

		foreach ( $settings as &$setting ) {
			if ( ! isset( $setting['answeredBy'] ) ) {
				continue;
			}

			$answered_by = intval( $setting['answeredBy'] );

			if ( ! $answered_by || $answered_by === $this->user_options->get_user_id() ) {
				continue;
			}

			$setting['author'] = array(
				'photo' => get_avatar_url( $answered_by ),
				'login' => ( new WP_User( $answered_by ) )->user_login,
			);
		}

		// If there are un-answered questions, return default empty values for them.
		foreach ( $questions as $question_key => $question_value ) {
			if ( ! isset( $settings[ $question_key ] ) ) {
				$settings[ $question_key ]           = $question_value;
				$settings[ $question_key ]['values'] = array();
			}
		}

		return $settings;
	}

	/**
	 * Determines whether the current user input settings have empty values or not.
	 *
	 * @since 1.90.0
	 *
	 * @param array $settings The settings to check.
	 * @return boolean|null TRUE if at least one of the settings has empty values, otherwise FALSE.
	 */
	public function are_settings_empty( $settings = array() ) {
		if ( empty( $settings ) ) {
			$settings = $this->get_answers();

			if ( is_wp_error( $settings ) ) {
				return null;
			}
		}

		// Conversion events may be empty during setup if no events have been detected.
		// Since this setting does not affect whether user input is considered "set up",
		// we are excluding it from this check. It relates to user input initially being
		// set up with detected events or events added later.
		unset( $settings['includeConversionEvents'] );

		foreach ( $settings as $setting ) {
			if ( empty( $setting['values'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Sets user input answers.
	 *
	 * @since 1.90.0
	 *
	 * @param array $settings User settings.
	 * @return array|WP_Error User input answers.
	 */
	public function set_answers( $settings ) {
		$site_settings = array();
		$user_settings = array();

		foreach ( $settings as $setting_key => $answers ) {
			$setting_data           = array();
			$setting_data['values'] = $answers;
			$setting_data['scope']  = static::$questions[ $setting_key ]['scope'];

			if ( 'site' === $setting_data['scope'] ) {
				$existing_answers = $this->get_answers();
				$answered_by      = $this->user_options->get_user_id();

				if (
					// If the answer to the "purpose" question changed,
					// attribute the answer to the current user changing the
					// answer.
					(
						! empty( $existing_answers['purpose']['values'] ) &&
						! empty( array_diff( $existing_answers['purpose']['values'], $answers ) )
					) ||
					// If the answer to the "purpose" question was empty,
					// attribute the answer to the current user.
					empty( $existing_answers['purpose']['answeredBy'] )
				) {
					$answered_by = $this->user_options->get_user_id();
				} else {
					// Otherwise, attribute the answer to the user who answered
					// the question previously.
					$answered_by = $existing_answers['purpose']['answeredBy'];
				}

				$setting_data['answeredBy']    = $answered_by;
				$site_settings[ $setting_key ] = $setting_data;

			} elseif ( 'user' === $setting_data['scope'] ) {
				$user_settings[ $setting_key ] = $setting_data;
			}
		}

		$this->site_specific_answers->set( $site_settings );
		$this->user_specific_answers->set( $user_settings );

		return $this->get_answers();
	}
}
