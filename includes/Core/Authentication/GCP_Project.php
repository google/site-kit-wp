<?php
/**
 * Class Google\Site_Kit\Core\Authentication\GCP_Project
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\Options;

/**
 * Class controlling the Site Kit Google Cloud Platform project.
 *
 * @since 0.1.0
 */
final class GCP_Project {

	const OPTION = 'googlesitekit_gcp_project';

	/**
	 * Options object.
	 *
	 * @since 1.0.0
	 * @var Options
	 */
	private $options;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Options $options Options instance.
	 */
	public function __construct( Options $options ) {
		$this->options = $options;
	}

	/**
	 * Checks whether a GCP project is set.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if a project is set.
	 */
	public function has() {
		$data = $this->get();
		return ! empty( $data['id'] );
	}

	/**
	 * Retrieves the GCP project.
	 *
	 * @since 1.0.0
	 *
	 * @return array Project data.
	 */
	public function get() {
		$data = $this->options->get( self::OPTION );

		return $this->parse_defaults( $data );
	}

	/**
	 * Saves the GCP project.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data {
	 *     Project data.
	 *
	 *     @type string $id          The project ID.
	 *     @type int    $wp_owner_id The WordPress user ID of the owner.
	 * }
	 * @return bool True on success, false on failure.
	 */
	public function set( $data ) {
		$data = $this->parse_defaults( $data );

		return $this->options->set( self::OPTION, $data );
	}

	/**
	 * Parses GCP project data with its defaults.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $data Project data.
	 * @return array Parsed $data.
	 */
	private function parse_defaults( $data ) {
		$defaults = array(
			'id'          => '',
			'wp_owner_id' => 0,
		);

		if ( ! is_array( $data ) ) {
			return $defaults;
		}

		$data                = wp_parse_args( $data, $defaults );
		$data['wp_owner_id'] = (int) $data['wp_owner_id'];

		return $data;
	}
}
