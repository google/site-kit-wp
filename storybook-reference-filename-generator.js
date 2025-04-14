const fs = require( 'fs' );
const path = require( 'path' );

const config = {
	rootDir: './',
	storyFilePattern: /\.stories\.(js|jsx|ts|tsx)$/,
	backstopConfigPath: './tests/backstop/config.js',
	viewportsPath: './tests/backstop/viewports.js',
	storybookConfigPath: './storybook/main.js',
	id: 'google-site-kit',
	referenceDir: './tests/backstop/reference',
	outputFiles: {
		fullList: 'full-list.txt',
		byStory: 'list-by-stories.txt',
		newImages: 'new-images.txt',
	},
};

function loadModule( filePath ) {
	try {
		const fullPath = path.resolve( filePath );
		// eslint-disable-next-line no-console
		console.log( `Loading module from: ${ fullPath }` );

		if ( require.cache[ require.resolve( fullPath ) ] ) {
			delete require.cache[ require.resolve( fullPath ) ];
		}

		return require( fullPath );
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.error( `Error loading module ${ filePath }: ${ err.message }` );
		return null;
	}
}

function findFilesRecursively( dir, pattern ) {
	let results = [];

	try {
		const items = fs.readdirSync( dir );

		for ( const item of items ) {
			const itemPath = path.join( dir, item );
			const stat = fs.statSync( itemPath );

			if ( stat.isDirectory() ) {
				results = results.concat(
					findFilesRecursively( itemPath, pattern )
				);
			} else if ( pattern.test( item ) ) {
				results.push( itemPath );
			}
		}
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.error( `Error reading directory ${ dir }:`, err.message );
	}

	return results;
}

function extractStorybookInfo( storyFiles ) {
	const storyInfoMap = new Map();

	storyFiles.forEach( ( file ) => {
		try {
			const content = fs.readFileSync( file, 'utf8' );

			if ( ! content.includes( '.scenario =' ) ) {
				return;
			}

			const titleMatch = content.match( /title\s*:\s*['"]([^'"]+)['"]/ );
			const title = titleMatch
				? titleMatch[ 1 ]
				: path.basename( file, path.extname( file ) );

			const fileName = path.basename( file ).split( '.' )[ 0 ];
			let componentName = fileName.replace( /stories$/i, '' );

			if ( componentName.includes( '-' ) ) {
				componentName = componentName
					.split( '-' )
					.map(
						( part ) =>
							part.charAt( 0 ).toUpperCase() + part.slice( 1 )
					)
					.join( '' );
			} else {
				componentName =
					componentName.charAt( 0 ).toUpperCase() +
					componentName.slice( 1 );
			}

			const storyRegex = /export\s+const\s+(\w+)\s*=/g;
			let storyMatch;
			let storiesFound = false;

			while ( ( storyMatch = storyRegex.exec( content ) ) !== null ) {
				const storyName = storyMatch[ 1 ];

				const scenarioRegex = new RegExp(
					`${ storyName }\\.scenario\\s*=`
				);
				if ( scenarioRegex.test( content ) ) {
					storiesFound = true;

					const displayNameRegex = new RegExp(
						`${ storyName }\\.storyName\\s*=\\s*['"]([^'"]+)['"]`
					);
					const displayNameMatch = content.match( displayNameRegex );
					const displayName = displayNameMatch
						? displayNameMatch[ 1 ]
						: storyName;

					const storyPath = `${ title }/${ displayName }`;

					if ( ! storyInfoMap.has( storyPath ) ) {
						storyInfoMap.set( storyPath, {
							title,
							componentName,
							storyName,
							displayName,
							storyPath,
						} );
					}
				}
			}

			if ( ! storiesFound && content.includes( '.scenario =' ) ) {
				const storyPath = `${ title }/Default`;

				if ( ! storyInfoMap.has( storyPath ) ) {
					storyInfoMap.set( storyPath, {
						title,
						componentName,
						storyName: 'Default',
						displayName: 'Default',
						storyPath,
					} );
				}
			}
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.error( `Error processing file ${ file }:`, err.message );
		}
	} );

	return Array.from( storyInfoMap.values() );
}

function generateFilenames( id, stories, viewports ) {
	const allFilenames = new Set();
	const byStory = {};
	const byViewport = {};

	stories.forEach( ( story ) => {
		byStory[ story.storyPath ] = [];
	} );

	viewports.forEach( ( viewport ) => {
		byViewport[ viewport.label ] = [];
	} );

	stories.forEach( ( story ) => {
		viewports.forEach( ( viewport, viewportIndex ) => {
			const formattedStoryPath = story.storyPath
				.replace( /\s+/g, '_' )
				.replace( /\//g, '_' );

			const filename = `${ id }_${ formattedStoryPath }_0_document_${ viewportIndex }_${ viewport.label }.png`;

			if ( ! allFilenames.has( filename ) ) {
				allFilenames.add( filename );
				byStory[ story.storyPath ].push( filename );
				byViewport[ viewport.label ].push( filename );
			}
		} );
	} );

	return {
		all: Array.from( allFilenames ),
		byStory,
		byViewport,
	};
}

function writeListToFile( list, filePath ) {
	try {
		const uniqueList = [ ...new Set( list ) ];

		fs.writeFileSync( filePath, uniqueList.join( '\n' ), 'utf8' );
		// eslint-disable-next-line no-console
		console.log(
			`Successfully wrote ${ uniqueList.length } entries to ${ filePath }`
		);
		return true;
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.error( `Error writing to file ${ filePath }:`, err.message );
		return false;
	}
}

function writeGroupedListToFile( groupedList, filePath ) {
	try {
		let content = '';

		Object.keys( groupedList )
			.sort()
			.forEach( ( key ) => {
				const uniqueItems = [ ...new Set( groupedList[ key ] ) ];

				content += `\n${ key }:\n`;
				uniqueItems.forEach( ( item ) => {
					content += `  - ${ item }\n`;
				} );
			} );

		fs.writeFileSync( filePath, content, 'utf8' );
		// eslint-disable-next-line no-console
		console.log(
			`Successfully wrote grouped list (${
				Object.keys( groupedList ).length
			} groups) to ${ filePath }`
		);
		return true;
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.error( `Error writing to file ${ filePath }:`, err.message );
		return false;
	}
}

function getExistingReferenceFiles( referenceDir ) {
	try {
		if ( ! fs.existsSync( referenceDir ) ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Reference directory ${ referenceDir } does not exist`
			);
			return [];
		}

		const files = fs
			.readdirSync( referenceDir )
			.filter( ( file ) => file.toLowerCase().endsWith( '.png' ) )
			.map( ( file ) => file );

		// eslint-disable-next-line no-console
		console.log( `Found ${ files.length } existing reference files` );
		return files;
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.error(
			`Error reading reference directory ${ referenceDir }:`,
			err.message
		);
		return [];
	}
}

function findMissingImages( generatedFilenames, existingFiles ) {
	const existingFilesSet = new Set( existingFiles );

	const missingFiles = generatedFilenames.filter(
		( filename ) => ! existingFilesSet.has( filename )
	);

	return [ ...new Set( missingFiles ) ];
}

try {
	const viewports = loadModule( config.viewportsPath );

	if ( ! viewports || ! Array.isArray( viewports ) ) {
		throw new Error(
			'Viewports file did not return an array of viewports'
		);
	}

	// eslint-disable-next-line no-console
	console.log(
		`Loaded ${ viewports.length } viewports from ${ config.viewportsPath }`
	);

	const id = config.id;
	// eslint-disable-next-line no-console
	console.log( `Using test ID: ${ id }` );

	// eslint-disable-next-line no-console
	console.log( `\nSearching for story files in ${ config.rootDir }...` );
	const storyFiles = findFilesRecursively(
		config.rootDir,
		config.storyFilePattern
	);
	// eslint-disable-next-line no-console
	console.log( `Found ${ storyFiles.length } story files.` );

	if ( storyFiles.length === 0 ) {
		// eslint-disable-next-line no-console
		console.log(
			'No story files found. Check your rootDir and storyFilePattern configuration.'
		);
		process.exit( 0 );
	}

	const storyInfo = extractStorybookInfo( storyFiles );
	// eslint-disable-next-line no-console
	console.log(
		`Extracted information for ${ storyInfo.length } unique stories with scenario property.`
	);

	const filenames = generateFilenames( id, storyInfo, viewports );

	// eslint-disable-next-line no-console
	console.log(
		`\nGenerated ${ filenames.all.length } total unique filenames.`
	);

	writeListToFile( filenames.all, config.outputFiles.fullList );
	writeGroupedListToFile( filenames.byStory, config.outputFiles.byStory );
	const existingFiles = getExistingReferenceFiles( config.referenceDir );
	const missingFiles = findMissingImages( filenames.all, existingFiles );
	// eslint-disable-next-line no-console
	console.log(
		`\nFound ${ missingFiles.length } unique files that need to be generated.`
	);
	writeListToFile( missingFiles, config.outputFiles.newImages );

	// eslint-disable-next-line no-console
	console.log( '\nProcess completed successfully.' );
} catch ( err ) {
	// eslint-disable-next-line no-console
	console.error( 'Error:', err.message );
	// eslint-disable-next-line no-console
	console.error( err.stack );
}
