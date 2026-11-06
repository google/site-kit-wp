<?php
/**
 * Class Google\Site_Kit\Core\REST_API\Schema\Dismissed_Slugs_Schema
 *
 * @package   Google\Site_Kit\Core\REST_API\Schema
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API\Schema;

/**
 * Class for the REST schema of a list of dismissed slugs.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Dismissed_Slugs_Schema {

	/**
	 * Gets the REST schema of a list of dismissed slugs.
	 *
	 * @since n.e.x.t
	 *
	 * @return array REST schema.
	 */
	public static function get() {
		return array(
			'$schema'     => 'http://json-schema.org/draft-04/schema#',
			'title'       => 'dismissed-slugs',
			'description' => __( 'Slugs the current user has dismissed.', 'google-site-kit' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
		);
	}
}
