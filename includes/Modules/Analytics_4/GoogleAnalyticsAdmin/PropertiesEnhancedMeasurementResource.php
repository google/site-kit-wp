<?php
/**
 * Class PropertiesEnhancedMeasurementResource
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin;

use Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin\EnhancedMeasurementSettingsModel;
use Google\Site_Kit_Dependencies\Google\Service\Resource;

/**
 * The "enhancedMeasurementSettings" collection of methods.
 */
class PropertiesEnhancedMeasurementResource extends Resource {

	/**
	 * Returns the singleton enhanced measurement settings for this web stream. Note
	 * that the stream must enable enhanced measurement for these settings to take
	 * effect. (webDataStreams.getEnhancedMeasurementSettings)
	 *
	 * @since 1.110.0
	 *
	 * @param string $name Required. The name of the settings to lookup. Format: properties/{property_id}/webDataStreams/{stream_id}/enhancedMeasurementSettings
	 *                               Example: "properties/1000/webDataStreams/2000/enhancedMeasurementSettings".
	 * @param array  $opt_params Optional parameters.
	 * @return EnhancedMeasurementSettingsModel
	 */
	public function getEnhancedMeasurementSettings( $name, $opt_params = array() ) {
		$params = array( 'name' => $name );
		$params = array_merge( $params, $opt_params );
		return $this->call( 'getEnhancedMeasurementSettings', array( $params ), EnhancedMeasurementSettingsModel::class );
	}

	/**
	 * Updates the singleton enhanced measurement settings for this web stream. Note
	 * that the stream must enable enhanced measurement for these settings to take
	 * effect. (webDataStreams.updateEnhancedMeasurementSettings)
	 *
	 * @param string                           $name Output only. Resource name of this Data Stream. Format: properties/{property_id}/webDataStreams/{stream_id}/enhancedMeasurementSettings
	 *                                         Example: "properties/1000/webDataStreams/2000/enhancedMeasurementSettings".
	 * @param EnhancedMeasurementSettingsModel $post_body The body of the request.
	 * @param array                            $opt_params Optional parameters.
	 *
	 * @opt_param string updateMask Required. The list of fields to be updated.
	 * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
	 * will not be updated. To replace the entire entity, use one path with the
	 * string "*" to match all fields.
	 * @return EnhancedMeasurementSettingsModel
	 */
	public function updateEnhancedMeasurementSettings( $name, EnhancedMeasurementSettingsModel $post_body, $opt_params = array() ) {
		$params = array(
			'name'     => $name,
			'postBody' => $post_body,
		);
		$params = array_merge( $params, $opt_params );
		return $this->call( 'updateEnhancedMeasurementSettings', array( $params ), EnhancedMeasurementSettingsModel::class );
	}
}
