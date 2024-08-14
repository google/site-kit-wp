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
			$this->gemini_client = Gemini::client( $api_key );
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
											'author'    => $generated_quote->author ? $generated_quote->author : '',
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
		);
	}
}
