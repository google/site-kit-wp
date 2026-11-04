<?php
/**
 * Class Google\Site_Kit\Core\REST_API\Schema\Success_Schema
 *
 * @package   Google\Site_Kit\Core\REST_API\Schema
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API\Schema;

/**
 * Class for the REST schema of a reply that says a request succeeded.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Success_Schema {

	/**
	 * Gets the REST schema of a reply that says a request succeeded.
	 *
	 * @since n.e.x.t
	 *
	 * @return array REST schema.
	 */
	public static function get() {
		return array(
			'$schema'     => 'http://json-schema.org/draft-04/schema#',
			'title'       => 'success',
			'description' => __( 'A reply that says the request succeeded.', 'google-site-kit' ),
			'type'        => 'object',
			'properties'  => array(
				'success' => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the request succeeded.', 'google-site-kit' ),
				),
			),
		);
	}
}
