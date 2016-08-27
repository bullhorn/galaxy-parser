# Galaxy Parser

> Parser tool to read and parse the code metric files that your build already generates and pushes them into Galaxy

*NOTE:* Galaxy does not do any code analysis or anything, it will just parse files of code coverage, eslint, etc that your project already produces.

## Prerequisites

The *bare* minimum to report into galaxy is to have code coverage reporting in one of the supported formats.

#### Supported Code Coverage Formats

* LCOV (JavaScript/? projects)
* JACOCO XML (Java projects)

## Installation

    npm install --save-dev galaxy-parser

## Getting your project reporting into Galaxy

1) Create a `package.json` / Modify the existing `package.json`

2) Add an entry to the `package.json` for `galaxy`

    "galaxy": {
        "type": "javascript", // type of the project that we are reporting on (javascript|java|php)
        "goal": 80, // goal set for the unit test coverage number (defaults to 80 if not provided),
        "threshold": 0.15 // threshold to not report changes to slack (defaults to 0.10 if not provided) 
        "locations": {
          "eslint": "/coverage/eslint.json", // location of where the eslint.json file is for eslint parsing
          "sloc": "/coverage/sloc.json", // location of where the sloc.json file is for line of code parsing
          "lcov": "/coverage/lcov.info", // location of where the code coverage is saved
          "jacoco": "/coverage/jacoco.xml" // location of where jacoco saves the xml file
        }
    }
    
*NOTE:* Projects will only have *one (1)* code coverage metric, either `lcov` or `jacoco` at this point in time!

3) Add some scripts to your `package.json` to manage run the report

This will be different based on the type of project you are working on, this is an example for a `JavaScript` project:

    "lint:save": "eslint src -f node_modules/galaxy-parser/formatters/eslint.js > ./coverage/eslint.json",
    "loc": "sloc src/ --format json > ./coverage/sloc.json",
    "pregalaxy": "npm run lint:save && npm run loc",
    "galaxy": "galaxy analyze"
    
Any project that is not `JavaScript` will most likely just have the following:

    "loc": "sloc src/ --format json > ./coverage/sloc.json",
    "pregalaxy": "npm run loc",
    "galaxy": "galaxy analyze"
    
4) Add the NPM run scripts into your build process

This will vary on what CI tool that you are using, here are some examples for Jenkins and Travis

Jenkins

    // execute shell script (after everything else is done / test coverage ran)
    npm run galaxy -- FIREBASE_URL SLACK_WEB_HOOK SLACK_CHANNEL

Travis
    
    after_success:
      - test $TRAVIS_BRANCH = "master" && npm run galaxy $FIREBASE_URL $SLACK_WEB_HOOK $SLACK_CHANNEL
      
5) Add private environment variables for `FIREBASE_URL`, `SLACK_WEB_HOOK` and `SLACK_CHANNEL` 

## Example Integrations

* [Novo-Elements (JavaScript)](https://github.com/bullhorn/novo-elements/commit/3de0a2032a7c0f96655f3bd0df2d7ee8dc3c7950)
* [DataLoader (Java)]()