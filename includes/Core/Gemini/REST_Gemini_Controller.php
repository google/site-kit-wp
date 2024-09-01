<?php
/**
 * Class Google\Site_Kit\Core\Gemini\REST_Gemini_Controller
 *
 * @package   Google\Site_Kit\Core\Gemini
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Gemini;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

use Google\Site_Kit\Core\Storage\Data_Encryption;

use Google\Site_Kit_Dependencies\Gemini;
use Google\Site_Kit_Dependencies\Gemini\Data\GenerationConfig;
// These classes can be used for advanced model configuration for model parameters and safety controls.
// use Google\Site_Kit_Dependencies\Gemini\Enums\HarmBlockThreshold;
// use Google\Site_Kit_Dependencies\Gemini\Data\SafetySetting;
// use Google\Site_Kit_Dependencies\Gemini\Enums\HarmCategory;
// ...
use Google\Site_Kit_Dependencies\Gemini\Data\Content;
use Google\Site_Kit_Dependencies\Gemini\Enums\Role;

use function PHPSTORM_META\type;

/**
 * Class for handling Consent Mode.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_Gemini_Controller {

	/**
	 * Gemini_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Gemini_Settings
	 */
	private $gemini_settings;

	/**
	 * Gemini API Client instance.
	 *
	 * @since n.e.x.t
	 * @var Gemini
	 */
	private $gemini_client;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Gemini_Settings $gemini_settings Gemini_Settings instance.
	 */
	public function __construct( Gemini_Settings $gemini_settings ) {
		$this->gemini_settings = $gemini_settings;

		// Get API Key from settings.
		$settings = $this->gemini_settings->get();

		// Decrypt it to use with the Gemini API.
		$encryption = new Data_Encryption();
		if ( is_array( $settings ) && array_key_exists( 'APIKey', $settings ) && $settings['APIKey'] ) {
			$api_key             = $encryption->decrypt( $settings['APIKey'] );
			$this->gemini_client = Gemini::client( $api_key ); // TODO: handle API errors such as invalid API key or account not activated.
		}
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since n.e.x.t
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_manage_options = function () {
			return current_user_can( Permissions::MANAGE_OPTIONS );
		};

		return array(
			new REST_Route(
				'core/site/data/memorable-quotes',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->gemini_settings->get() );
						},
						'permission_callback' => $can_manage_options,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$this->gemini_settings->set(
								$request['data']['settings']
							);

							return new WP_REST_Response( $this->gemini_settings->get() );
						},
						'permission_callback' => $can_manage_options,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'settings' => array(
										'type'          => 'object',
										'required'      => true,
										'minProperties' => 1,
										'additionalProperties' => false,
										'properties'    => array(
											'APIKey' => array(
												'type' => 'string',
											),
											'memorableQuotesEnabled' => array(
												'type' => 'boolean',
											),
											'generatingQuotes' => array(
												'type' => 'boolean',
											),
											'memorableQuotesPosts' => array(
												'type'  => 'array',
												'items' => array(
													'type' => 'number',
												),
											),
											'memorableQuotes' => array(
												'type'  => 'array',
												'items' => array(
													'type' => 'object',
												),
											),
											'memorableQuotesAutoPublish' => array(
												'type' => 'boolean',
											),
											'siteKitAssistantEnabled' => array(
												'type' => 'boolean',
											),
										),
									),
								),
							),
						),
					),
				)
			),
			new REST_Route(
				'core/site/data/memorable-quotes-generate',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {

							$quotes = array();
							$quote_id = 0;

							foreach ( $request['data']['settings']['memorableQuotesPosts'] as $post_id ) {

								$post = get_post( $post_id );

								if ( ! $post ) {
									continue;
								}

								// Configure the model to respond in JSON mode.
								$generation_config = new GenerationConfig(
									responseMimeType: 'application/json',
									responseSchema: array(
										'type'  => 'array',
										'items' => array(
											'type'       => 'object',
											'properties' => array(
												'quote'  => array(
													'type' => 'string',
												),
												'author' => array(
													'type' => 'string',
												),
											),
										),
									)
								);

								$chat = $this->gemini_client
												->geminiPro()
												->withGenerationConfig( $generation_config )
												->startChat(
													history: array(
														Content::parse( part: 'Here is a blog post I wrote.', role: Role::USER ),
														Content::parse( part: $post->post_content, role: Role::USER ),
													)
												);

								$response = $chat->sendMessage( 'Extract 3 quotes from this post. Each quote should be 10 to 20 words long. If there is a source for this quote return this in the author field, otherwise leave it blank.' );

								$generated_quotes = json_decode( $response->text() );

								foreach ( $generated_quotes as $generated_quote ) {
									// Check if we have a quote back - for short pages or empty pages we get empty strings.
									// TODO: validate quotes and authors exist here for V1.
									if ( ! empty( $generated_quote->quote ) ) {
										$quotes[] = array(
											'id'        => $quote_id++,
											'postID'    => $post_id,
											'quote'     => $generated_quote->quote,
											'author'    => property_exists( $generated_quote, 'author' ) && $generated_quote->author ? $generated_quote->author : '',
											'published' => false,
										);
									}
								}
							}

							// Save quotes to settings.
							$new_value = $this->gemini_settings->get();
							$new_value['memorableQuotesPosts'] = array_filter( $request['data']['settings']['memorableQuotesPosts'] );
							$new_value['memorableQuotes'] = array_filter( $quotes );
							$this->gemini_settings->set( $new_value );

							return new WP_REST_Response( $this->gemini_settings->get() );
						},
						'permission_callback' => $can_manage_options,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'settings' => array(
										'type'          => 'object',
										'required'      => true,
										'minProperties' => 1,
										'additionalProperties' => false,
										'properties'    => array(
											'memorableQuotesPosts' => array(
												'type' => 'array',
											),
										),
									),
								),
							),
						),
					),
				)
			),
			new REST_Route(
				'core/site/data/site-kit-assistant-chat-turns',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {

							$sitekit_assistant_contexts = array(
								'NEW',
								'KEY_METRICS',
								'DOCUMENTATION',
							);

							$chat_context = 'UNKNOWN';
							$prompt = $request['data']['settings']['prompt'];
							$chat_turns = $request['data']['settings']['chatTurns'];

							// Decide the context of the chat in order to guide the model context and prompts for the question.
							// if ( $chat_context === 'NEW' ) { // Always recheck context.
							$generation_config = new GenerationConfig(
								responseMimeType: 'application/json',
								responseSchema: array(
									'type'       => 'object',
									'properties' => array(
										// TODO: extract these from a constant as we expand capabilities.
										'KEY_METRICS'   => array(
											'type' => 'boolean',
										),
										'DOCUMENTATION' => array(
											'type' => 'boolean',
										),
										'UNKNOWN'       => array(
											'type' => 'boolean',
										),
									),
								)
							);

							$chat = $this->gemini_client
									->geminiPro()
									->withGenerationConfig( $generation_config )
									->startChat(
										history: array(
											// TODO: extract and build the prompt from a constant as we expand capabilities.
											Content::parse( part: 'I am a targeted classifier. Based on your question I will select one and only one context. If the users question is about key metrics, analytics, data, I will respond setting "KEY_METRICS" to true, a key metrics query might contain a date range. If the users question is about documentation, how to use the plugin, how to use the website, how to use Google Services, I will respond setting "DOCUMENTATION" to true. If there is a low confidence in the answer, I will respond setting "UNKNOWN" to true.', role: Role::MODEL ),
											Content::parse( part: 'The next user message will be the question.', role: Role::MODEL ),
										)
									);

							$response = $chat->sendMessage( $prompt );

							$new_chat_context = json_decode( $response->text() );
							foreach ( $new_chat_context as $key => $value ) {
								if ( true === $value && in_array( $key, $sitekit_assistant_contexts, true ) ) {
									$chat_context = $key;
								}
							}

							// End context classification.

							// Call the Gemini API with configuration based on the identified context.
							switch ( $chat_context ) {
								case 'KEY_METRICS':
									// Create a array containing each possible key metric from the CSV.
									$key_metrics_widget_properties = array();
									$key_metrics_prompt_context = '';

									// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
									$csv_file = fopen( __DIR__ . '/data/key-metrics.csv', 'r' );
									if ( false !== $csv_file ) {
										$row = 0;
										// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
										while ( false !== ( $data = fgetcsv( $csv_file, 1000, ',' ) ) ) {
											$num = count( $data );
											if ( $num > 2 && $row > 0 ) {
												$key_metrics_widget_properties[ $data[3] ] = array(
													'type' => 'boolean',
												);
												$key_metrics_prompt_context = $key_metrics_prompt_context . ' If the users question is about ' . $data[1] . ' ' . $data[7] . ', I will respond setting "' . $data[3] . '" to true. ';
											}
											$row++;
										}
										// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
										fclose( $csv_file );
									}

									$generation_config = new GenerationConfig(
										responseMimeType: 'application/json',
										responseSchema: array(
											'type'       => 'object',
											'properties' => array_merge(
												$key_metrics_widget_properties,
												array(
													'startDate' => array(
														'type' => 'string',
													),
													'endDate'   => array(
														'type' => 'string',
													),
													'compareStartDate'  => array(
														'type' => 'string',
													),
													'compareEndDate'    => array(
														'type' => 'string',
													),
													'compareDateRanges' => array(
														'type' => 'boolean',
													),
												)
											),
										)
									);

									// TODO: load the full history into the context so that the model can answer with context to previous questions.
									$chat = $this->gemini_client
											->geminiPro()
											->withGenerationConfig( $generation_config )
											->startChat(
												history: array(
													Content::parse( part: 'I am a targeted classifier. Based on your question I will select one and only one key metric widget to display. ' . $key_metrics_prompt_context . ' I identify a start and end date to show the metric, defaulting to a range of 30 days. I will always return both startDate and endDate. If you ask to compare two date ranges I will return true for compareDateRanges and return a compareStartDate and compareEndDate. Todays date is ' . gmdate( 'Y-m-d' ) . '.', role: Role::MODEL ),
													Content::parse( part: 'The next user message will be the question.', role: Role::MODEL ),
												)
											);

									$response = $chat->sendMessage( $prompt );

									$key_metrics_response = json_decode( $response->text() );

									// Strip start and end date from response.
									$key_metric_to_show = false;
									foreach ( $key_metrics_response as $key => $value ) {
										if ( true === $value && in_array( $key, array_keys( $key_metrics_widget_properties ), true ) ) {
											$key_metric_to_show = $key;
										}
									}

									if ( false === $key_metric_to_show ) {
										$chat_turns[] = array(
											'role'  => 'model',
											'parts' => array(
												array(
													'text' => 'I\'m not sure how to show you that data.',
												),
											),
										);
									} else {
										$chat_turns[] = array(
											'role'  => 'model',
											'parts' => array(
												array(
													'text' => 'Here\'s what I found...',
												),
											),
										);
										// Insert a special key metrics part to show the selected metric in the chat flow.
										$chat_turns[] = array(
											'role'  => 'model',
											'parts' => array(
												array(
													'keyMetricSlug' => $key_metric_to_show,
													// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
													'startDate' => strtotime( $key_metrics_response->startDate ),
													'endDate' => strtotime( $key_metrics_response->endDate ), // TODO: model never returns these elements so need to refactor this, possibly adapt the prompts.
													'compareStartDate' => $key_metrics_response->compareStartDate,
													'compareEndDate' => strtotime( $key_metrics_response->compareEndDate ),
													'compareDateRanges' => strtotime( $key_metrics_response->compareDateRanges ),
													// phpcs:enable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
												),
											),
										);
									}
									break;
								case 'DOCUMENTATION':
									// TODO: load docs into context and prompt question.
									// Ran out of time in hackathon 1 September 2024.
									break;
								default:
									// Return generic unknown response.
									$chat_turns[] = array(
										'role'  => 'model',
										'parts' => array(
											array(
												'text' => 'I\'m not sure how to answer this question',
											),
										),
									);
									$chat_turns[] = array(
										'role'  => 'model',
										'parts' => array(
											array(
												'text' => 'Try asking about a metric on your site like "how many page views did I have in January this year"',
											),
										),
									);
									$chat_turns[] = array(
										'role'  => 'model',
										'parts' => array(
											array(
												'text' => 'Or "how do I set up Ads conversion tracking for the Google Ads I\'m running"',
											),
										),
									);
									break;
							}

							return new WP_REST_Response(
								array(
									'chatTurns'   => $chat_turns,
									'chatContext' => $chat_context,
								)
							);
						},
						'permission_callback' => $can_manage_options,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'settings' => array(
										'type'          => 'object',
										'required'      => true,
										'minProperties' => 1,
										'additionalProperties' => false,
										'properties'    => array(
											'prompt'    => array(
												'type' => 'string',
											),
											'chatTurns' => array(
												'type' => 'array',
											),
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
