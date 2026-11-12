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

use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use WP_Error;
use WP_REST_Request;
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
	 * Validates a request argument against its schema, on every WordPress version Site Kit supports.
	 *
	 * WordPress checks `required` on a property of an object, `minLength`, `minItems` and `maxItems` only
	 * from 5.5, and `minProperties` only from 5.6. So once WordPress's own check passes, this checks those
	 * keywords too. WordPress 5.6 and later check them first, so this can go once Site Kit requires 5.6.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed           $value   Value of the argument.
	 * @param WP_REST_Request $request Request the argument belongs to.
	 * @param string          $param   Name of the argument.
	 * @return true|WP_Error True where the value is valid, otherwise the error that rejects it.
	 */
	public static function validate_request_arg( $value, WP_REST_Request $request, $param ) {
		$is_valid = rest_validate_request_arg( $value, $request, $param );
		if ( is_wp_error( $is_valid ) ) {
			return $is_valid;
		}

		if ( ! self::is_valid_by_keywords_older_versions_skip( $value, $request->get_attributes()['args'][ $param ] ) ) {
			return ( new Invalid_Param_Exception( $param ) )->to_wp_error();
		}

		return true;
	}

	/**
	 * Checks a value against five schema keywords that WordPress checks only from 5.5 or 5.6.
	 *
	 * Those are `required` on a property of an object, `minLength`, `minItems`, `maxItems` and `minProperties`.
	 * It walks `properties` and `items` as WordPress does. It checks no type, because WordPress's own check
	 * of the value runs first.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value  Value to check.
	 * @param array $schema Schema of the value.
	 * @return bool True where the value meets each of those keywords, otherwise false.
	 */
	private static function is_valid_by_keywords_older_versions_skip( $value, array $schema ) {
		if ( 'array' === $schema['type'] ) {
			// WordPress reads a scalar sent for an array as a list separated by commas.
			$items = is_array( $value ) ? $value : wp_parse_list( $value );

			if ( isset( $schema['minItems'] ) && count( $items ) < $schema['minItems'] ) {
				return false;
			}

			if ( isset( $schema['maxItems'] ) && count( $items ) > $schema['maxItems'] ) {
				return false;
			}

			if ( isset( $schema['items'] ) ) {
				foreach ( $items as $item ) {
					if ( ! self::is_valid_by_keywords_older_versions_skip( $item, $schema['items'] ) ) {
						return false;
					}
				}
			}
		}

		if ( 'object' === $schema['type'] ) {
			// WordPress reads an empty string as an empty object from 5.4, and a stdClass as an array.
			$properties = '' === $value ? array() : (array) $value;

			foreach ( $schema['properties'] ?? array() as $name => $property ) {
				$is_missing = ! array_key_exists( $name, $properties );

				if ( $is_missing && true === ( $property['required'] ?? false ) ) {
					return false;
				}

				if ( ! $is_missing && ! self::is_valid_by_keywords_older_versions_skip( $properties[ $name ], $property ) ) {
					return false;
				}
			}

			if ( isset( $schema['minProperties'] ) && count( $properties ) < $schema['minProperties'] ) {
				return false;
			}
		}

		if ( 'string' === $schema['type'] && isset( $schema['minLength'] ) ) {
			return mb_strlen( $value ) >= $schema['minLength'];
		}

		return true;
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
	 * @since n.e.x.t Defaults the validate callback to {@see REST_Route::validate_request_arg()}.
	 *
	 * @param array $data {
	 *     Request argument data.
	 *
	 *     @type string   $type              Data type of the argument. Default 'string'.
	 *     @type string   $description       Public description of the argument. Default empty string.
	 *     @type callable $validate_callback Callback to validate the argument. Default
	 *                                       {@see REST_Route::validate_request_arg()}.
	 *     @type callable $sanitize_callback Callback to sanitize the argument. Default
	 *                                       {@see rest_sanitize_request_arg()}.
	 *     @type bool     $required          Whether the argument is required. Default false.
	 *     @type mixed    $default           Default value for the argument, if any. Default none.
	 *     @type array    $enum              Allowlist of possible values to validate against. Default none.
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
				'validate_callback' => array( self::class, 'validate_request_arg' ),
				'sanitize_callback' => 'rest_sanitize_request_arg',
				'required'          => false,
				'default'           => null,
			)
		);
	}
}
