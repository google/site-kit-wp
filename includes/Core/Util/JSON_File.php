<?php
/**
 * Class Google\Site_Kit\Core\Util\JSON_File
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use ArrayAccess;
use ArrayIterator;
use IteratorAggregate;
use JsonSerializable;

/**
 * Class for handling access to JSON files.
 *
 * @since 1.22.0
 * @access private
 * @ignore
 */
class JSON_File implements ArrayAccess, IteratorAggregate, JsonSerializable {
	/**
	 * Path to JSON file.
	 *
	 * @since 1.22.0
	 * @var string
	 */
	protected $file_path;

	/**
	 * Decoded JSON data.
	 *
	 * @since 1.22.0
	 * @var mixed
	 */
	protected $data;

	/**
	 * Whether or not the file has been read yet.
	 *
	 * @since 1.22.0
	 * @var boolean
	 */
	protected $hydrated;

	/**
	 * Constructor.
	 *
	 * @since 1.22.0
	 *
	 * @param string $file_path Path to JSON file.
	 */
	public function __construct( $file_path ) {
		$this->file_path = $file_path;
	}

	/**
	 * Loads the file contents and hydrates data if it has not been called yet.
	 *
	 * @since 1.22.0
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
	 * @since 1.22.0
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
	 * @since 1.22.0
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
	 * @since 1.22.0
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
	 * @since 1.22.0
	 *
	 * @param mixed $offset The offset to unset.
	 */
	public function offsetUnset( $offset ) {
		return; // Data is immutable.
	}

	/**
	 * Gets the decoded contents of the JSON file.
	 *
	 * @since 1.22.0
	 *
	 * @return array|mixed
	 */
	public function jsonSerialize() {
		$this->hydrate();

		return $this->data;
	}

	/**
	 * Retrieve an iterator instance for the JSON data.
	 *
	 * @since 1.25.0
	 *
	 * @return ArrayIterator|\Traversable
	 */
	public function getIterator() {
		$array_data = $this->jsonSerialize();
		$array_data = is_array( $array_data ) ? $array_data : array();
		return new ArrayIterator( $array_data );
	}
}
