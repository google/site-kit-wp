<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Exception;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Tag;
use Google\Site_Kit\Core\Modules\Module_With_Tag_Trait;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Site_Health\Debug_Data;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Guard;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Matchers;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Web_Tag;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle as Google_Service_SubscribewithGoogle;

/**
 * Class representing the Reader Revenue Manager module.
 *
 * @since 1.130.0
 * @access private
 * @ignore
 */
final class Reader_Revenue_Manager extends Module implements Module_With_Scopes, Module_With_Assets, Module_With_Service_Entity, Module_With_Deactivation, Module_With_Owner, Module_With_Settings, Module_With_Tag, Module_With_Debug_Fields {
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;
	use Module_With_Tag_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'reader-revenue-manager';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.130.0
	 */
	public function register() {
		$this->register_scopes_hook();

		// Reader Revenue Manager tag placement logic.
		add_action( 'template_redirect', array( $this, 'register_tag' ) );
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.130.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/subscribewithgoogle.publications.readonly',
		);
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since 1.131.0
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	public function setup_services( Google_Site_Kit_Client $client ) {
		return array(
			'subscribewithgoogle' => new Google_Service_SubscribewithGoogle( $client ),
		);
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * @since 1.132.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$options = $this->get_settings()->get();

		if ( ! empty( $options['publicationID'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.132.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.132.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Checks if the current user has access to the current configured service entity.
	 *
	 * @since 1.131.0
	 *
	 * @return boolean|WP_Error
	 */
	public function check_service_entity_access() {
		/**
		 * Get the SubscribewithGoogle service instance.
		 *
		 * @var Google_Service_SubscribewithGoogle
		 */
		$subscribewithgoogle = $this->get_service( 'subscribewithgoogle' );

		try {
			$subscribewithgoogle->publications->listPublications(
				array(
					'pageSize' => 1,
				)
			);
		} catch ( Exception $e ) {
			if ( $e->getCode() === 403 ) {
				return false;
			}
			return $this->exception_to_error( $e );
		}

		return true;
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.131.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:publications' => array( 'service' => 'subscribewithgoogle' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.131.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 *
	 * @throws Invalid_Datapoint_Exception Thrown if the datapoint does not exist.
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:publications':
				/**
				 * Get the SubscribewithGoogle service instance.
				 *
				 * @var Google_Service_SubscribewithGoogle
				 */
				$subscribewithgoogle = $this->get_service( 'subscribewithgoogle' );
				return $subscribewithgoogle->publications->listPublications( array( 'filter' => $this->get_publication_filter() ) );
		}

		return parent::create_data_request( $data );
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.131.0
	 *
	 * @param Data_Request $data     Data request object.
	 * @param mixed        $response Request response.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:publications':
				$publications = $response->getPublications();
				return array_values( $publications );
		}

		return parent::parse_data_response( $data, $response );
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.130.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Reader Revenue Manager', 'Service name', 'google-site-kit' ),
			'description' => __( 'Reader Revenue Manager helps publishers grow, retain, and engage their audiences, creating new revenue opportunities', 'google-site-kit' ),
			'order'       => 5,
			'homepage'    => __( 'https://readerrevenue.withgoogle.com/', 'google-site-kit' ),
		);
	}

	/**
	 * Gets the filter for retrieving publications for the current site.
	 *
	 * @since 1.131.0
	 *
	 * @return string Permutations for site hosts or URL.
	 */
	private function get_publication_filter() {
		$sc_settings    = $this->options->get( Search_Console_Settings::OPTION );
		$sc_property_id = $sc_settings['propertyID'];
		$raw_url        = str_replace(
			array( 'sc-domain:', 'https://', 'http://', 'www.' ),
			'',
			$sc_property_id
		);

		if ( 0 === strpos( $sc_property_id, 'sc-domain:' ) ) { // Domain property.
			$filter = join(
				' OR ',
				array_map(
					function ( $host ) {
						return sprintf( 'domain = "%s"', $host );
					},
					URL::permute_site_hosts( $raw_url )
				)
			);
		} else { // URL property.
			$filter = join(
				' OR ',
				array_map(
					function ( $host ) {
						return sprintf( 'site_url = "%s"', $host );
					},
					URL::permute_site_url( $raw_url )
				)
			);
		}

		return $filter;
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.131.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-reader-revenue-manager',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-reader-revenue-manager.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);
	}

	/**
	 * Returns the Module_Tag_Matchers instance.
	 *
	 * @since 1.132.0
	 *
	 * @return Module_Tag_Matchers Module_Tag_Matchers instance.
	 */
	public function get_tag_matchers() {
		return new Tag_Matchers();
	}

	/**
	 * Registers the Reader Revenue Manager tag.
	 *
	 * @since 1.132.0
	 */
	public function register_tag() {
		$module_settings = $this->get_settings();
		$settings        = $module_settings->get();

		$tag = new Web_Tag( $settings['publicationID'], self::MODULE_SLUG );

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( new Tag_Guard( $module_settings ) );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

		if ( ! $tag->can_register() ) {
			return;
		}

		$tag->register();
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.132.0
	 *
	 * @return array An array of all debug fields.
	 */
	public function get_debug_fields() {
		$settings = $this->get_settings()->get();

		return array(
			'reader_revenue_manager_publication_id' => array(
				'label' => __( 'Reader Revenue Manager publication ID', 'google-site-kit' ),
				'value' => $settings['publicationID'],
				'debug' => Debug_Data::redact_debug_value( $settings['publicationID'] ),
			),
			'reader_revenue_manager_publication_onboarding_state' => array(
				'label' => __( 'Reader Revenue Manager publication onboarding state', 'google-site-kit' ),
				'value' => $settings['publicationOnboardingState'],
				'debug' => $settings['publicationOnboardingState'],
			),
			'reader_revenue_manager_publication_onboarding_state_last_synced_at' => array(
				'label' => __( 'Reader Revenue Manager publication onboarding state last synced at', 'google-site-kit' ),
				'value' => $settings['publicationOnboardingStateLastSyncedAtMs'] ? gmdate( 'Y-m-d H:i:s', $settings['publicationOnboardingStateLastSyncedAtMs'] / 1000 ) : __( 'Never synced', 'google-site-kit' ),
				'debug' => $settings['publicationOnboardingStateLastSyncedAtMs'],
			),
		);
	}
}
