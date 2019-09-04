const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')

describe('Protected Endpoints', function(){
    let db;

const { testUsers, testThings, testReviews } = helpers.makeThingsFixtures

before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  describe(`POST /api/reviews`, () => {
    beforeEach('insert things', () =>
      helpers.seedThingsTables(
        db,
        testUsers,
        testThings,
        testReviews
      )
    )

    const protectedEndpoints = [
        {
            name: 'GET /api/things/:thing_id',
            path: '/api/things/1'
        },
        {
            name: 'GET /api/things/:thing_id/reviews',
            path: '/api/thing/1/reviews'
        }
    ];
    protectedEndpoints.forEach(endpoint => {
        describe(endpoint.name, () => {
            it('responds with 401 missing token when no bearer token provided', () => {
                return supertest(app)
                .get(endpoint.path)
                .expected(401, { error: 'Missing bearer token'});
            });
            it('responds with 401 "Unathorized request" when invalid', () => {
                const testUsers= testUsers[0];

                return supertest(app)
                .get(endpoint.path)
                .set(
                    'Authorization',
                    helpers.makeAuthHeader
                )
                .expect(401, { error: 'Unathorized request' });

            });
        });
    })
  })
})