[![Build Status](https://travis-ci.org/DEFRA/water-abstraction-tactical-idm.svg?branch=master)](https://travis-ci.org/DEFRA/water-abstraction-tactical-idm)
[![Maintainability](https://api.codeclimate.com/v1/badges/40d67aaf281ad5123107/maintainability)](https://codeclimate.com/github/DEFRA/water-abstraction-tactical-idm/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/40d67aaf281ad5123107/test_coverage)](https://codeclimate.com/github/DEFRA/water-abstraction-tactical-idm/test_coverage)

# Introduction
This component is one of 3 that combine to give you the ability to store a document or details of a permit or pass, to link those documents to users that can view and be able to have different access for internal and external users. With a front end it will enable most processes to capture, share and view details of permits and or licence style information

__Permit Repository:__ https://github.com/DEFRA/water-abstraction-permit-repository

__IDM:__ https://github.com/DEFRA/water-abstraction-tactical-idm

__CRM:__ https://github.com/DEFRA/water-abstraction-tactical-crm

# water-abstraction-tactical-idm

The water-abstraction-tactical-idm is a lightweight identity management solution providing simple user account creation and authentication features.

The IDM is a simple standalone solution - It does not aim to provide roles, permissions, SSO or account federation.

Features include:

* User account creation with email/password
* Password reset
* Authentication
* Admin user accounts
* Auto locking of user accounts following excessive login attempts

The IDM is developed in HAPI/NodeJS and backed by a Postgres SQL database.  All data is transferred via a REST API with JWT authentication.

The REST API supports basic filtering and pagination operations on the users endpoint.

The system triggers notifications to users via a REST API, however the implementation of these is left open to developers.

Implementation of user interfaces, CRM, and access control is left open to the specific use case requirements.

## Deployment

See water-abstraction/deploy-script on internal gitlab for deployment instructions

## Development Team

This module was developed by the Water Resource Licensing Service team as part of a digital transformation project at [DEFRA](https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs), a department of the UK government

To find out more about planned reforms to the abstraction licensing service, see the policy paper: [Water abstraction plan: Abstraction licensing service](https://www.gov.uk/government/publications/water-abstraction-plan-2017/water-abstraction-plan-abstraction-licensing-service)

## Contributing to this project

If you have an idea you'd like to contribute please log an issue.

All contributions should be submitted via a pull request.

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.

## Environment Variables

The required environment variables for local development can be found in the [.env.example file](./.env.example).

