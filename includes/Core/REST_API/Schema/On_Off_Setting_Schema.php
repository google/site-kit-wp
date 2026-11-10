<?php
/**
 * Class Google\Site_Kit\Core\REST_API\Schema\On_Off_Setting_Schema
 *
 * @package   Google\Site_Kit\Core\REST_API\Schema
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API\Schema;

/**
 * Class for the REST schema of a setting that is on or off.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class On_Off_Setting_Schema {

	/**
	 * Gets the REST schema of a setting that is on or off.
	 *
	 * @since n.e.x.t
	 *
	 * @return array REST schema.
	 */
	public static function get() {
		return array(
			'$schema'     => 'http://json-schema.org/draft-04/schema#',
			'title'       => 'on-off-setting',
			'description' => __( 'A setting that is on or off.', 'google-site-kit' ),
			'type'        => 'object',
			'properties'  => array(
				'enabled' => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the setting is on.', 'google-site-kit' ),
				),
			),
		);
	}
}
