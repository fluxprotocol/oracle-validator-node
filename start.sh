#!/usr/bin/env bash


# check if npm install has been run
if ! [[ -d node_modules ]]
then
    echo "'node_modules' not found, building..."
    npm install
fi

# check if .env file exists
if ! [[ -f .env.development ]] && ! [[ -f .env.production ]]
then
    echo "'.env.development' or '.env.production' not found."
    echo "Run 'npm run copyNearCredentials -- --account_id <account_id>' to populate .env with your locally stored NEAR credentials."
    exit 0
fi

# set .env location if not passed as argument
if [ -z ${1+x} ] # argument 1 is unset
then
    echo "Which profile would you like to use?"
    echo "1 => light node (oracle validator node)"
    echo "2 => full node (oracle validator node, NEAR node, explorer API)"
    echo ""

    read PROFILEINPUT

    if [ $PROFILEINPUT == 1 ]
    then
        PROFILESELECTION='light-node'
    elif [ $PROFILEINPUT == 2 ]
    then
        PROFILESELECTION='full-node'
    else
        echo "Invalid selection"
        exit 0
    fi
else
    PROFILESELECTION=$1
fi
echo "$PROFILESELECTION selected."

# set .env location if not passed as argument
if [ -z ${2+x} ] # argument 2 is unset
then
    echo "Which .env would you like to use?"
    echo "1 => .env.development"
    echo "2 => .env.production"
    echo "_ => other"
    echo ""

    read ENVINPUT

    if [ $ENVINPUT == 1 ]
    then
        ENVLOCATION='.env.development'
    elif [ $ENVINPUT == 2 ]
    then
        ENVLOCATION='.env.production'
    else
        ENVLOCATION=ENVINPUT
    fi
else
    ENVLOCATION=$2
fi
echo "$ENVLOCATION selected."

docker-compose --profile $PROFILESELECTION --env-file $ENVLOCATION up
