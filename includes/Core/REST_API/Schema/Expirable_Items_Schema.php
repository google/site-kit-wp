<?php
/**
 * Class Google\Site_Kit\Core\REST_API\Schema\Expirable_Items_Schema
 *
 * @package   Google\Site_Kit\Core\REST_API\Schema
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API\Schema;

/**
 * Class for the REST schema of the expirable items.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Expirable_Items_Schema {

	/**
	 * Gets the REST schema of the expirable items.
	 *
	 * @since n.e.x.t
	 *
	 * @return array REST schema.
	 */
	public static function get() {
		return array(
			'$schema'              => 'http://json-schema.org/draft-04/schema#',
			'title'                => 'expirable-items',
			'description'          => __( 'Expirable items of the current user, by slug.', 'google-site-kit' ),
			'type'                 => 'object',
			'additionalProperties' => array(
				'type'        => 'integer',
				'description' => __( 'Unix time at which the item expires.', 'google-site-kit' ),
			),
		);
	}
}
