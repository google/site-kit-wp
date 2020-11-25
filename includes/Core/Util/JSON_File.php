<?php
/**
 * Class Google\Site_Kit\Core\Util\JSON_File
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use ArrayAccess;
use InvalidArgumentException;
use JsonSerializable;

/**
 * Class for handling access to JSON files.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class JSON_File implements ArrayAccess, JsonSerializable {
	/**
	 * Path to JSON file.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	protected $file_path;

	/**
	 * Decoded JSON data.
	 *
	 * @since n.e.x.t
	 * @var mixed
	 */
	protected $data;

	/**
	 * Whether or not the file has been read yet.
	 *
	 * @since n.e.x.t
	 * @var boolean
	 */
	protected $hydrated;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $file_path Path to JSON file.
	 * @throws InvalidArgumentException If the file does not exist at the given path.
	 */
	public function __construct( $file_path ) {
		if ( ! file_exists( $file_path ) ) {
			throw new InvalidArgumentException( "No file exists at '$file_path'" );
		}
		$this->file_path = $file_path;
	}

	/**
	 * Loads the file contents and hydrates data if it has not been called yet.
	 *
	 * @since n.e.x.t
	 */
	protected function hydrate() {
		if ( $this->hydrated ) {
			return;
		}
		// Always mark as hydrated to prevent subsequent read attempts if file does not exist or not readable.
		$this->hydrated = true;

		if ( file_exists( $this->file_path ) ) {
			$contents   = file_get_contents( $this->file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents,WordPressVIPMinimum.Performance.FetchingRemoteData.FileGetContentsUnknown
			$this->data = json_decode( $contents, true );
		}
	}

	/**
	 * Checks if the key at the given offset exists.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $offset An offset to check for.
	 * @return bool
	 */
	public function offsetExists( $offset ) {
		$this->hydrate();

		return is_array( $this->data ) && array_key_exists( $offset, $this->data );
	}

	/**
	 * Gets the value at the given offset.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $offset The offset to retrieve.
	 * @return mixed|null
	 */
	public function offsetGet( $offset ) {
		return $this->offsetExists( $offset ) ? $this->data[ $offset ] : null;
	}

	/**
	 * Sets the value at the given offset (not implemented).
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $offset The offset to assign the value to.
	 * @param mixed $value  The value to set.
	 */
	public function offsetSet( $offset, $value ) {
		return; // Data is immutable.
	}

	/**
	 * Unsets the key at the given offset (not implemented).
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $offset The offset to unset.
	 */
	public function offsetUnset( $offset ) {
		return; // Data is immutable.
	}

	/**
	 * Gets the decoded contents of the JSON file.
	 *
	 * @since n.e.x.t
	 *
	 * @return array|mixed
	 */
	public function jsonSerialize() {
		$this->hydrate();

		return $this->data;
	}
}
