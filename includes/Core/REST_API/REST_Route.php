<?php
/**
 * Class Google\Site_Kit\Core\REST_API\REST_Route
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API;

use WP_REST_Server;

/**
 * Class representing a single REST API route.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class REST_Route {

	/**
	 * Unique route URI.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	private $uri;

	/**
	 * Route arguments.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $args = array();

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param string $uri       Unique route URI.
	 * @param array  $endpoints {
	 *     List of one or more endpoint arrays for a specific method, with the following data.
	 *
	 *     @type string|array $methods             One or more methods that the endpoint applies to.
	 *     @type callable     $callback            Callback handling a request to the endpoint.
	 *     @type callable     $permission_callback Callback to check permissions for a request to the endpoint.
	 *     @type array        $args                Associative array of supported parameters and their requirements.
	 * }
	 * @param array  $args      {
	 *     Optional. Route options that typically include the following keys.
	 *
	 *     @type array $args   Associative array of globally supported parameters, e.g. those that are part of the URI.
	 *                         Default none.
	 *     @type array $schema Public item schema for the route. Default none.
	 */
	public function __construct( $uri, array $endpoints, array $args = array() ) {
		$this->uri = trim( $uri, '/' );

		$this->args = $args;

		if ( isset( $this->args['args'] ) ) {
			$this->args['args'] = $this->parse_param_args( $this->args['args'] );
		}

		// In case there are string arguments, this is only a single endpoint and needs to be turned into a list.
		if ( ! wp_is_numeric_array( $endpoints ) ) {
			$endpoints = array( $endpoints );
		}

		$endpoint_defaults = array(
			'methods'  => WP_REST_Server::READABLE,
			'callback' => null,
			'args'     => array(),
		);

		foreach ( $endpoints as $endpoint ) {
			$endpoint = wp_parse_args( $endpoint, $endpoint_defaults );

			$endpoint['args'] = $this->parse_param_args( $endpoint['args'] );
			if ( ! empty( $this->args['args'] ) ) {
				$endpoint['args'] = array_merge( $this->args['args'], $endpoint['args'] );
			}

			$this->args[] = $endpoint;
		}
	}

	/**
	 * Registers the REST route.
	 *
	 * @since 1.16.0
	 */
	public function register() {
		register_rest_route( REST_Routes::REST_ROOT, $this->get_uri(), $this->get_args() );
	}

	/**
	 * Gets the route URI.
	 *
	 * @since 1.0.0
	 *
	 * @return string Unique route URI.
	 */
	public function get_uri() {
		return $this->uri;
	}

	/**
	 * Gets the route arguments, including endpoints and schema.
	 *
	 * @since 1.0.0
	 *
	 * @return array Route arguments.
	 */
	public function get_args() {
		return $this->args;
	}

	/**
	 * Parses all supported request arguments and their data.
	 *
	 * @since 1.0.0
	 *
	 * @param array $args Associative array of $arg => $data pairs.
	 * @return array Parsed arguments.
	 */
	protected function parse_param_args( array $args ) {
		return array_map( array( $this, 'parse_param_arg' ), $args );
	}

	/**
	 * Parses data for a supported request argument.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data {
	 *     Request argument data.
	 *
	 *     @type string   $type              Data type of the argument. Default 'string'.
	 *     @type string   $description       Public description of the argument. Default empty string.
	 *     @†ype callable $validate_callback Callback to validate the argument. Default
	 *                                       {@see rest_validate_rest_arg()}.
	 *     @type callable $sanitize_callback Callback to sanitize the argument. Default
	 *                                       {@see rest_sanitize_rest_arg()}.
	 *     @type bool     $required          Whether the argument is required. Default false.
	 *     @type mixed    $default           Default value for the argument, if any. Default none.
	 *     @type array    $enum              Whitelist of possible values to validate against. Default none.
	 *     @type array    $items             Only if $type is 'array': Similar specification that applies to each item.
	 *     @type array    $properties        Only if $type is 'object'. Similar specification per property.
	 * }
	 * @return array Parsed data.
	 */
	protected function parse_param_arg( array $data ) {
		return wp_parse_args(
			$data,
			array(
				'type'              => 'string',
				'description'       => '',
				'validate_callback' => 'rest_validate_request_arg',
				'sanitize_callback' => 'rest_sanitize_request_arg',
				'required'          => false,
				'default'           => null,
			)
		);
	}
}
