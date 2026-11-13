<?php
/**
 * Script to prefix production dependencies into the `third-party` directory using PHP-Scoper.
 *
 * Prefixing every dependency takes a while, so after each run a fingerprint of every
 * package's files is stored, and subsequent runs only prefix packages which were added
 * or changed since, and delete the output of packages which were removed.
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
use SplFileInfo;

/**
 * Computes a fingerprint of all files in a package directory which PHP-Scoper could process.
 *
 * Dot files and directories are skipped since PHP-Scoper ignores them too.
 *
 * @param string $dir Absolute path to the package directory.
 * @return string Fingerprint of the files in the directory.
 */
function fingerprint_package( $dir ) {
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
		hash_update( $context, $relative_path . "\0" . md5_file( $path ) . "\n" );
	}

	return hash_final( $context );
}

/**
 * Gets the non-dev packages installed by Composer, with a fingerprint of each.
 *
 * @param string $vendor_dir Absolute path to the vendor directory.
 * @return array Map of package names to fingerprints, sorted by name.
 */
function get_packages( $vendor_dir ) {
	$installed = include "$vendor_dir/composer/installed.php";
	$packages  = array();

	foreach ( $installed['versions'] as $name => $package ) {
		// Skip dev packages, the root package and packages which are not installed (e.g. replaced or provided).
		if ( $package['dev_requirement'] || $installed['root']['name'] === $name || empty( $package['install_path'] ) ) {
			continue;
		}

		$install_path = realpath( $package['install_path'] );
		if ( $install_path ) {
			$packages[ $name ] = fingerprint_package( $install_path );
		}
	}

	ksort( $packages );

	return $packages;
}

/**
 * Recursively deletes a directory if it exists, then its parent if left empty (e.g. `third-party/firebase`).
 *
 * @param string $dir Absolute path to the directory to delete.
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
		if ( $file->isDir() && ! $file->isLink() ) {
			rmdir( $file->getPathname() );
		} else {
			unlink( $file->getPathname() );
		}
	}
	rmdir( $dir );

	$parent = dirname( $dir );
	if ( ! ( new FilesystemIterator( $parent ) )->valid() ) {
		rmdir( $parent );
	}
}

/**
 * Runs PHP-Scoper, exiting if it fails.
 *
 * @param string     $root       Absolute path to the plugin root directory.
 * @param string     $output_dir Absolute path to the directory to write prefixed files to. It is deleted first.
 * @param array|null $packages   Optional. Names of the packages to prefix, or null to prefix all non-dev packages.
 */
function run_scoper( $root, $output_dir, $packages = null ) {
	putenv( 'GOOGLESITEKIT_PREFIX_PACKAGES=' . ( $packages ? implode( ',', $packages ) : '' ) );

	$command = sprintf(
		'%s -dxdebug.mode=off %s add --output-dir=%s --force --quiet',
		escapeshellarg( PHP_BINARY ),
		escapeshellarg( "$root/php-scoper/vendor/bin/php-scoper" ),
		escapeshellarg( $output_dir )
	);
	passthru( $command, $exit_code );

	if ( 0 !== $exit_code ) {
		fwrite( STDERR, "PHP-Scoper failed with exit code $exit_code.\n" );
		exit( $exit_code );
	}
}

$root       = dirname( __DIR__ );
$vendor_dir = "$root/vendor";
$output_dir = "$root/third-party";
// Composer never installs the root package into its own vendor directory, so this location is ours to use.
$state_dir  = "$vendor_dir/google/google-site-kit";
$state_file = "$state_dir/prefix-dependencies-state.json";
$temp_dir   = "$state_dir/prefix-dependencies-tmp";

// PHP-Scoper reads `scoper.inc.php` from the working directory.
chdir( $root );

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
	|| empty( $previous_state['config'] )
	|| $previous_state['config'] !== $config_fingerprint
	|| ! isset( $previous_state['packages'] );

// Delete the state before changing any output, so an interrupted run prefixes everything next time.
if ( file_exists( $state_file ) ) {
	unlink( $state_file );
}

if ( $prefix_all ) {
	echo 'Prefixing all ' . count( $packages ) . " dependencies...\n";
	run_scoper( $root, $output_dir );
} else {
	$previous_packages = $previous_state['packages'];
	$changed_packages  = array_keys(
		array_filter(
			$packages,
			fn ( $fingerprint, $name ) => ! isset( $previous_packages[ $name ] ) || $previous_packages[ $name ] !== $fingerprint,
			ARRAY_FILTER_USE_BOTH
		)
	);
	$removed_packages  = array_keys( array_diff_key( $previous_packages, $packages ) );

	foreach ( $removed_packages as $name ) {
		echo "Removing prefixed $name...\n";
		remove_dir( "$output_dir/$name" );
	}

	if ( $changed_packages ) {
		echo 'Prefixing ' . count( $changed_packages ) . ' new or changed dependencies: ' . implode( ', ', $changed_packages ) . "...\n";

		// Prefix into a temporary directory first because PHP-Scoper deletes the output directory.
		run_scoper( $root, $temp_dir, $changed_packages );

		foreach ( $changed_packages as $name ) {
			remove_dir( "$output_dir/$name" );

			if ( is_dir( "$temp_dir/$name" ) ) {
				if ( ! is_dir( dirname( "$output_dir/$name" ) ) ) {
					mkdir( dirname( "$output_dir/$name" ), 0777, true );
				}
				rename( "$temp_dir/$name", "$output_dir/$name" );
			}
		}

		remove_dir( $temp_dir );
	} elseif ( ! $removed_packages ) {
		echo "All prefixed dependencies are up to date.\n";
	}
}

if ( ! is_dir( $state_dir ) ) {
	mkdir( $state_dir, 0777, true );
}

file_put_contents(
	$state_file,
	json_encode(
		array(
			'config'   => $config_fingerprint,
			'packages' => $packages,
		),
		JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
	)
);
