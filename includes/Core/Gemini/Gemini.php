<?php
/**
 * Class Google\Site_Kit\Core\Gemini\Gemini
 *
 * @package   Google\Site_Kit\Core\Gemini
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Gemini;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use WP_Query;

use Google\Site_Kit\Core\Storage\Data_Encryption;

use Google\Site_Kit_Dependencies\Gemini as Gemini_API;
use Google\Site_Kit_Dependencies\Gemini\Data\GenerationConfig;
use Google\Site_Kit_Dependencies\Gemini\Data\Content;
use Google\Site_Kit_Dependencies\Gemini\Enums\Role;

/**
 * Class for handling Consent Mode.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Gemini {
	use Method_Proxy_Trait;

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * Gemini_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Gemini_Settings
	 */
	protected $gemini_settings;

	/**
	 * Gemini API Client instance.
	 *
	 * @since n.e.x.t
	 * @var Gemini
	 */
	private $gemini_client;

	/**
	 * REST_Gemini_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_Gemini_Controller
	 */
	protected $rest_controller;

	/**
	 * Cron hook name.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	const GEMINI_CRON = 'google-site-kit-memorable-quotes';

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, Options $options = null ) {
		$this->context         = $context;
		$options               = $options ?: new Options( $context );
		$this->gemini_settings = new Gemini_Settings( $options );
		$this->rest_controller = new REST_Gemini_Controller( $this->gemini_settings );

		// Get API Key from settings.
		$settings = $this->gemini_settings->get();

		// Decrypt it to use with the Gemini API.
		$encryption = new Data_Encryption();
		if ( is_array( $settings ) && array_key_exists( 'APIKey', $settings ) && $settings['APIKey'] ) {
			$api_key             = $encryption->decrypt( $settings['APIKey'] );
			$this->gemini_client = Gemini_API::client( $api_key ); // TODO: handle API errors such as invalid API key or account not activated.
		}

		// Force auto updates to be disabled for testing to prevent this test build from being replaced by a production build.
		add_filter( 'auto_update_plugin', '__return_false' );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->gemini_settings->register();
		$this->rest_controller->register();

		add_action( 'init', array( $this, 'gemini_block_init' ) );
		add_action( 'admin_init', array( $this, 'gemini_cron' ) );
		add_action( self::GEMINI_CRON . '_hook', array( $this, 'gemini_cron_action' ) );
	}

	/**
	 * Initializes the block for displaying memorable quotes.
	 *
	 * @since n.e.x.t
	 * @return void
	 */
	public function gemini_block_init() {
		register_block_type(
			__DIR__ . '/../../../blocks/build/memorable-quotes',
			array(
				'render_callback' => array( $this, 'gemini_memorable_quotes_block_dynamic_render_callback' ),
			)
		);
	}

	/**
	 * Render callback for the Memorable Quotes block.
	 *
	 * @since n.e.x.t
	 * @return string Rendered block.
	 */
	public function gemini_memorable_quotes_block_dynamic_render_callback() {
		$settings         = $this->gemini_settings->get();
		$memorable_quotes = $settings['memorableQuotes'];

		$published_memorable_quotes = array_filter(
			$memorable_quotes,
			function ( $quote ) {
				return $quote['published'];
			}
		);

		if ( empty( $published_memorable_quotes ) ) {
			return '';
		}

		$output = '<div ' . get_block_wrapper_attributes() . '>';
		foreach ( $published_memorable_quotes as $key => $quote ) {
			$output .= '<div>';
			$output .= sprintf(
				'<a class="google-site-kit-memorable-quote" href="%1$s">&quot;%2$s&quot;</a> %3$s',
				esc_url( get_permalink( $quote['postID'] ) . '#:~:text=' . $quote['quote'] ),
				esc_html( $quote['quote'] ),
				esc_html( ! empty( $quote['author'] ) ? ' - ' . $quote['author'] : '' ),
			);
			$output .= '</div>';

		}
		$output .= '</div>';

		return $output;
	}

	/**
	 * Schedules the Gemini quotes to be refreshed.
	 *
	 * @since n.e.x.t
	 * @return void
	 */
	public function gemini_cron() {
		$settings = $this->gemini_settings->get();

		// Set up the cron if memorableQuotesAutoPublish is true and the cron is not already set.
		if ( $settings['memorableQuotesAutoPublish'] && ! wp_next_scheduled( self::GEMINI_CRON ) ) {
			wp_schedule_event( time(), 'twicedaily', self::GEMINI_CRON );
		}

		// Remove the cron if memorableQuotesAutoPublish is false and the cron is set.
		if ( ! $settings['memorableQuotesAutoPublish'] && wp_next_scheduled( self::GEMINI_CRON ) ) {
			$timestamp = wp_next_scheduled( self::GEMINI_CRON );
			wp_unschedule_event( $timestamp, self::GEMINI_CRON );
		}

		// TODO: we should disable the cron on plugin deactivation.
	}

	/**
	 * Executes the Gemini quotes cron action.
	 *
	 * @since n.e.x.t
	 * @return void
	 */
	public function gemini_cron_action() {
		$settings = $this->gemini_settings->get();

		if ( ! $settings['memorableQuotesAutoPublish'] ) {
			return;
		}

		// Get the most recent post configured for quotes.
		$most_recent_generated_post = get_the_date( 'c', max( $settings['memorableQuotesPosts'] ) );
		if ( ! $most_recent_generated_post ) {
			$most_recent_generated_post = time() - ( 60 * 60 * 24 * 30 ); // 30 days
		}

		$args         = array(
			'post_type'   => 'post',
			'post_status' => 'publish',
			'date_query'  => array(
				'after' => $most_recent_generated_post,
			),
		);
		$custom_query = new WP_Query( $args );

		$quote_id             = time();
		$newly_selected_posts = array();

		// Generate Quotes for each post.
		foreach ( $custom_query->posts as $post ) {

			$newly_selected_posts = array_merge( $newly_selected_posts, array( $post->ID ) );

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

			$first_quote = true;

			foreach ( $generated_quotes as $generated_quote ) {
				// Check if we have a quote back - for short pages or empty pages we get empty strings.
				// TODO: validate quotes and authors exist here for V1.
				if ( ! empty( $generated_quote->quote ) ) {
					$quotes[]    = array(
						'id'        => $quote_id++,
						'postID'    => $post->ID,
						'quote'     => $generated_quote->quote,
						'author'    => property_exists( $generated_quote, 'author' ) && $generated_quote->author ? $generated_quote->author : '',
						'published' => $first_quote,
					);
					$first_quote = false;
				}
			}
		}

		// Save quotes to settings.
		$new_value                         = $this->gemini_settings->get();
		$new_value['memorableQuotesPosts'] = array_merge( $new_value['memorableQuotesPosts'], $newly_selected_posts );
		$new_value['memorableQuotes']      = array_merge( $new_value['memorableQuotes'], $quotes );
		$this->gemini_settings->set( $new_value );
	}
}
