<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Report_Options\Audience_Config
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting\Report_Options;

use Google\Site_Kit\Core\User\Audience_Settings as User_Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings as Module_Audience_Settings;

/**
 * Helper that provides configured audience metadata/maps.
 *
 * @since n.e.x.t
 */
final class Audience_Config {

	/**
	 * User audience settings.
	 *
	 * @since n.e.x.t
	 *
	 * @var User_Audience_Settings
	 */
	private $user_settings;

	/**
	 * Module audience settings.
	 *
	 * @since n.e.x.t
	 *
	 * @var Module_Audience_Settings
	 */
	private $module_settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param User_Audience_Settings   $user_settings   User audience settings instance.
	 * @param Module_Audience_Settings $module_settings Module audience settings instance.
	 */
	public function __construct( User_Audience_Settings $user_settings, Module_Audience_Settings $module_settings ) {
		$this->user_settings   = $user_settings;
		$this->module_settings = $module_settings;
	}

	/**
	 * Gets configured custom audiences and metadata.
	 *
	 * @since n.e.x.t
	 *
	 * @return array {
	 *     @type array $resource_names Sanitized resource names.
	 *     @type array $audiences      Audience metadata list (resourceName/displayName).
	 * }
	 */
	public function get_configured_audiences() {
		$user_settings = $this->user_settings->get();
		$configured    = $this->sanitize_resource_names(
			$user_settings['configuredAudiences'] ?? array()
		);

		if ( empty( $configured ) ) {
			return array(
				'resource_names' => array(),
				'audiences'      => array(),
			);
		}

		$available     = $this->module_settings->get();
		$available     = is_array( $available ) ? $available : array();
		$available_map = array();

		foreach ( $available['availableAudiences'] ?? array() as $audience ) {
			if ( isset( $audience['name'] ) ) {
				$available_map[ $audience['name'] ] = $audience;
			}
		}

		$audience_metadata = array_map(
			function ( $resource_name ) use ( $available_map ) {
				$display_name = $available_map[ $resource_name ]['displayName'] ?? $resource_name;

				return array(
					'resourceName' => $resource_name,
					'displayName'  => $display_name,
				);
			},
			$configured
		);

		return array(
			'resource_names' => $configured,
			'audiences'      => $audience_metadata,
		);
	}

	/**
	 * Builds a map of Site Kit audience slugs to resource names.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_site_kit_audience_map() {
		$available = $this->module_settings->get();
		$available = is_array( $available ) ? $available : array();

		$map = array();

		foreach ( $available['availableAudiences'] ?? array() as $audience ) {
			if ( empty( $audience['audienceSlug'] ) || empty( $audience['name'] ) ) {
				continue;
			}
			$map[ $audience['audienceSlug'] ] = $audience['name'];
		}

		return $map;
	}

	/**
	 * Sanitizes a list of audience resource names.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $audience_resource_names Audience resource names.
	 * @return array Sanitized list.
	 */
	public function sanitize_resource_names( array $audience_resource_names ) {
		$audience_resource_names = array_filter(
			array_map(
				function ( $resource_name ) {
					$resource_name = is_string( $resource_name ) ? trim( $resource_name ) : '';
					return '' !== $resource_name ? $resource_name : null;
				},
				$audience_resource_names
			)
		);

		return array_values( array_unique( $audience_resource_names ) );
	}
}
