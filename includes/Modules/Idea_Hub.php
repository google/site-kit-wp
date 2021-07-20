<?php
/**
 * Class Google\Site_Kit\Modules\Idea_Hub
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Persistent_Registration;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Post_Meta;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Idea_Hub\Post_Idea_Name;
use Google\Site_Kit\Modules\Idea_Hub\Post_Idea_Text;
use Google\Site_Kit\Modules\Idea_Hub\Post_Idea_Topics;
use Google\Site_Kit\Modules\Idea_Hub\Settings;
use Google\Site_Kit_Dependencies\Google\Service\Ideahub as Google_Service_Ideahub;
use Google\Site_Kit_Dependencies\Google\Service\Ideahub\GoogleSearchIdeahubV1alphaIdeaState as Google_Service_Ideahub_GoogleSearchIdeahubV1alphaIdeaState;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the Idea Hub module.
 *
 * @since 1.32.0
 * @access private
 * @ignore
 */
final class Idea_Hub extends Module
	implements Module_With_Scopes, Module_With_Settings, Module_With_Debug_Fields, Module_With_Assets, Module_With_Deactivation, Module_With_Persistent_Registration {
	use Module_With_Assets_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'idea-hub';

	/**
	 * Post_Idea_Name instance.
	 *
	 * @var Post_Idea_Name
	 */
	private $post_name_setting;

	/**
	 * Post_Idea_Text instance.
	 *
	 * @var Post_Idea_Text
	 */
	private $post_text_setting;

	/**
	 * Post_Idea_Topics instance.
	 *
	 * @var Post_Idea_Topics
	 */
	private $post_topic_setting;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Optional. Option API instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 */
	public function __construct( Context $context, Options $options = null, User_Options $user_options = null, Authentication $authentication = null ) {
		parent::__construct( $context, $options, $user_options, $authentication );

		$post_meta                = new Post_Meta();
		$this->post_name_setting  = new Post_Idea_Name( $post_meta );
		$this->post_text_setting  = new Post_Idea_Text( $post_meta );
		$this->post_topic_setting = new Post_Idea_Topics( $post_meta );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register_persistent() {
		/**
		 * Changes the posts view to have a custom label in place of Draft for Idea Hub Drafts.
		 */
		add_filter(
			'display_post_states',
			function( $post_states, $post ) {
				if ( 'draft' !== $post->post_status ) {
					return $post_states;
				}
				$idea = $this->get_post_idea( $post->ID );
				if ( is_null( $idea ) ) {
					return $post_states;
				}
				/* translators: %s: Idea Hub Idea Title */
				$post_states['draft'] = sprintf( __( 'Idea Hub Draft “%s”', 'google-site-kit' ), $idea['text'] );
				return $post_states;
			},
			10,
			2
		);

		/**
		 * Allows us to trash / modify empty idea posts.
		 */
		add_filter(
			'wp_insert_post_empty_content',
			function( $maybe_empty, $postarr ) {
				if ( isset( $postarr['ID'] ) && $this->is_idea_post( $postarr['ID'] ) ) {
					return false;
				}
				return $maybe_empty;
			},
			10,
			2
		);

	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.32.0
	 */
	public function register() {
		$this->register_scopes_hook();

		$this->post_name_setting->register();
		$this->post_text_setting->register();
		$this->post_topic_setting->register();
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.32.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/ideahub.read',
		);
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.32.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$required_keys = array( 'tosAccepted' );

		$options = $this->get_settings()->get();
		foreach ( $required_keys as $required_key ) {
			if ( empty( $options[ $required_key ] ) ) {
				return false;
			}
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.32.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.32.0
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$settings = $this->get_settings()->get();

		return array();
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.32.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'POST:create-idea-draft-post' => array( 'service' => '' ),
			'GET:draft-post-ideas'        => array( 'service' => '' ),
			'GET:new-ideas'               => array( 'service' => 'ideahub' ),
			'GET:published-post-ideas'    => array( 'service' => '' ),
			'GET:saved-ideas'             => array( 'service' => 'ideahub' ),
			'POST:update-idea-state'      => array( 'service' => 'ideahub' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.32.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 *
	 * @throws Invalid_Datapoint_Exception Thrown if the datapoint does not exist.
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'POST:create-idea-draft-post':
				$expected_parameters = array(
					'name'   => 'string',
					'text'   => 'string',
					'topics' => 'array',
				);
				if ( ! isset( $data['idea'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'idea' ),
						array( 'status' => 400 )
					);
				}
				$idea = $data['idea'];
				foreach ( $expected_parameters as $parameter_name => $expected_parameter_type ) {
					if ( ! isset( $idea[ $parameter_name ] ) ) {
						return new WP_Error(
							'missing_required_param',
							/* translators: %s: Missing parameter name */
							sprintf( __( 'Request idea parameter is empty: %s.', 'google-site-kit' ), $parameter_name ),
							array( 'status' => 400 )
						);
					}
					$parameter_type = gettype( $idea[ $parameter_name ] );
					if ( $parameter_type !== $expected_parameter_type ) {
						return new WP_Error(
							'wrong_parameter_type',
							sprintf(
								/* translators: %1$s: parameter name, %2$s expected type, %3$s received type */
								__( 'Wrong parameter type for %1$s, expected %2$s, received %3$s', 'google-site-kit' ),
								$parameter_name,
								$expected_parameter_type,
								$parameter_type
							),
							array( 'status' => 400 )
						);
					}
				}

				return function() use ( $idea ) {
					// Allows us to create a blank post.
					add_filter( 'wp_insert_post_empty_content', '__return_false' );
					$post_id = wp_insert_post( array(), false );
					remove_filter( 'wp_insert_post_empty_content', '__return_false' );

					if ( 0 === $post_id ) {
						return new WP_Error(
							'unable_to_draft_post',
							__( 'Unable to draft post.', 'google-site-kit' ),
							array( 'status' => 400 )
						);
					}

					$this->set_post_idea( $post_id, $idea );

					return $post_id;
				};
			case 'GET:draft-post-ideas':
				return function() {
					$wp_query = new \WP_Query();

					return $wp_query->query(
						array(
							'fields'         => 'ids',
							'no_found_rows'  => true,
							'post_status'    => 'draft',
							'posts_per_page' => -1,
							'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
								'relation' => 'AND',
								array(
									'key' => Post_Idea_Name::META_KEY,
								),
								array(
									'key' => Post_Idea_Text::META_KEY,
								),
								array(
									'key' => Post_Idea_Topics::META_KEY,
								),
							),
						)
					);
				};
			case 'GET:new-ideas':
				return $this->fetch_ideas( 'new' );
			case 'GET:published-post-ideas':
				return function() {
					$wp_query = new \WP_Query();

					return $wp_query->query(
						array(
							'fields'         => 'ids',
							'no_found_rows'  => true,
							'posts_per_page' => -1,
							'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
								'relation' => 'AND',
								array(
									'key' => Post_Idea_Name::META_KEY,
								),
								array(
									'key' => Post_Idea_Text::META_KEY,
								),
								array(
									'key' => Post_Idea_Topics::META_KEY,
								),
							),
						)
					);
				};
			case 'GET:saved-ideas':
				return $this->fetch_ideas( 'saved' );
			case 'POST:update-idea-state':
				if ( ! isset( $data['name'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'name' ),
						array( 'status' => 400 )
					);
				}

				if ( ! isset( $data['saved'] ) && ! isset( $data['dismissed'] ) ) {
					return new WP_Error(
						'missing_required_param',
						__( 'Either "saved" or "dismissed" parameter must be provided.', 'google-site-kit' ),
						array( 'status' => 400 )
					);
				}

				$parent = $this->get_parent_slug();
				$body   = new Google_Service_Ideahub_GoogleSearchIdeahubV1alphaIdeaState();

				$body->setName( $data['name'] );

				if ( isset( $data['saved'] ) ) {
					$parent = $parent . '/ideaStates/saved';
					$body->setSaved( filter_var( $data['saved'], FILTER_VALIDATE_BOOLEAN ) );
				}

				if ( isset( $data['dismissed'] ) ) {
					$parent = $parent . '/ideaStates/dismissed';
					$body->setDismissed( filter_var( $data['dismissed'], FILTER_VALIDATE_BOOLEAN ) );
				}

				return $this->get_service( 'ideahub' )->platforms_properties_ideaStates->patch( $parent, $body );
		}

		return parent::create_data_request( $data );
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.34.0
	 *
	 * @param Data_Request $data     Data request object.
	 * @param mixed        $response Request response.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		$filter_draft_post_response = function( $post_id ) {
			return array_merge(
				array(
					'postID'      => $post_id,
					'postEditURL' => get_edit_post_link( $post_id, null ),
				),
				$this->get_post_idea( $post_id )
			);
		};

		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'POST:create-idea-draft-post':
				return $filter_draft_post_response( $response );
			case 'GET:draft-post-ideas':
				return array_filter(
					array_map(
						$filter_draft_post_response,
						is_array( $response ) ? $response : array( $response )
					)
				);
			case 'GET:new-ideas':
				return $response->getIdeas();
			case 'GET:published-post-ideas':
				return array_filter(
					array_map(
						function( $post_id ) {
							return array_merge(
								array(
									'postID'      => $post_id,
									'postEditURL' => get_edit_post_link( $post_id ),
									'postURL'     => get_permalink( $post_id ),
								),
								$this->get_post_idea( $post_id )
							);
						},
						is_array( $response ) ? $response : array( $response )
					)
				);
			case 'GET:saved-ideas':
				return $response->getIdeas();
			case 'POST:update-idea-state':
				return array(
					'name'      => $response->getName(),
					'saved'     => $response->getSaved(),
					'dismissed' => $response->getDismissed(),
				);
		}

		return parent::parse_data_response( $data, $response );
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.32.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Idea Hub', 'Service name', 'google-site-kit' ),
			'description' => __( "Idea Hub suggests what you can write about next, based on searches that haven't been answered yet", 'google-site-kit' ),
			'order'       => 7,
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.32.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.32.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-idea-hub',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-idea-hub.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
					),
				)
			),
			new Script(
				'googlesitekit-idea-hub-notice',
				array(
					'src'           => $base_url . 'js/googlesitekit-idea-hub-notice.js',
					'dependencies'  => array(
						'googlesitekit-i18n',
					),
					'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
				)
			),
		);
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since n.e.x.t
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs.
	 */
	protected function setup_services( Google_Site_Kit_Client $client ) {
		return array(
			'ideahub' => new Google_Service_Ideahub( $client ),
		);
	}

	/**
	 * Saves post idea settings.
	 *
	 * @since 1.33.0
	 *
	 * @param int   $post_id Post ID.
	 * @param array $idea    Idea settings.
	 */
	public function set_post_idea( $post_id, array $idea ) {
		$idea = wp_parse_args(
			$idea,
			array(
				'name'   => '',
				'text'   => '',
				'topics' => array(),
			)
		);

		$this->post_name_setting->set( $post_id, $idea['name'] );
		$this->post_text_setting->set( $post_id, $idea['text'] );
		$this->post_topic_setting->set( $post_id, $idea['topics'] );
	}

	/**
	 * Gets post idea settings.
	 *
	 * @since 1.33.0
	 *
	 * @param int $post_id Post ID.
	 * @return array|null Post idea settings array. Returns NULL if a post doesn't have an associated idea.
	 */
	public function get_post_idea( $post_id ) {
		$name   = $this->post_name_setting->get( $post_id );
		$text   = $this->post_text_setting->get( $post_id );
		$topics = $this->post_topic_setting->get( $post_id );
		if ( empty( $name ) || empty( $text ) || empty( $topics ) ) {
			return null;
		}

		return array(
			'name'   => $name,
			'text'   => $text,
			'topics' => $topics,
		);
	}

	/**
	 * Checks whether the post is an Idea Hub post.
	 *
	 * @since 1.36.0
	 *
	 * @param int $post_id Post ID.
	 * @return bool True if the post with supplied ID is an Idea Hub post.
	 */
	private function is_idea_post( $post_id ) {
		return is_array( $this->get_post_idea( $post_id ) );
	}

	/**
	 * Gets the parent slug to use for Idea Hub API requests.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Parent slug.
	 */
	private function get_parent_slug() {
		$reference_url = $this->context->get_reference_site_url();
		$reference_url = rawurlencode( $reference_url );

		$parent = "platforms/sitekit/properties/{$reference_url}";

		return $parent;
	}

	/**
	 * Fetches ideas from the Idea Hub API.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $type Ideas type. Valid values "saved", "new" or an empty string which means all ideas.
	 * @return mixed List ideas request.
	 */
	private function fetch_ideas( $type ) {
		$parent = $this->get_parent_slug();
		$params = array();

		if ( 'saved' === $type ) {
			$params['filter'] = 'saved(true)';
		} elseif ( 'new' === $type ) {
			$params['filter'] = 'saved(false)';
		}

		$service = $this->get_service( 'ideahub' );
		$ideas   = $service->platforms_properties_ideas;

		return $ideas->listPlatformsPropertiesIdeas( $parent, $params );
	}

}
