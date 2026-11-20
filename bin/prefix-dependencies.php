<?php
/**
 * Script to prefix production dependencies into the `third-party` directory using PHP-Scoper.
 *
 * Prefixing every dependency takes a while, so after each run a fingerprint of every
 * package's files and of its prefixed output is stored. Subsequent runs only prefix
 * packages which were added or changed since, or whose prefixed output no longer
 * matches, and delete the output of packages which were removed.
 *
 * Everything is prefixed again when there is no previous state (e.g. after deleting
 * `vendor` or `third-party`), when the PHP-Scoper configuration, PHP-Scoper itself or
 * this script change, or when the `--all` argument is passed.
 *
 * Usage: php bin/prefix-dependencies.php [--all]
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable WordPress.WP.AlternativeFunctions
 * phpcs:disable WordPress.PHP.DiscouragedPHPFunctions
 * phpcs:disable WordPress.Security.EscapeOutput
 * phpcs:disable WordPressVIPMinimum
 */

namespace Google\Site_Kit\Bin\Prefix_Dependencies;

use FilesystemIterator;
use RecursiveCallbackFilterIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use SplFileInfo;
use Throwable;

/**
 * Computes a fingerprint of all files in a directory.
 *
 * Dot files and directories are skipped since PHP-Scoper ignores them too.
 *
 * @param string $dir Absolute path to the directory.
 * @return string|null Fingerprint of the files in the directory, or null if it does not exist.
 * @throws RuntimeException If a file cannot be read.
 */
function fingerprint_dir( $dir ) {
	if ( ! is_dir( $dir ) ) {
		return null;
	}

	$iterator = new RecursiveIteratorIterator(
		new RecursiveCallbackFilterIterator(
			new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS | FilesystemIterator::UNIX_PATHS ),
			fn ( SplFileInfo $file ) => '.' !== $file->getFilename()[0]
		)
	);

	$files = array();
	foreach ( $iterator as $file ) {
		$files[ substr( $file->getPathname(), strlen( $dir ) ) ] = $file->getPathname();
	}
	ksort( $files );

	$context = hash_init( 'md5' );
	foreach ( $files as $relative_path => $path ) {
		$file_hash = md5_file( $path );
		if ( false === $file_hash ) {
			throw new RuntimeException( "Could not read $path." );
		}
		hash_update( $context, $relative_path . "\0" . $file_hash . "\n" );
	}

	return hash_final( $context );
}

/**
 * Gets the production packages installed by Composer, with a fingerprint of each.
 *
 * This is the only place which decides which packages are prefixed.
 *
 * @param string $vendor_dir Absolute path to the vendor directory.
 * @return array Map of package names to fingerprints of their files, sorted by name.
 */
function get_packages( $vendor_dir ) {
	$installed = require "$vendor_dir/composer/installed.php";
	$packages  = array();

	foreach ( $installed['versions'] as $name => $package ) {
		// Skip dev packages, the root package and packages which are not installed (e.g. replaced or provided).
		if ( $package['dev_requirement'] || $installed['root']['name'] === $name || empty( $package['install_path'] ) ) {
			continue;
		}

		$install_path = realpath( $package['install_path'] );
		if ( $install_path ) {
			$packages[ $name ] = fingerprint_dir( $install_path );
		}
	}

	ksort( $packages );

	return $packages;
}

/**
 * Creates a directory (and its parents) if it does not exist.
 *
 * @param string $dir Absolute path to the directory.
 * @throws RuntimeException If the directory cannot be created.
 */
function ensure_dir( $dir ) {
	if ( ! is_dir( $dir ) && ! mkdir( $dir, 0777, true ) ) {
		throw new RuntimeException( "Could not create $dir." );
	}
}

/**
 * Recursively deletes a directory if it exists.
 *
 * @param string $dir Absolute path to the directory to delete.
 * @throws RuntimeException If a file or directory cannot be deleted.
 */
function remove_dir( $dir ) {
	if ( ! is_dir( $dir ) ) {
		return;
	}

	$iterator = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS ),
		RecursiveIteratorIterator::CHILD_FIRST
	);
	foreach ( $iterator as $file ) {
		$deleted = $file->isDir() && ! $file->isLink() ? rmdir( $file->getPathname() ) : unlink( $file->getPathname() );
		if ( ! $deleted ) {
			throw new RuntimeException( "Could not delete {$file->getPathname()}." );
		}
	}

	if ( ! rmdir( $dir ) ) {
		throw new RuntimeException( "Could not delete $dir." );
	}
}

/**
 * Deletes the prefixed output of a package, and its vendor directory if left empty (e.g. `third-party/firebase`).
 *
 * @param string $output_dir Absolute path to the output directory.
 * @param string $name       Package name.
 * @throws RuntimeException If a file or directory cannot be deleted.
 */
function remove_package_output( $output_dir, $name ) {
	remove_dir( "$output_dir/$name" );

	$vendor_name_dir = dirname( "$output_dir/$name" );
	if ( is_dir( $vendor_name_dir ) && ! ( new FilesystemIterator( $vendor_name_dir ) )->valid() && ! rmdir( $vendor_name_dir ) ) {
		throw new RuntimeException( "Could not delete $vendor_name_dir." );
	}
}

/**
 * Runs PHP-Scoper for the given packages.
 *
 * @param string $root       Absolute path to the plugin root directory.
 * @param string $output_dir Absolute path to the directory to write prefixed files to. It is deleted first.
 * @param array  $packages   Names of the packages to prefix.
 * @throws RuntimeException If PHP-Scoper fails.
 */
function run_scoper( $root, $output_dir, array $packages ) {
	// Read by scoper.inc.php.
	putenv( 'GOOGLESITEKIT_PREFIX_PACKAGES=' . implode( ',', $packages ) );

	$command = sprintf(
		'%s -dxdebug.mode=off %s add --output-dir=%s --force --quiet',
		escapeshellarg( PHP_BINARY ),
		escapeshellarg( "$root/php-scoper/vendor/bin/php-scoper" ),
		escapeshellarg( $output_dir )
	);
	passthru( $command, $exit_code );

	if ( 0 !== $exit_code ) {
		throw new RuntimeException( "PHP-Scoper failed with exit code $exit_code." );
	}
}

$root       = dirname( __DIR__ );
$vendor_dir = "$root/vendor";
$output_dir = "$root/third-party";
// Composer never installs the root package into its own vendor directory, so this location is ours to use.
$state_dir  = "$vendor_dir/google/google-site-kit";
$state_file = "$state_dir/prefix-dependencies-state.json";
// Next to the output directory so that prefixed packages can be moved into it without copying.
$temp_dir = "$root/.tmp-prefix-dependencies";

try {
	// PHP-Scoper reads `scoper.inc.php` from the working directory.
	chdir( $root );

	// Delete anything left behind by an interrupted run.
	remove_dir( $temp_dir );

	$config_fingerprint = md5(
		implode(
			"\n",
			array_map(
				'md5_file',
				array( "$root/scoper.inc.php", "$root/php-scoper/composer.lock", __FILE__ )
			)
		)
	);
	$packages           = get_packages( $vendor_dir );
	$previous_state     = is_readable( $state_file ) ? json_decode( file_get_contents( $state_file ), true ) : null;
	$prefix_all         = in_array( '--all', array_slice( $argv, 1 ), true )
		|| ! is_dir( $output_dir )
		|| ! is_array( $previous_state )
		|| ! isset( $previous_state['config'] )
		|| $previous_state['config'] !== $config_fingerprint
		|| ! isset( $previous_state['packages'] )
		|| ! is_array( $previous_state['packages'] );

	// Delete the state before changing any output, so a failed or interrupted run prefixes everything next time.
	if ( file_exists( $state_file ) && ! unlink( $state_file ) ) {
		throw new RuntimeException( "Could not delete $state_file." );
	}

	$output_fingerprints = array();
	$removed_packages    = array();

	if ( $prefix_all ) {
		$packages_to_prefix = array_keys( $packages );

		echo 'Prefixing all ' . count( $packages_to_prefix ) . " dependencies...\n";
		remove_dir( $output_dir );
	} else {
		$previous_packages  = $previous_state['packages'];
		$packages_to_prefix = array();

		foreach ( $packages as $name => $fingerprint ) {
			$output_fingerprints[ $name ] = fingerprint_dir( "$output_dir/$name" );

			// Prefix packages which are new or changed, or whose output was changed or deleted since the last run.
			if (
				! isset( $previous_packages[ $name ]['input'] )
				|| $previous_packages[ $name ]['input'] !== $fingerprint
				|| ! array_key_exists( 'output', $previous_packages[ $name ] )
				|| $previous_packages[ $name ]['output'] !== $output_fingerprints[ $name ]
			) {
				$packages_to_prefix[] = $name;
			}
		}

		$removed_packages = array_keys( array_diff_key( $previous_packages, $packages ) );

		if ( $packages_to_prefix ) {
			echo 'Prefixing ' . count( $packages_to_prefix ) . ' new or changed dependencies: ' . implode( ', ', $packages_to_prefix ) . "...\n";
		} elseif ( ! $removed_packages ) {
			echo "All prefixed dependencies are up to date.\n";
		}
	}

	foreach ( $removed_packages as $name ) {
		echo "Removing prefixed $name...\n";
		remove_package_output( $output_dir, $name );
	}

	if ( $packages_to_prefix ) {
		// Prefix into a temporary directory first because PHP-Scoper deletes the output directory.
		run_scoper( $root, $temp_dir, $packages_to_prefix );

		foreach ( $packages_to_prefix as $name ) {
			remove_package_output( $output_dir, $name );

			if ( is_dir( "$temp_dir/$name" ) ) {
				ensure_dir( dirname( "$output_dir/$name" ) );
				if ( ! rename( "$temp_dir/$name", "$output_dir/$name" ) ) {
					throw new RuntimeException( "Could not move $temp_dir/$name to $output_dir/$name." );
				}
			}

			$output_fingerprints[ $name ] = fingerprint_dir( "$output_dir/$name" );
		}

		remove_dir( $temp_dir );
	}

	$state = array(
		'config'   => $config_fingerprint,
		'packages' => array(),
	);
	foreach ( $packages as $name => $fingerprint ) {
		$state['packages'][ $name ] = array(
			'input'  => $fingerprint,
			'output' => $output_fingerprints[ $name ],
		);
	}

	ensure_dir( $state_dir );
	file_put_contents( $state_file, json_encode( $state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) );
} catch ( Throwable $e ) {
	fwrite( STDERR, $e->getMessage() . "\n" );
	exit( 1 );
}
