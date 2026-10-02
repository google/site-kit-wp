<?php
/**
 * Class Google\Site_Kit\Core\Abilities\Personalize_Metrics
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Abilities;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed_By;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User_Input\Site_Specific_Answers;
use Google\Site_Kit\Core\User_Input\User_Specific_Answers;
use Google\Site_Kit\Core\User_Surveys\Survey_Queue;
use WP_Error;

/**
 * Ability for answering the Personalized metrics questions.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Personalize_Metrics extends Ability {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Gets the ability slug.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability slug.
	 */
	protected function get_slug() {
		return 'personalize-metrics';
	}

	/**
	 * Gets the translated ability label.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability label.
	 */
	protected function get_label() {
		return __( 'Personalize Site Kit Metrics', 'google-site-kit' );
	}

	/**
	 * Gets the translated ability description.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability description.
	 */
	protected function get_description() {
		return __( 'Personalizes Site Kit metrics by saving answers to the Personalized metrics questions: site purpose, content creation frequency, and goals. Site Kit uses these answers to suggest dashboard metrics. The purpose is shared across the site; frequency and goals apply to the current user. Returns the saved answers.', 'google-site-kit' );
	}

	/**
	 * Gets the input schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema for the three Personalized metrics answers.
	 */
	protected function get_input_schema() {
		// Keep choices and labels in sync with components/user-input/util/constants.js.
		// The legacy sell_products_or_service choice is hidden by UserInputSelectOptions.
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'purpose'       => $this->get_question_schema(
					__( 'What is the main purpose of this site?', 'google-site-kit' ),
					array(
						'sell_products'    => __( 'Sell products', 'google-site-kit' ) . ' — ' . __( 'E.g. selling devices, apparel, equipment, etc.', 'google-site-kit' ),
						'provide_services' => __( 'Provide services', 'google-site-kit' ) . ' — ' . __( 'E.g. offering courses, consulting, tutoring, etc.', 'google-site-kit' ),
						'monetize_content' => __( 'Monetize content', 'google-site-kit' ) . ' — ' . __( 'Using display ads, affiliate links, sponsored content, etc.', 'google-site-kit' ),
						'publish_blog'     => __( 'Publish a blog', 'google-site-kit' ) . ' — ' . __( 'Writing on a topic you’re passionate about, no focus on monetizing content', 'google-site-kit' ),
						'publish_news'     => __( 'Publish news content', 'google-site-kit' ) . ' — ' . __( 'E.g. local news, investigative pieces, interviews, etc.', 'google-site-kit' ),
						'share_portfolio'  => __( 'Portfolio or business card', 'google-site-kit' ) . ' — ' . __( 'My website represents me or my company', 'google-site-kit' ),
						'other'            => __( 'Other', 'google-site-kit' ),
					),
					1
				),
				'postFrequency' => $this->get_question_schema(
					__( 'How often do you create new content for this site?', 'google-site-kit' ),
					array(
						'never'   => __( 'Never', 'google-site-kit' ),
						'daily'   => __( 'Daily', 'google-site-kit' ),
						'weekly'  => __( 'Weekly', 'google-site-kit' ),
						'monthly' => __( 'Monthly', 'google-site-kit' ),
						'other'   => __( 'Other', 'google-site-kit' ),
					),
					1
				),
				'goals'         => $this->get_question_schema(
					__( 'What are your top 3 goals for this site?', 'google-site-kit' ),
					array(
						'retaining_visitors'    => __( 'Retain visitors, turn them into loyal readers or customers', 'google-site-kit' ),
						'improving_performance' => __( 'Improve speed and performance', 'google-site-kit' ),
						'finding_new_topics'    => __( 'Find new topics to write about that connect with my audience', 'google-site-kit' ),
						'growing_audience'      => __( 'Grow my audience', 'google-site-kit' ),
						'expanding_business'    => __( 'Expand my business into new cities, states or markets', 'google-site-kit' ),
						'generating_revenue'    => __( 'Generate more revenue', 'google-site-kit' ),
						'generating_leads'      => __( 'Generate leads', 'google-site-kit' ),
						'help_better_rank'      => __( 'Help my content rank in a better position in Google search results', 'google-site-kit' ),
						'understanding_content_performance' => __( 'Understand which content is performing best', 'google-site-kit' ),
						'encourage_to_post'     => __( 'Encouragement to post more frequently', 'google-site-kit' ),
						'other'                 => __( 'Other', 'google-site-kit' ),
					),
					3
				),
			),
			'required'             => array( 'purpose', 'postFrequency', 'goals' ),
			'additionalProperties' => false,
		);
	}

	/**
	 * Builds an answer schema with human-readable enum labels in its description.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $question Question shown in the settings UI.
	 * @param array  $answers  Answer slugs mapped to translated labels and explanations.
	 * @param int    $maximum Maximum number of answers.
	 * @return array Question schema.
	 */
	private function get_question_schema( $question, array $answers, $maximum ) {
		$descriptions = array( $question );
		foreach ( $answers as $value => $label ) {
			$descriptions[] = $value . ': ' . $label;
		}

		return array(
			'type'        => 'array',
			'description' => implode( "\n", $descriptions ),
			'items'       => array(
				'type' => 'string',
				'enum' => array_keys( $answers ),
			),
			'minItems'    => 1,
			'maxItems'    => $maximum,
			'uniqueItems' => true,
		);
	}

	/**
	 * Gets the output schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema for the saved answers, matching the input shape.
	 */
	protected function get_output_schema() {
		return $this->get_input_schema();
	}

	/**
	 * Gets the ability category.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Site Kit category slug.
	 */
	protected function get_category() {
		return self::CATEGORY;
	}

	/**
	 * Gets additional ability metadata.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Empty metadata.
	 */
	protected function get_meta() {
		return array();
	}

	/**
	 * Gets instructions for using the ability.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Usage instructions.
	 */
	protected function get_instructions() {
		return __( 'When asked to personalize Site Kit metrics, ask the three questions in the input field descriptions and offer their listed answers. Map clear natural-language answers to the corresponding enum values; ask for clarification when the match is ambiguous. Do not invent answers or use other for an unanswered question. Collect exactly one purpose, exactly one content frequency, and one to three distinct goals before executing. Pass arrays of enum values, not labels. Explain that changing the purpose affects the whole site, while frequency and goals belong to the authenticated user. This replaces all three answers, preserves existing conversion-event settings, and requires permission to authenticate with Site Kit.', 'google-site-kit' );
	}

	/**
	 * Checks whether the ability only reads data.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always false.
	 */
	protected function is_readonly() {
		return false;
	}

	/**
	 * Checks whether the ability may perform destructive updates.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always true because existing answers are replaced.
	 */
	protected function is_destructive() {
		return true;
	}

	/**
	 * Checks whether repeated execution has no additional effect.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always true.
	 */
	protected function is_idempotent() {
		return true;
	}

	/**
	 * Checks the same permission as saving user-input-settings through REST.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return bool Whether the current user can update the answers.
	 */
	protected function check_permissions( $input = null ) {
		return current_user_can( Permissions::AUTHENTICATE );
	}

	/**
	 * Saves answers in their respective site and user scopes.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return array|WP_Error Saved answers, or an error if saving failed.
	 */
	protected function execute( $input = null ) {
		$options       = new Options( $this->context );
		$user_options  = new User_Options( $this->context );
		$site_answers  = new Site_Specific_Answers( $options );
		$user_answers  = new User_Specific_Answers( $user_options );
		$site_settings = $site_answers->get() ?: array();
		$user_settings = $user_answers->get() ?: array();

		// Match User_Input::set_answers() attribution without replacing unrelated answers.
		$answered_by = $site_settings['purpose']['answeredBy'] ?? 0;
		if (
			empty( $answered_by ) ||
			( ! empty( $site_settings['purpose']['values'] ) && array_diff( $site_settings['purpose']['values'], $input['purpose'] ) )
		) {
			$answered_by = get_current_user_id();
		}

		$site_settings['purpose'] = array(
			'values'     => $input['purpose'],
			'scope'      => Site_Specific_Answers::SCOPE,
			'answeredBy' => (int) $answered_by,
		);
		foreach ( array( 'postFrequency', 'goals' ) as $question ) {
			$user_settings[ $question ] = array(
				'values' => $input[ $question ],
				'scope'  => User_Specific_Answers::SCOPE,
			);
		}

		$site_answers->set( $site_settings );
		$user_answers->set( $user_settings );

		$saved_site_answers = $site_answers->get();
		$saved_user_answers = $user_answers->get();
		$result             = array(
			'purpose'       => $saved_site_answers['purpose']['values'] ?? array(),
			'postFrequency' => $saved_user_answers['postFrequency']['values'] ?? array(),
			'goals'         => $saved_user_answers['goals']['values'] ?? array(),
		);

		foreach ( $result as $question => $values ) {
			if ( $values !== $input[ $question ] ) {
				return new WP_Error(
					'personalize_metrics_save_failed',
					__( 'Could not save all Personalized metrics answers. Some answers may have been saved. Please try again.', 'google-site-kit' ),
					array( 'status' => 500 )
				);
			}
		}

		// Match the REST endpoint's setup completion and survey queue updates.
		$setup_completed_by = new Key_Metrics_Setup_Completed_By( $options );
		if ( ! $setup_completed_by->get() ) {
			$setup_completed_by->set( get_current_user_id() );
		}
		$survey_queue = new Survey_Queue( $user_options );
		$survey_queue->dequeue( 'user_input_answered_other_survey' );

		return $result;
	}
}
