<?php
/**
 * Class Google\Site_Kit\Codegen\Composer
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable WordPress.WP.AlternativeFunctions
 * phpcs:disable WordPress.PHP.DiscouragedPHPFunctions
 * phpcs:disable WordPressVIPMinimum
 */

namespace Google\Site_Kit\Codegen;

use Composer\Script\Event;

/**
 * Class for integrating Code generation into Composer lifecycle events.
 *
 * @access private
 * @ignore
 */
class Composer {

	/**
	 * Synchronizes generated package sources.
	 *
	 * @param Event $event Composer script event.
	 */
	public static function sync_packages( Event $event ) {
		$io            = $event->getIO();
		$repo_root     = dirname( $event->getComposer()->getConfig()->get( 'vendor-dir' ) );
		$packages_root = $repo_root . '/packages';
		$library_lock  = trim( file_get_contents( "$repo_root/codegen/library.lock" ) );
		$apis          = json_decode( file_get_contents( "$repo_root/codegen/apis.json" ) );

		$start_time      = time();
		$command_map     = array();
		$generated_count = 0;

		foreach ( $apis as list( $name, $version ) ) {
			$api_id = "$name:$version";
			$io->debug( "Processing $api_id..." );

			$discovery_doc_path = "$repo_root/codegen/apis/$name.$version.json";

			// This file should always exist, but apis could be out of sync with discovery docs on disk.
			if ( ! file_exists( $discovery_doc_path ) ) {
				$io->warning( "Discovery doc missing for $api_id!" );
				continue;
			}

			$discovery_doc_hash = md5_file( $discovery_doc_path );
			$package_identifier = "$discovery_doc_hash:$library_lock";
			// See https://getcomposer.org/doc/04-schema.md#name.
			$project_name = "apiclient-services-$name.$version";
			$package_root = "$packages_root/$project_name";

			// Skip this package if it already exists and has the same identifier.
			if ( self::package_identifier_matches( "$package_root/composer.json", $package_identifier ) ) {
				$io->info( "$api_id is up to date." );
				continue;
			}

			self::initialize_package_destination( $package_root );

			$command_map[ $api_id ] = array(
				'command'    => self::build_generation_command( $discovery_doc_path, $package_root, $library_lock ),
				'on_success' => fn() => self::write_package_files( $project_name, $package_identifier, $packages_root ),
			);
		}

		if ( $command_map ) {
			$io->notice( sprintf( 'Generating %d apiclient-services packages...', count( $command_map ) ) );
		} else {
			$io->notice( 'All apiclient-services packages are up-to-date. ' );
			return;
		}

		// Execute generation commands in parallel.
		$processes = array_map(
			fn( $cmd ) => proc_open( $cmd['command'], array(), $pipes ),
			$command_map
		);

		foreach ( $processes as $api_id => $resource ) {
			// This will block until the process is finished
			// which is fine because processes are still running in parallel
			// so this loop will still take about as long as the longest process
			// to finish.
			$exit_code = proc_close( $resource );

			if ( 0 !== $exit_code ) {
				$io->warning( "Generation failed for $api_id." );
				continue;
			}

			// At this point, the client was generated into the package's src directory.
			$command_map[ $api_id ]['on_success']();
			++$generated_count;

			$io->notice( "Generated $api_id successfully." );
		}

		$duration = time() - $start_time;
		$io->info( "Generated $generated_count apiclient-services packages in $duration seconds." );
	}

	/**
	 * Checks if the package at the given path has the same identifier as the given.
	 *
	 * @param string $composer_json_path Path to composer.json file.
	 * @param string $identifier         A value to test against the identifier in the composer.json.
	 *
	 * @return bool
	 */
	protected static function package_identifier_matches( string $composer_json_path, string $identifier ) {
		if ( ! file_exists( $composer_json_path ) ) {
			return false;
		}

		$json = file_get_contents( $composer_json_path );
		$data = json_decode( $json );

		if ( empty( $data->extra->identifier ) ) {
			return false;
		}

		return $data->extra->identifier === $identifier;
	}

	/**
	 * Writes non-generated package files.
	 *
	 * @param string $project_name  Composer project name.
	 * @param string $identifier    Package identifier.
	 * @param string $packages_root Path to packages directory.
	 */
	protected static function write_package_files( string $project_name, string $identifier, string $packages_root ): void {
		$composer_json = array(
			'name'        => "google/$project_name",
			'version'     => 'dev-generated', // Use a fixed version as it's managed in place.
			'description' => 'This package is @generated automatically',
			'extra'       => array(
				'identifier' => $identifier,
			),
		);
		// Generate the new composer.json.
		file_put_contents(
			"$packages_root/$project_name/composer.json",
			json_encode( $composer_json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES )
		);
		// Ensure the generated contents are always excluded from version control.
		file_put_contents(
			"$packages_root/$project_name/.gitignore",
			'**/*'
		);
	}

	/**
	 * Initializes the target directory to generate the given package from a clean state.
	 *
	 * @param string $package_root Root directory to package.
	 */
	protected static function initialize_package_destination( string $package_root ): void {
		// Move any existing files to tmp to clear the destination.
		if ( file_exists( $package_root ) ) {
			$temp_dir = sys_get_temp_dir();
			$basename = basename( $package_root );
			rename( $package_root, "$temp_dir/$basename-" . time() );
		}

		// Scaffold the package directories.
		mkdir( $package_root );
		mkdir( $package_root . '/src' );
	}

	/**
	 * Builds a system command to run the code generator for this package as a list of arguments.
	 *
	 * @param string $discovery_doc_path Path to discovery document JSON file.
	 * @param string $package_root       Root directory to package.
	 * @param string $library_lock       Library lock version.
	 * @return string[]
	 */
	protected static function build_generation_command( string $discovery_doc_path, string $package_root, string $library_lock ): array {
		$command   = array( 'docker', 'run', '--rm' );
		$command[] = '-v';
		$command[] = "$discovery_doc_path:/usr/app/input.json:ro";
		$command[] = '-v';
		$command[] = "$package_root/src:/tmp/generated:rw";
		$command[] = "ghcr.io/google/site-kit-wp/codegen:$library_lock";
		$command[] = '--input=/usr/app/input.json';
		$command[] = '--output_dir=/tmp/generated';

		return $command;
	}
}
