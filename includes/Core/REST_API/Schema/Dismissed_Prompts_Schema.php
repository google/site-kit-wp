<?php
/**
 * Class Google\Site_Kit\Core\REST_API\Schema\Dismissed_Prompts_Schema
 *
 * @package   Google\Site_Kit\Core\REST_API\Schema
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API\Schema;

/**
 * Class for the REST schema of the dismissed prompts.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Dismissed_Prompts_Schema {

	/**
	 * Gets the REST schema of the dismissed prompts.
	 *
	 * @since n.e.x.t
	 *
	 * @return array REST schema.
	 */
	public static function get() {
		return array(
			'$schema'              => 'http://json-schema.org/draft-04/schema#',
			'title'                => 'dismissed-prompts',
			'description'          => __( 'Prompts the current user dismissed, by slug.', 'google-site-kit' ),
			'type'                 => 'object',
			'additionalProperties' => array(
				'type'       => 'object',
				'properties' => array(
					'expires' => array(
						'type'        => 'integer',
						'description' => __( 'Unix time at which the dismissal expires, or 0 where it never expires.', 'google-site-kit' ),
					),
					'count'   => array(
						'type'        => 'integer',
						'description' => __( 'Number of times the current user dismissed the prompt.', 'google-site-kit' ),
					),
				),
			),
		);
	}
}
