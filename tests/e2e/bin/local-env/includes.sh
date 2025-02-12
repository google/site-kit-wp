#!/bin/bash

# Common variables.
DOCKER_COMPOSE_FILE_OPTIONS="-f $(dirname "$0")/docker-compose.yml"
# These are the containers and values for the development site.
CLI='cli'
CONTAINER='wordpress'
SITE_TITLE='Google Site Kit Dev'
# Set the name of the Docker Compose project.
export COMPOSE_PROJECT_NAME='googlesitekit-e2e'

# TTY compatibility.
# For some environments, a TTY may not be available (e.g. GitHub Actions).
# Docker Compose allocates a TTY by default, so it's important that we disable it
# automatically when needed.
if [ -t 0 ]; then
	COMPOSE_EXEC_ARGS=""
else
	COMPOSE_EXEC_ARGS="-T" # Disable pseudo-tty allocation. By default `docker compose exec` allocates a TTY.
fi

##
# Ask a Yes/No question, and way for a reply.
#
# This is a general-purpose function to ask Yes/No questions in Bash, either with or without a default
# answer. It keeps repeating the question until it gets a valid answer.
#
# @param {string} prompt    The question to ask the user.
# @param {string} [default] Optional. "Y" or "N", for the default option to use if none is entered.
# @param {int}    [timeout] Optional. The number of seconds to wait before using the default option.
#
# @returns {bool} true if the user replies Yes, false if the user replies No.
##
ask() {
    # Source: https://djm.me/ask
    local timeout endtime timediff prompt default reply

    while true; do

		timeout="${3:-}"

        if [ "${2:-}" = "Y" ]; then
            prompt="Y/n"
            default=Y
        elif [ "${2:-}" = "N" ]; then
            prompt="y/N"
            default=N
        else
            prompt="y/n"
            default=
			timeout=
        fi

		if [ -z "$timeout" ]; then
        	# Ask the question (not using "read -p" as it uses stderr not stdout)
        	echo -en "$1 [$prompt] "

        	# Read the answer (use /dev/tty in case stdin is redirected from somewhere else)
        	read reply </dev/tty
		else
			endtime=$((`date +%s` + $timeout));
			while [ "$endtime" -ge `date +%s` ]; do
				timediff=$(($endtime - `date +%s`))

				echo -en "\r$1 [$prompt] (Default $default in ${timediff}s) "
				read -t 1 reply </dev/tty

				if [ -n "$reply" ]; then
					break
				fi
			done
		fi

        # Default?
        if [ -z "$reply" ]; then
            reply=$default
        fi

        # Check if the reply is valid
        case "$reply" in
            Y*|y*) return 0 ;;
            N*|n*) return 1 ;;
        esac

    done
}

##
# Download from a remote source.
#
# Checks for the existence of curl and wget, then downloads the remote file using the first available option.
#
# @param {string} remote  The remote file to download.
# @param {string} [local] Optional. The local filename to use. If it isn't passed, STDOUT is used.
#
# @return {bool} Whether the download succeeded or not.
##
download() {
    if command_exists "curl"; then
        curl -s -o "${2:--}" "$1"
    elif command_exists "wget"; then
		wget -nv -O "${2:--}" "$1"
    fi
}

##
# Add error message formatting to a string, and echo it.
#
# @param {string} message The string to add formatting to.
##
error_message() {
	echo -e "\033[31mERROR\033[0m: $1"
}

##
# Add warning message formatting to a string, and echo it.
#
# @param {string} message The string to add formatting to.
##
warning_message() {
	echo -e "\033[33mWARNING\033[0m: $1"
}

##
# Add status message formatting to a string, and echo it.
#
# @param {string} message The string to add formatting to.
##
status_message() {
	echo -e "\033[32mSTATUS\033[0m: $1"
}

##
# Add formatting to an action string.
#
# @param {string} message The string to add formatting to.
##
action_format() {
	echo -en "\033[32m$1\033[0m"
}

##
# Check if the command exists as some sort of executable.
#
# The executable form of the command could be an alias, function, builtin, executable file or shell keyword.
#
# @param {string} command The command to check.
#
# @return {bool} Whether the command exists or not.
##
command_exists() {
	type -t "$1" >/dev/null 2>&1
}

##
# Docker Compose helper
#
# Calls `docker compose` with common options.
##
dc() {
	docker compose $DOCKER_COMPOSE_FILE_OPTIONS "$@"
}

##
# WP CLI
#
# Executes a WP CLI request in the CLI container.
##
wp() {
	dc exec $COMPOSE_EXEC_ARGS -u xfs $CLI wp "$@"
}

##
# WordPress Container helper.
#
# Executes the given command in the wordpress container.
##
container() {
	dc exec $COMPOSE_EXEC_ARGS $CONTAINER "$@"
}
