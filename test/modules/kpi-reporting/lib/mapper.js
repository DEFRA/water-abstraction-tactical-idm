'use-strict'

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { mapRegistrations } = require('../../../../src/modules/kpi-reporting/lib/mapper')

experiment('modules/kpi-reporting/lib/mapper', () => {
  const repoData = [
    {
      month: 12,
      internal: 1,
      external: 2,
      current_year: false
    },
    {
      month: 3,
      internal: 3,
      external: 3,
      current_year: true
    },
    {
      month: 2,
      internal: 1,
      external: 1,
      current_year: true
    },
    {
      month: 1,
      internal: 2,
      external: 2,
      current_year: true
    }
  ]

  experiment('returns the correct mapped data', () => {
    test('returns the correct array of objects', async () => {
      const mappedData = mapRegistrations(repoData)
      expect(mappedData.totals.allTime).to.equal(15)
      expect(mappedData.totals.ytd).to.equal(12)
      expect(mappedData.monthly.length).to.equal(3)
      expect(mappedData.monthly[0].month).to.equal('March')
      expect(mappedData.monthly[0].internal).to.equal(3)
      expect(mappedData.monthly[0].external).to.equal(3)
      expect(mappedData.monthly[0].year).to.equal(new Date().getFullYear())
      expect(mappedData.monthly[1].month).to.equal('February')
      expect(mappedData.monthly[1].internal).to.equal(1)
      expect(mappedData.monthly[1].external).to.equal(1)
      expect(mappedData.monthly[1].year).to.equal(new Date().getFullYear())
    })
  })
})
